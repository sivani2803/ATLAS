import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertService } from '../src/services/alertService.js';
import { Alert } from '../src/models/Alert.js';

vi.mock('../src/models/Alert.js', () => ({
  Alert: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn()
  }
}));

vi.mock('../src/models/AuditLog.js', () => ({
  AuditLog: {
    create: vi.fn()
  }
}));

vi.mock('../src/sockets/socketManager.js', () => ({
  broadcastAlert: vi.fn(),
  broadcastAlertUpdate: vi.fn()
}));

describe('Alert Service Deduplication & Thresholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate alert when sensor reading exceeds critical threshold', async () => {
    Alert.findOne.mockResolvedValue(null); // No existing cooling-down alert
    Alert.create.mockImplementation((data) => Promise.resolve({ _id: 'alert123', ...data }));

    const mockLocation = { _id: 'loc1', name: 'Wayanad Meppadi', slopeAngle: 38, isDemo: true };
    const mockSensor = {
      _id: 'sen1',
      sensorId: 'SEN-WY-RAIN',
      name: 'Rain Gauge',
      type: 'rain_gauge',
      thresholds: { warning: 25, critical: 50 }
    };
    const mockReading = { value: 65, unit: 'mm/h' };

    const alerts = await alertService.evaluateAndCreateAlerts({
      location: mockLocation,
      sensor: mockSensor,
      reading: mockReading
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('Critical');
    expect(alerts[0].triggerCondition.threshold).toBe(50);
    expect(Alert.create).toHaveBeenCalled();
  });

  it('should suppress duplicate alert when an alert is already in cooldown', async () => {
    // Existing active alert found
    Alert.findOne.mockResolvedValue({ _id: 'existing_alert', status: 'active' });

    const mockLocation = { _id: 'loc1', name: 'Wayanad Meppadi', slopeAngle: 38 };
    const mockSensor = {
      _id: 'sen1',
      sensorId: 'SEN-WY-RAIN',
      name: 'Rain Gauge',
      type: 'rain_gauge',
      thresholds: { warning: 25, critical: 50 }
    };
    const mockReading = { value: 68, unit: 'mm/h' };

    const alerts = await alertService.evaluateAndCreateAlerts({
      location: mockLocation,
      sensor: mockSensor,
      reading: mockReading
    });

    expect(alerts.length).toBe(0);
    expect(Alert.create).not.toHaveBeenCalled();
  });
});
