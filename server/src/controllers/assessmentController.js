import { RiskAssessment } from '../models/RiskAssessment.js';
import { Location } from '../models/Location.js';
import { Sensor } from '../models/Sensor.js';
import { calculateLandslideHazardIndex, LHI_CONFIG } from '../services/hazardIndexService.js';
import { broadcastAssessment } from '../sockets/socketManager.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const assessmentController = {
  async getLatestAssessments(req, res, next) {
    try {
      const locations = await Location.find({ monitoringStatus: 'active' });
      const assessments = await Promise.all(
        locations.map(async (loc) => {
          let latest = await RiskAssessment.findOne({ location: loc._id })
            .sort({ evaluatedAt: -1 })
            .populate('location', 'name code region latitude longitude slopeAngle elevation');
          
          if (!latest) {
            // Provide a baseline default assessment if none exists yet
            latest = {
              location: loc,
              riskScore: loc.currentRiskScore || 15,
              riskLevel: loc.currentRiskLevel || 'Low',
              factors: {
                rainfallScore: 10,
                soilMoistureScore: 20,
                displacementScore: 5,
                porePressureScore: 10,
                slopeFactor: 1.0,
                weights: LHI_CONFIG.weights
              },
              dataQuality: {
                status: 'optimal',
                missingSensors: [],
                staleSensors: [],
                freshnessPenalty: 0
              },
              confidenceRating: loc.isDemo ? 'Decision Support Advisory (Demonstration Telemetry)' : 'Active Telemetry Verified',
              evaluatedAt: loc.lastAssessmentAt || new Date()
            };
          }
          return latest;
        })
      );

      return sendSuccess(res, assessments);
    } catch (err) {
      next(err);
    }
  },

  async getLocationAssessments(req, res, next) {
    try {
      const { locationId } = req.params;
      const { limit = 30 } = req.query;

      const location = await Location.findById(locationId);
      if (!location) {
        return sendError(res, 'Location not found', 404);
      }

      const history = await RiskAssessment.find({ location: locationId })
        .sort({ evaluatedAt: -1 })
        .limit(Math.min(100, parseInt(limit, 10)));

      return sendSuccess(res, {
        location,
        history
      });
    } catch (err) {
      next(err);
    }
  },

  async recalculateLocationRisk(req, res, next) {
    try {
      const { locationId } = req.params;
      const location = await Location.findById(locationId);
      if (!location) {
        return sendError(res, 'Location not found', 404);
      }

      const sensors = await Sensor.find({ location: location._id });
      let rainfallRate = null;
      let soilMoisture = null;
      let tiltDegrees = null;
      let porePressure = null;
      const sensorTimestamps = {};

      sensors.forEach(s => {
        if (s.lastReadingValue != null) {
          if (s.type === 'rain_gauge') {
            rainfallRate = s.lastReadingValue;
            sensorTimestamps.rainfall = s.lastReadingAt;
          } else if (s.type === 'soil_moisture') {
            soilMoisture = s.lastReadingValue;
            sensorTimestamps.soilMoisture = s.lastReadingAt;
          } else if (s.type === 'tiltmeter') {
            tiltDegrees = s.lastReadingValue;
            sensorTimestamps.tilt = s.lastReadingAt;
          } else if (s.type === 'pore_pressure') {
            porePressure = s.lastReadingValue;
            sensorTimestamps.porePressure = s.lastReadingAt;
          }
        }
      });

      const lhiResult = calculateLandslideHazardIndex({
        rainfallRate,
        soilMoisture,
        tiltDegrees,
        porePressure,
        slopeAngle: location.slopeAngle,
        sensorTimestamps,
        isDemo: location.isDemo
      });

      const assessment = await RiskAssessment.create({
        location: location._id,
        riskScore: lhiResult.riskScore,
        riskLevel: lhiResult.riskLevel,
        factors: lhiResult.factors,
        methodVersion: lhiResult.methodVersion,
        dataQuality: lhiResult.dataQuality,
        confidenceRating: lhiResult.confidenceRating,
        evaluatedAt: lhiResult.evaluatedAt,
        isDemo: location.isDemo
      });

      location.currentRiskScore = lhiResult.riskScore;
      location.currentRiskLevel = lhiResult.riskLevel;
      location.lastAssessmentAt = lhiResult.evaluatedAt;
      await location.save();

      broadcastAssessment(assessment, location._id);

      return sendSuccess(res, assessment, 'Risk assessment recalculated successfully');
    } catch (err) {
      next(err);
    }
  },

  getConfig(req, res) {
    return sendSuccess(res, {
      configuration: LHI_CONFIG,
      explanation: {
        formula: 'LHI = (w_rain * S_rain + w_soil * S_soil + w_tilt * S_tilt + w_pore * S_pore) * kappa_slope',
        weights: LHI_CONFIG.weights,
        thresholds: {
          Low: 'Score 0 to 29.99 (Normal background conditions)',
          Moderate: 'Score 30 to 54.99 (Elevated pore water or intense rainfall, heightened watch)',
          High: 'Score 55 to 74.99 (Severe saturation with perceptible slope creep, advisory issued)',
          Critical: 'Score 75 to 100 (Imminent shear failure or rapid active displacement, immediate evacuation protocol)'
        },
        disclaimer: 'This index is an empirical multi-factor decision-support indicator and NOT a certified geotechnical slope stability prediction.'
      }
    });
  }
};
