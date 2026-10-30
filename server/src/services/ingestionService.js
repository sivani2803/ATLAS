import { Sensor } from '../models/Sensor.js';
import { Location } from '../models/Location.js';
import { SensorReading } from '../models/SensorReading.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { calculateLandslideHazardIndex } from './hazardIndexService.js';
import { alertService } from './alertService.js';
import { broadcastReading, broadcastAssessment, broadcastSensorStatus } from '../sockets/socketManager.js';
import { logger } from '../utils/logger.js';

export const ingestionService = {
  /**
   * Process a single incoming telemetry reading.
   * Modular design allows HTTP POST, MQTT adapter, or simulation broker.
   */
  async ingestReading({
    sensorId,
    value,
    unit,
    observedAt = new Date(),
    dataSource = 'edge_http',
    metadata = {}
  }) {
    // 1. Validate sensor exists
    const sensor = await Sensor.findOne({ sensorId }).populate('location');
    if (!sensor) {
      throw new Error(`Sensor '${sensorId}' is not registered in the system.`);
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`Invalid telemetry value '${value}'. Must be a valid numeric measurement.`);
    }

    // 2. Validate bounds & rate-of-change anomaly detection
    let qualityStatus = 'valid';
    if (sensor.type === 'soil_moisture' && (numValue < 0 || numValue > 100)) {
      qualityStatus = 'out_of_range';
    } else if (sensor.type === 'rain_gauge' && (numValue < 0 || numValue > 350)) {
      qualityStatus = 'out_of_range';
    } else if (sensor.type === 'tiltmeter' && (numValue < -90 || numValue > 90)) {
      qualityStatus = 'out_of_range';
    } else if (sensor.type === 'pore_pressure' && (numValue < 0 || numValue > 300)) {
      qualityStatus = 'out_of_range';
    }

    // Rate-of-change spike detection against previous reading
    if (sensor.lastReadingValue !== null && qualityStatus === 'valid') {
      const delta = Math.abs(numValue - sensor.lastReadingValue);
      if (sensor.type === 'tiltmeter' && delta > 15.0) {
        qualityStatus = 'suspect'; // Abrupt 15-degree jump likely sensor collision or malfunction
      } else if (sensor.type === 'soil_moisture' && delta > 50.0) {
        qualityStatus = 'suspect';
      } else if (sensor.type === 'pore_pressure' && delta > 80.0) {
        qualityStatus = 'suspect';
      }
    }

    const location = sensor.location;
    const observationDate = new Date(observedAt);

    // Reject duplicate reading with exact same sensor and observation timestamp
    const duplicate = await SensorReading.findOne({
      sensor: sensor._id,
      observedAt: observationDate
    });
    if (duplicate) {
      logger.warn(`Duplicate reading rejected for sensor ${sensor.sensorId} at ${observationDate.toISOString()}`);
      return { reading: duplicate, isDuplicate: true };
    }

    // 3. Store accepted reading in MongoDB
    const reading = await SensorReading.create({
      sensor: sensor._id,
      location: location._id,
      sensorType: sensor.type,
      value: numValue,
      unit: unit || sensor.unit,
      observedAt: observationDate,
      ingestedAt: new Date(),
      dataSource,
      qualityStatus,
      metadata,
      isDemo: sensor.isDemo
    });

    // 4. Update sensor latest-seen state
    const prevStatus = sensor.status;
    sensor.lastReadingValue = numValue;
    sensor.lastReadingAt = observationDate;
    sensor.status = 'online';
    await sensor.save();

    if (prevStatus !== 'online') {
      broadcastSensorStatus(sensor);
    }

    // Broadcast reading
    broadcastReading({
      _id: reading._id,
      sensorId: sensor.sensorId,
      sensorName: sensor.name,
      sensorType: sensor.type,
      locationId: location._id,
      locationName: location.name,
      value: numValue,
      unit: reading.unit,
      observedAt: observationDate,
      qualityStatus,
      isDemo: sensor.isDemo
    }, location._id);

    // 5. Gather all latest readings for this location to compute comprehensive LHI
    const locationSensors = await Sensor.find({ location: location._id });
    
    let rainfallRate = null;
    let soilMoisture = null;
    let tiltDegrees = null;
    let porePressure = null;
    const sensorTimestamps = {};

    locationSensors.forEach(s => {
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

    // 6. Recalculate transparent LHI Risk Assessment
    const lhiResult = calculateLandslideHazardIndex({
      rainfallRate,
      soilMoisture,
      tiltDegrees,
      porePressure,
      slopeAngle: location.slopeAngle,
      sensorTimestamps,
      isDemo: location.isDemo
    });

    // 7. Persist Assessment
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

    // 8. Update Location cached figures
    location.currentRiskScore = lhiResult.riskScore;
    location.currentRiskLevel = lhiResult.riskLevel;
    location.lastAssessmentAt = lhiResult.evaluatedAt;
    await location.save();

    // 9. Broadcast assessment to connected clients
    broadcastAssessment({
      _id: assessment._id,
      locationId: location._id,
      locationName: location.name,
      riskScore: lhiResult.riskScore,
      riskLevel: lhiResult.riskLevel,
      factors: lhiResult.factors,
      dataQuality: lhiResult.dataQuality,
      confidenceRating: lhiResult.confidenceRating,
      evaluatedAt: lhiResult.evaluatedAt
    }, location._id);

    // 10. Check thresholds and generate alerts (with deduplication)
    const alerts = await alertService.evaluateAndCreateAlerts({
      location,
      sensor,
      reading,
      assessment
    });

    return {
      reading,
      assessment,
      alerts
    };
  }
};
