import { getDbStatus } from '../config/db.js';
import { AuditLog } from '../models/AuditLog.js';
import { seedDemonstrationData } from '../../scripts/seedCore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const startTime = new Date();

export const systemController = {
  getHealth(req, res) {
    const uptimeSeconds = Math.floor((new Date() - startTime) / 1000);
    const dbStatus = getDbStatus();

    return res.status(200).json({
      status: 'UP',
      service: 'Landslide Risk Monitoring and Alert Platform',
      version: '1.0.0',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  },

  getReadiness(req, res) {
    const dbStatus = getDbStatus();
    if (dbStatus.isConnected) {
      return res.status(200).json({
        ready: true,
        message: 'System is ready to accept traffic and telemetry',
        database: dbStatus
      });
    } else {
      return res.status(503).json({
        ready: false,
        message: 'Database connection not ready',
        database: dbStatus
      });
    }
  },

  async seedDemo(req, res, next) {
    try {
      const summary = await seedDemonstrationData();

      await AuditLog.create({
        actor: req.user?.email || 'admin@landslide.io',
        actorId: req.user?._id || null,
        action: 'DEMO_DATA_SEEDED',
        resourceType: 'System',
        resourceId: 'ALL',
        details: summary
      });

      return sendSuccess(res, summary, 'Demonstration dataset seeded successfully');
    } catch (err) {
      next(err);
    }
  },

  async resetDemo(req, res, next) {
    try {
      const summary = await seedDemonstrationData(true);

      await AuditLog.create({
        actor: req.user?.email || 'admin@landslide.io',
        actorId: req.user?._id || null,
        action: 'DEMO_DATA_RESET',
        resourceType: 'System',
        resourceId: 'ALL',
        details: summary
      });

      return sendSuccess(res, summary, 'Demonstration dataset completely refreshed');
    } catch (err) {
      next(err);
    }
  },

  async simulatePulse(req, res, next) {
    try {
      const { scenario = 'normal' } = req.body || {};
      const { Sensor } = await import('../models/Sensor.js');
      const { ingestionService } = await import('../services/ingestionService.js');

      const sensors = await Sensor.find({ isDemo: true }).populate('location');
      const results = [];

      for (const s of sensors) {
        let delta = 0;
        let newValue = s.lastReadingValue || 15;

        if (scenario === 'storm_cloudburst') {
          // Surge precipitation and moisture
          if (s.type === 'rain_gauge') newValue = Math.min(110, (s.lastReadingValue || 20) + 25);
          else if (s.type === 'soil_moisture') newValue = Math.min(96, (s.lastReadingValue || 50) + 12);
          else if (s.type === 'pore_pressure') newValue = Math.min(65, (s.lastReadingValue || 20) + 14);
          else if (s.type === 'tiltmeter') newValue = Number(((s.lastReadingValue || 0.5) + 0.35).toFixed(3));
        } else if (scenario === 'dry_spell') {
          // Relieve conditions
          if (s.type === 'rain_gauge') newValue = 0;
          else if (s.type === 'soil_moisture') newValue = Math.max(15, (s.lastReadingValue || 50) - 10);
          else if (s.type === 'pore_pressure') newValue = Math.max(5, (s.lastReadingValue || 20) - 8);
          else if (s.type === 'tiltmeter') newValue = Number(Math.max(0.05, (s.lastReadingValue || 1.0) - 0.1).toFixed(3));
        } else {
          // Normal stochastic fluctuation
          delta = (Math.random() - 0.45) * 3;
          newValue = Math.max(1, Number(((s.lastReadingValue || 20) + delta).toFixed(2)));
        }

        try {
          const processed = await ingestionService.ingestReading({
            sensorId: s.sensorId,
            value: newValue,
            unit: s.unit,
            observedAt: new Date(),
            dataSource: 'demo_simulator',
            metadata: { scenario, trigger: 'ui_interactive' }
          });
          results.push({ sensorId: s.sensorId, value: newValue, riskScore: processed.assessment?.riskScore });
        } catch (e) {
          // ignore individual error
        }
      }

      return sendSuccess(res, {
        scenario,
        sensorsUpdated: results.length,
        results
      }, `Simulated telemetry pulse executed (${scenario})`);
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const { limit = 50, page = 1 } = req.query;
      const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const parsedPage = Math.max(1, parseInt(page, 10));
      const skip = (parsedPage - 1) * parsedLimit;

      const [logs, total] = await Promise.all([
        AuditLog.find()
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parsedLimit),
        AuditLog.countDocuments()
      ]);

      return sendSuccess(res, {
        logs,
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
