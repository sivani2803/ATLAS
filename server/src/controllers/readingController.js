import { z } from 'zod';
import { SensorReading } from '../models/SensorReading.js';
import { ingestionService } from '../services/ingestionService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const singleReadingSchema = z.object({
  sensorId: z.string().min(2),
  value: z.number(),
  unit: z.string().optional(),
  observedAt: z.string().datetime().optional().or(z.date().optional()),
  dataSource: z.enum(['edge_http', 'edge_mqtt', 'demo_simulator', 'manual_import']).optional(),
  metadata: z.record(z.any()).optional()
});

const batchReadingSchema = z.object({
  readings: z.array(singleReadingSchema).min(1).max(100)
});

export const readingController = {
  async ingestSingle(req, res, next) {
    try {
      const validated = singleReadingSchema.parse(req.body);

      const result = await ingestionService.ingestReading({
        sensorId: validated.sensorId,
        value: validated.value,
        unit: validated.unit,
        observedAt: validated.observedAt ? new Date(validated.observedAt) : new Date(),
        dataSource: validated.dataSource || (req.isEdgeDevice ? 'edge_http' : 'demo_simulator'),
        metadata: validated.metadata || {}
      });

      return sendSuccess(res, {
        readingId: result.reading._id,
        sensorId: validated.sensorId,
        acceptedValue: result.reading.value,
        qualityStatus: result.reading.qualityStatus,
        riskScore: result.assessment?.riskScore,
        riskLevel: result.assessment?.riskLevel,
        alertsTriggered: result.alerts?.length || 0
      }, 'Reading ingested and pipeline evaluated', 201);
    } catch (err) {
      next(err);
    }
  },

  async ingestBatch(req, res, next) {
    try {
      const { readings } = batchReadingSchema.parse(req.body);
      const results = [];

      for (const item of readings) {
        try {
          const resItem = await ingestionService.ingestReading({
            sensorId: item.sensorId,
            value: item.value,
            unit: item.unit,
            observedAt: item.observedAt ? new Date(item.observedAt) : new Date(),
            dataSource: item.dataSource || 'edge_http',
            metadata: item.metadata || {}
          });
          results.push({ sensorId: item.sensorId, success: true, readingId: resItem.reading._id });
        } catch (subErr) {
          results.push({ sensorId: item.sensorId, success: false, error: subErr.message });
        }
      }

      return sendSuccess(res, {
        total: readings.length,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }, 'Batch readings processed', 200);
    } catch (err) {
      next(err);
    }
  },

  async getReadings(req, res, next) {
    try {
      const { location, sensor, sensorType, limit = 50, page = 1 } = req.query;
      const query = {};

      if (location && location !== 'all') query.location = location;
      if (sensor && sensor !== 'all') query.sensor = sensor;
      if (sensorType && sensorType !== 'all') query.sensorType = sensorType;

      const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10)));
      const parsedPage = Math.max(1, parseInt(page, 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const [readings, total] = await Promise.all([
        SensorReading.find(query)
          .sort({ observedAt: -1 })
          .skip(skip)
          .limit(parsedLimit)
          .populate('sensor', 'sensorId name type unit')
          .populate('location', 'name code'),
        SensorReading.countDocuments(query)
      ]);

      return sendSuccess(res, {
        readings,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
