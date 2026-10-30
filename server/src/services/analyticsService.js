import { SensorReading } from '../models/SensorReading.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { Alert } from '../models/Alert.js';
import { Location } from '../models/Location.js';
import { Sensor } from '../models/Sensor.js';

export const analyticsService = {
  /**
   * Retrieves aggregated historical data for charts
   */
  async getHistoricalTrends({ locationId, timeRange = '24h' }) {
    const now = new Date();
    let startDate = new Date();

    if (timeRange === '24h') {
      startDate.setHours(now.getHours() - 24);
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate.setDate(now.getDate() - 90);
    }

    const query = {
      observedAt: { $gte: startDate }
    };

    if (locationId && locationId !== 'all') {
      query.location = locationId;
    }

    // Query readings grouped by time buckets
    const readings = await SensorReading.find(query)
      .sort({ observedAt: 1 })
      .limit(1000)
      .populate('sensor', 'name type unit sensorId')
      .populate('location', 'name code');

    // Query risk assessments over period
    const assessments = await RiskAssessment.find({
      evaluatedAt: { $gte: startDate },
      ...(locationId && locationId !== 'all' ? { location: locationId } : {})
    })
      .sort({ evaluatedAt: 1 })
      .limit(500)
      .populate('location', 'name code');

    return {
      timeRange,
      readingCount: readings.length,
      assessmentCount: assessments.length,
      readings,
      assessments
    };
  },

  /**
   * Summary overview stats for executive dashboard
   */
  async getDashboardSummary() {
    const totalSensors = await Sensor.countDocuments();
    const onlineSensors = await Sensor.countDocuments({ status: 'online' });
    const offlineSensors = await Sensor.countDocuments({ status: { $in: ['offline', 'stale'] } });
    const totalLocations = await Location.countDocuments();

    // Risk distribution across locations
    const locations = await Location.find().select('currentRiskLevel currentRiskScore');
    const riskDistribution = {
      Low: 0,
      Moderate: 0,
      High: 0,
      Critical: 0
    };
    locations.forEach(l => {
      if (riskDistribution[l.currentRiskLevel] !== undefined) {
        riskDistribution[l.currentRiskLevel]++;
      }
    });

    // Active alerts
    const activeAlertsCount = await Alert.countDocuments({ status: 'active' });
    const criticalAlertsCount = await Alert.countDocuments({ status: 'active', severity: 'Critical' });

    // Latest readings
    const latestReadings = await SensorReading.find()
      .sort({ observedAt: -1 })
      .limit(10)
      .populate('sensor', 'name sensorId type unit')
      .populate('location', 'name code');

    // Latest alerts
    const recentAlerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('location', 'name code')
      .populate('relatedSensor', 'name sensorId type');

    return {
      sensors: {
        total: totalSensors,
        online: onlineSensors,
        offline: offlineSensors,
        uptimePercentage: totalSensors > 0 ? Math.round((onlineSensors / totalSensors) * 100) : 100
      },
      locations: {
        total: totalLocations,
        riskDistribution
      },
      alerts: {
        active: activeAlertsCount,
        critical: criticalAlertsCount,
        recent: recentAlerts
      },
      latestReadings,
      systemFreshness: new Date().toISOString()
    };
  },

  /**
   * Generates downloadable CSV export
   */
  async generateCsvReport({ locationId, timeRange = '7d' }) {
    const now = new Date();
    let startDate = new Date();
    if (timeRange === '24h') startDate.setHours(now.getHours() - 24);
    else if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);

    const query = { observedAt: { $gte: startDate } };
    if (locationId && locationId !== 'all') query.location = locationId;

    const readings = await SensorReading.find(query)
      .sort({ observedAt: -1 })
      .limit(5000)
      .populate('sensor', 'sensorId name type unit')
      .populate('location', 'name code region');

    const headers = [
      'Timestamp (ISO)',
      'Location Code',
      'Location Name',
      'Region',
      'Sensor ID',
      'Sensor Name',
      'Sensor Type',
      'Measurement Value',
      'Unit',
      'Quality Status',
      'Data Source',
      'Is Demo'
    ];

    const rows = readings.map(r => [
      r.observedAt.toISOString(),
      `"${r.location?.code || ''}"`,
      `"${r.location?.name || ''}"`,
      `"${r.location?.region || ''}"`,
      `"${r.sensor?.sensorId || ''}"`,
      `"${r.sensor?.name || ''}"`,
      `"${r.sensor?.type || ''}"`,
      r.value,
      `"${r.unit}"`,
      `"${r.qualityStatus}"`,
      `"${r.dataSource}"`,
      r.isDemo ? 'true' : 'false'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csvContent;
  }
};
