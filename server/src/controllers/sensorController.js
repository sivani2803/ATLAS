import { z } from 'zod';
import { Sensor } from '../models/Sensor.js';
import { Location } from '../models/Location.js';
import { SensorReading } from '../models/SensorReading.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastSensorStatus } from '../sockets/socketManager.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const sensorCreateSchema = z.object({
  sensorId: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['soil_moisture', 'tiltmeter', 'rain_gauge', 'pore_pressure']),
  location: z.string().min(10), // location ObjectId
  unit: z.string().min(1),
  thresholds: z.object({
    warning: z.number(),
    critical: z.number()
  }),
  depthMeters: z.number().optional().default(1.0),
  firmwareVersion: z.string().optional()
});

const sensorUpdateSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['online', 'offline', 'degraded', 'stale']).optional(),
  thresholds: z.object({
    warning: z.number(),
    critical: z.number()
  }).optional(),
  depthMeters: z.number().optional(),
  firmwareVersion: z.string().optional()
});

export const sensorController = {
  async getAllSensors(req, res, next) {
    try {
      const { location, type, status, search } = req.query;
      const query = {};

      if (location && location !== 'all') query.location = location;
      if (type && type !== 'all') query.type = type;
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { sensorId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }

      const sensors = await Sensor.find(query)
        .populate('location', 'name code region')
        .sort({ sensorId: 1 });

      return sendSuccess(res, sensors);
    } catch (err) {
      next(err);
    }
  },

  async getSensorById(req, res, next) {
    try {
      const { id } = req.params;
      const sensor = await Sensor.findById(id).populate('location', 'name code region latitude longitude slopeAngle');
      if (!sensor) {
        return sendError(res, 'Sensor not found', 404);
      }

      const recentReadings = await SensorReading.find({ sensor: sensor._id })
        .sort({ observedAt: -1 })
        .limit(60);

      return sendSuccess(res, {
        sensor,
        recentReadings: recentReadings.reverse() // chronological
      });
    } catch (err) {
      next(err);
    }
  },

  async createSensor(req, res, next) {
    try {
      const validatedData = sensorCreateSchema.parse(req.body);

      const locationExists = await Location.findById(validatedData.location);
      if (!locationExists) {
        return sendError(res, 'Monitored location does not exist.', 404);
      }

      const existingSensor = await Sensor.findOne({ sensorId: validatedData.sensorId.toUpperCase() });
      if (existingSensor) {
        return sendError(res, `Sensor identifier '${validatedData.sensorId}' already registered.`, 409);
      }

      const sensor = await Sensor.create({
        ...validatedData,
        sensorId: validatedData.sensorId.toUpperCase(),
        isDemo: locationExists.isDemo
      });

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'SENSOR_REGISTERED',
        resourceType: 'Sensor',
        resourceId: sensor._id.toString(),
        details: { sensorId: sensor.sensorId, type: sensor.type, location: locationExists.name }
      });

      return sendSuccess(res, sensor, 'Sensor registered successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateSensor(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = sensorUpdateSchema.parse(req.body);

      const sensor = await Sensor.findByIdAndUpdate(
        id,
        { $set: validatedData },
        { new: true, runValidators: true }
      ).populate('location', 'name code');

      if (!sensor) {
        return sendError(res, 'Sensor not found', 404);
      }

      if (validatedData.status) {
        broadcastSensorStatus(sensor);
      }

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'SENSOR_UPDATED',
        resourceType: 'Sensor',
        resourceId: sensor._id.toString(),
        details: validatedData
      });

      return sendSuccess(res, sensor, 'Sensor updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteSensor(req, res, next) {
    try {
      const { id } = req.params;
      const sensor = await Sensor.findById(id);
      if (!sensor) {
        return sendError(res, 'Sensor not found', 404);
      }

      await Sensor.findByIdAndDelete(id);

      await AuditLog.create({
        actor: req.user.email,
        actorId: req.user._id,
        action: 'SENSOR_DELETED',
        resourceType: 'Sensor',
        resourceId: id,
        details: { sensorId: sensor.sensorId }
      });

      return sendSuccess(res, null, 'Sensor deleted successfully');
    } catch (err) {
      next(err);
    }
  }
};
