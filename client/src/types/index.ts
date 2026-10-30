export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type SensorType = 'soil_moisture' | 'tiltmeter' | 'rain_gauge' | 'pore_pressure';
export type SensorStatus = 'online' | 'offline' | 'degraded' | 'stale';
export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  lastLoginAt?: string;
}

export interface Location {
  _id: string;
  name: string;
  code: string;
  description?: string;
  latitude: number;
  longitude: number;
  region: string;
  elevation: number;
  slopeAngle: number;
  geologyType?: string;
  monitoringStatus: 'active' | 'maintenance' | 'inactive';
  currentRiskScore: number;
  currentRiskLevel: RiskLevel;
  lastAssessmentAt: string;
  sensorCount?: number;
  onlineSensors?: number;
  activeAlerts?: number;
  isDemo?: boolean;
}

export interface SensorThresholds {
  warning: number;
  critical: number;
}

export interface Sensor {
  _id: string;
  sensorId: string;
  name: string;
  type: SensorType;
  location: string | Location;
  unit: string;
  status: SensorStatus;
  thresholds: SensorThresholds;
  depthMeters?: number;
  lastReadingValue?: number | null;
  lastReadingAt?: string | null;
  batteryLevel?: number;
  firmwareVersion?: string;
  isDemo?: boolean;
}

export interface SensorReading {
  _id: string;
  sensor: string | Sensor;
  location: string | Location;
  sensorType: SensorType;
  value: number;
  unit: string;
  observedAt: string;
  ingestedAt: string;
  dataSource: string;
  qualityStatus: 'valid' | 'suspect' | 'out_of_range';
  metadata?: Record<string, any>;
  isDemo?: boolean;
}

export interface RawMeasurementItem {
  value: number;
  unit: string;
  thresholdBreached: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  quality: string;
}

export interface RiskFactors {
  rainfallScore: number;
  soilMoistureScore: number;
  displacementScore: number;
  porePressureScore: number;
  slopeFactor: number;
  weights: {
    rainfall: number;
    soilMoisture: number;
    displacement: number;
    porePressure: number;
  };
  rawMeasurements?: {
    rainfall?: RawMeasurementItem;
    soilMoisture?: RawMeasurementItem;
    displacement?: RawMeasurementItem;
    porePressure?: RawMeasurementItem;
  };
}

export interface DataQualityReport {
  status: 'optimal' | 'partial' | 'degraded';
  missingSensors: string[];
  staleSensors: string[];
  freshnessPenalty: number;
}

export interface RiskAssessment {
  _id: string;
  location: string | Location;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactors;
  methodVersion: string;
  dataQuality: DataQualityReport;
  confidenceRating: string;
  evaluatedAt: string;
  scientificDisclaimer?: string;
  isDemo?: boolean;
}

export interface Alert {
  _id: string;
  location: Location;
  relatedSensor?: Sensor;
  relatedAssessment?: RiskAssessment;
  severity: RiskLevel;
  title: string;
  message: string;
  triggerCondition: {
    metric: string;
    threshold?: number;
    observedValue?: number;
    unit?: string;
  };
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: User;
  acknowledgedAt?: string;
  acknowledgementNotes?: string;
  resolvedAt?: string;
  deliveryStatus: {
    inApp: boolean;
    email: string;
    sms: string;
  };
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface AuditLog {
  _id: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardSummary {
  sensors: {
    total: number;
    online: number;
    offline: number;
    uptimePercentage: number;
  };
  locations: {
    total: number;
    riskDistribution: Record<RiskLevel, number>;
  };
  alerts: {
    active: number;
    critical: number;
    recent: Alert[];
  };
  latestReadings: SensorReading[];
  systemFreshness: string;
}
