import { analyticsService } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const analyticsController = {
  async getDashboardSummary(req, res, next) {
    try {
      const summary = await analyticsService.getDashboardSummary();
      return sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  },

  async getTrends(req, res, next) {
    try {
      const { locationId, timeRange = '24h' } = req.query;
      const trends = await analyticsService.getHistoricalTrends({ locationId, timeRange });
      return sendSuccess(res, trends);
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req, res, next) {
    try {
      const { locationId, timeRange = '7d' } = req.query;
      const csvData = await analyticsService.generateCsvReport({ locationId, timeRange });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="landslide-telemetry-report-${timeRange}-${Date.now()}.csv"`);
      return res.status(200).send(csvData);
    } catch (err) {
      next(err);
    }
  }
};
