import { z } from 'zod';
import { Alert } from '../models/Alert.js';
import { alertService } from '../services/alertService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const ackSchema = z.object({
  notes: z.string().optional()
});

export const alertController = {
  async getAllAlerts(req, res, next) {
    try {
      const { severity, status, location, limit = 50, page = 1 } = req.query;
      const query = {};

      if (severity && severity !== 'all') query.severity = severity;
      if (status && status !== 'all') query.status = status;
      if (location && location !== 'all') query.location = location;

      const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const parsedPage = Math.max(1, parseInt(page, 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const [alerts, total] = await Promise.all([
        Alert.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parsedLimit)
          .populate('location', 'name code region latitude longitude')
          .populate('relatedSensor', 'sensorId name type unit')
          .populate('acknowledgedBy', 'name email'),
        Alert.countDocuments(query)
      ]);

      return sendSuccess(res, {
        alerts,
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
  },

  async getAlertById(req, res, next) {
    try {
      const { id } = req.params;
      const alert = await Alert.findById(id)
        .populate('location')
        .populate('relatedSensor')
        .populate('acknowledgedBy', 'name email role');

      if (!alert) {
        return sendError(res, 'Alert not found', 404);
      }

      return sendSuccess(res, alert);
    } catch (err) {
      next(err);
    }
  },

  async acknowledgeAlert(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = ackSchema.parse(req.body);

      const alert = await alertService.acknowledgeAlert(id, req.user, notes);
      return sendSuccess(res, alert, 'Alert acknowledged');
    } catch (err) {
      next(err);
    }
  },

  async resolveAlert(req, res, next) {
    try {
      const { id } = req.params;
      const alert = await alertService.resolveAlert(id, req.user);
      return sendSuccess(res, alert, 'Alert marked as resolved');
    } catch (err) {
      next(err);
    }
  }
};
