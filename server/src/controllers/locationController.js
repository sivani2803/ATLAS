import { z } from 'zod';
import { Location } from '../models/Location.js';
import { Sensor } from '../models/Sensor.js';
import { Alert } from '../models/Alert.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().min(2),
  elevation: z.number().optional().default(0),
  slopeAngle: z.number().min(0).max(90),
  geologyType: z.string().optional(),
  monitoringStatus: z.enum(['active', 'maintenance', 'inactive']).optional()
});

export const locationController = {
  async getAllLocations(req, res, next) {
    try {
      const { region, riskLevel, status, search } = req.query;
      const query = {};

      if (region && region !== 'all') query.region = region;
      if (riskLevel && riskLevel !== 'all') query.currentRiskLevel = riskLevel;
      if (status && status !== 'all') query.monitoringStatus = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { region: { $regex: search, $options: 'i' } }
        ];
      }

      const locations = await Location.find(query).sort({ currentRiskScore: -1 });

      // Enrich locations with sensor and active alert counts
      const enrichedLocations = await Promise.all(
        locations.map(async (loc) => {
          const sensorCount = await Sensor.countDocuments({ location: loc._id });
          const onlineSensors = await Sensor.countDocuments({ location: loc._id, status: 'online' });
          const activeAlerts = await Alert.countDocuments({ location: loc._id, status: 'active' });

          return {
            ...loc.toObject(),
            sensorCount,
            onlineSensors,
            activeAlerts
          };
        })
      );

      return sendSuccess(res, enrichedLocations);
    } catch (err) {
      next(err);
    }
  },

  async getLocationById(req, res, next) {
    try {
      const { id } = req.params;
      const location = await Location.findById(id);
      if (!location) {
        return sendError(res, 'Location not found', 404);
      }

      const sensors = await Sensor.find({ location: location._id });
      const latestAssessment = await RiskAssessment.findOne({ location: location._id }).sort({ evaluatedAt: -1 });
      const activeAlerts = await Alert.find({ location: location._id, status: 'active' }).sort({ createdAt: -1 });

      return sendSuccess(res, {
        location,
        sensors,
        latestAssessment,
        activeAlerts
      });
    } catch (err) {
      next(err);
    }
  },

  async createLocation(req, res, next) {
    try {
      const validatedData = locationSchema.parse(req.body);

      const existingCode = await Location.findOne({ code: validatedData.code.toUpperCase() });
      if (existingCode) {
        return sendError(res, `Location code '${validatedData.code}' is already assigned.`, 409);
      }

      const location = await Location.create({
        ...validatedData,
        code: validatedData.code.toUpperCase(),
        isDemo: false
      });

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'LOCATION_CREATED',
        resourceType: 'Location',
        resourceId: location._id.toString(),
        details: { name: location.name, code: location.code }
      });

      return sendSuccess(res, location, 'Location registered successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = locationSchema.partial().parse(req.body);

      const location = await Location.findByIdAndUpdate(
        id,
        { ...validatedData, ...(validatedData.code ? { code: validatedData.code.toUpperCase() } : {}) },
        { new: true, runValidators: true }
      );

      if (!location) {
        return sendError(res, 'Location not found', 404);
      }

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'LOCATION_UPDATED',
        resourceType: 'Location',
        resourceId: location._id.toString(),
        details: validatedData
      });

      return sendSuccess(res, location, 'Location updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteLocation(req, res, next) {
    try {
      const { id } = req.params;
      const location = await Location.findById(id);
      if (!location) {
        return sendError(res, 'Location not found', 404);
      }

      const sensorCount = await Sensor.countDocuments({ location: id });
      if (sensorCount > 0) {
        return sendError(res, `Cannot delete location with ${sensorCount} attached active sensors. Remove sensors first.`, 400);
      }

      await Location.findByIdAndDelete(id);

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'LOCATION_DELETED',
        resourceType: 'Location',
        resourceId: id,
        details: { name: location.name }
      });

      return sendSuccess(res, null, 'Location removed successfully');
    } catch (err) {
      next(err);
    }
  }
};
