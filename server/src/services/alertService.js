import { Alert } from '../models/Alert.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastAlert, broadcastAlertUpdate } from '../sockets/socketManager.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const alertService = {
  /**
   * Evaluates if sensor threshold or risk assessment warrants an alert.
   * Enforces deduplication and cooldown to prevent notification storms.
   */
  async evaluateAndCreateAlerts({ location, sensor, reading, assessment }) {
    const alertsGenerated = [];
    const now = new Date();
    const cooldownMs = 15 * 60 * 1000; // 15 minute cooldown

    // 1. Check Sensor-level Threshold Breaches
    if (sensor && reading) {
      let severity = null;
      let conditionType = null;
      let thresholdValue = null;

      if (reading.value >= sensor.thresholds.critical) {
        severity = 'Critical';
        conditionType = 'CRITICAL_THRESHOLD_EXCEEDED';
        thresholdValue = sensor.thresholds.critical;
      } else if (reading.value >= sensor.thresholds.warning) {
        severity = 'High';
        conditionType = 'WARNING_THRESHOLD_EXCEEDED';
        thresholdValue = sensor.thresholds.warning;
      }

      if (severity) {
        const deduplicationKey = `SENSOR_${sensor._id}_${severity}`;
        
        // Check for existing active or cooling-down alert with same key
        const existingAlert = await Alert.findOne({
          location: location._id,
          deduplicationKey,
          status: { $in: ['active', 'acknowledged'] },
          cooldownUntil: { $gt: now }
        });

        if (!existingAlert) {
          const prefix = location.isDemo ? '[DEMO SIMULATION] ' : '';
          const title = `${prefix}${severity} Sensor Threshold: ${sensor.name}`;
          const message = `[Simulated Exercise] Node ${sensor.sensorId} (${sensor.type}) reported synthetic value ${reading.value} ${reading.unit}, exceeding test threshold of ${thresholdValue} ${reading.unit}.`;

          const deliveryStatus = {
            inApp: true,
            email: ENV.SENDGRID_API_KEY ? 'queued' : 'unconfigured',
            sms: (ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) ? 'queued' : 'unconfigured'
          };

          const alert = await Alert.create({
            location: location._id,
            relatedSensor: sensor._id,
            severity,
            title,
            message,
            triggerCondition: {
              metric: sensor.type.toUpperCase(),
              threshold: thresholdValue,
              observedValue: reading.value,
              unit: reading.unit
            },
            status: 'active',
            deduplicationKey,
            cooldownUntil: new Date(now.getTime() + cooldownMs),
            deliveryStatus,
            isDemo: location.isDemo
          });

          alertsGenerated.push(alert);
          broadcastAlert(alert, location._id);
          logger.warn(`Alert generated: [${severity}] ${title}`);
        }
      }
    }

    // 2. Check Composite Risk Assessment Level Breaches (High or Critical)
    if (assessment && (assessment.riskLevel === 'Critical' || assessment.riskLevel === 'High')) {
      const deduplicationKey = `LHI_${location._id}_${assessment.riskLevel}`;

      const existingAlert = await Alert.findOne({
        location: location._id,
        deduplicationKey,
        status: { $in: ['active', 'acknowledged'] },
        cooldownUntil: { $gt: now }
      });

      if (!existingAlert) {
        const prefix = location.isDemo ? '[DEMO SIMULATION] ' : '';
        const title = `${prefix}${assessment.riskLevel} LHI Model Threshold at ${location.name}`;
        const message = `[Simulated Exercise] Composite Landslide Hazard Index evaluated at ${assessment.riskScore}/100 (${assessment.riskLevel}) using simulated sensor inputs for algorithm evaluation. Not a certified emergency directive.`;


        const alert = await Alert.create({
          location: location._id,
          relatedAssessment: assessment._id,
          severity: assessment.riskLevel,
          title,
          message,
          triggerCondition: {
            metric: 'COMPOSITE_LHI_INDEX',
            threshold: assessment.riskLevel === 'Critical' ? 75 : 55,
            observedValue: assessment.riskScore,
            unit: 'index'
          },
          status: 'active',
          deduplicationKey,
          cooldownUntil: new Date(now.getTime() + cooldownMs),
          deliveryStatus: {
            inApp: true,
            email: ENV.SENDGRID_API_KEY ? 'queued' : 'unconfigured',
            sms: (ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) ? 'queued' : 'unconfigured'
          },
          isDemo: location.isDemo
        });

        alertsGenerated.push(alert);
        broadcastAlert(alert, location._id);
        logger.warn(`Assessment alert generated: [${assessment.riskLevel}] ${title}`);
      }
    }

    return alertsGenerated;
  },

  /**
   * Operator or Admin acknowledges an active alert.
   */
  async acknowledgeAlert(alertId, user, notes = '') {
    const alert = await Alert.findById(alertId).populate('location');
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = user._id;
    alert.acknowledgedAt = new Date();
    alert.acknowledgementNotes = notes || 'Acknowledged by monitoring operator.';
    await alert.save();

    await AuditLog.create({
      actor: user.email || 'operator',
      actorId: user._id,
      action: 'ALERT_ACKNOWLEDGED',
      resourceType: 'Alert',
      resourceId: alert._id.toString(),
      details: { severity: alert.severity, title: alert.title, notes }
    });

    broadcastAlertUpdate('alert:acknowledged', alert);
    return alert;
  },

  /**
   * Resolves an alert.
   */
  async resolveAlert(alertId, user) {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    await AuditLog.create({
      actor: user?.email || 'operator',
      actorId: user?._id || null,
      action: 'ALERT_RESOLVED',
      resourceType: 'Alert',
      resourceId: alert._id.toString(),
      details: { severity: alert.severity, title: alert.title }
    });

    broadcastAlertUpdate('alert:resolved', alert);
    return alert;
  }
};
