import { describe, it, expect } from 'vitest';
import {
  calculateLandslideHazardIndex,
  normalizeRainfall,
  normalizeSoilMoisture,
  normalizeDisplacement,
  normalizePorePressure,
  calculateSlopeFactor,
  getRiskLevelFromScore
} from '../src/services/hazardIndexService.js';

describe('Landslide Hazard Index (LHI) Service Scenarios', () => {
  it('should classify categorical risk levels accurately', () => {
    expect(getRiskLevelFromScore(15)).toBe('Low');
    expect(getRiskLevelFromScore(29.9)).toBe('Low');
    expect(getRiskLevelFromScore(30)).toBe('Moderate');
    expect(getRiskLevelFromScore(54.9)).toBe('Moderate');
    expect(getRiskLevelFromScore(55)).toBe('High');
    expect(getRiskLevelFromScore(74.9)).toBe('High');
    expect(getRiskLevelFromScore(75)).toBe('Critical');
    expect(getRiskLevelFromScore(95)).toBe('Critical');
    expect(getRiskLevelFromScore(100)).toBe('Critical');
  });

  // SCENARIO 1: Low Risk (Calm, dry weather, stable slope)
  it('Scenario: Low Risk Baseline (Dry, calm conditions)', () => {
    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 1.5,      // 1.5 mm/h
      soilMoisture: 25.0,     // 25% dry
      tiltDegrees: 0.05,      // negligible creep
      porePressure: 4.0,      // 4 kPa
      slopeAngle: 28,
      sensorTimestamps: {
        rainfall: new Date(),
        soilMoisture: new Date(),
        tilt: new Date(),
        porePressure: new Date()
      },
      isDemo: false
    });

    expect(assessment.riskLevel).toBe('Low');
    expect(assessment.riskScore).toBeLessThan(30);
    expect(assessment.dataQuality.status).toBe('optimal');
    expect(assessment.factors.rawMeasurements.rainfall.value).toBe(1.5);
    expect(assessment.factors.rawMeasurements.rainfall.unit).toBe('mm/h');
  });

  // SCENARIO 2: Moderate Risk (Steady drizzle, approaching field capacity)
  it('Scenario: Moderate Risk (Steady precipitation, rising soil water)', () => {
    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 14.0,     // 14 mm/h steady rain
      soilMoisture: 52.0,     // 52% moist
      tiltDegrees: 0.35,      // 0.35 deg minor creep
      porePressure: 16.0,     // 16 kPa
      slopeAngle: 32,
      sensorTimestamps: {
        rainfall: new Date(),
        soilMoisture: new Date(),
        tilt: new Date(),
        porePressure: new Date()
      },
      isDemo: false
    });

    expect(assessment.riskLevel).toBe('Moderate');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(30);
    expect(assessment.riskScore).toBeLessThan(55);
  });

  // SCENARIO 3: High Risk (Heavy rain, elevated soil moisture, perceptible creep)
  it('Scenario: High Risk (Heavy precipitation, elevated moisture, perceptible creep)', () => {
    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 30.0,     // 30 mm/h heavy rain
      soilMoisture: 68.0,     // 68% high moisture
      tiltDegrees: 1.1,       // 1.1 deg perceptible creep
      porePressure: 24.0,     // 24 kPa
      slopeAngle: 32,
      sensorTimestamps: {
        rainfall: new Date(),
        soilMoisture: new Date(),
        tilt: new Date(),
        porePressure: new Date()
      },
      isDemo: false
    });

    expect(assessment.riskLevel).toBe('High');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(55);
    expect(assessment.riskScore).toBeLessThan(75);
  });

  // SCENARIO 4: Critical Risk / 100-Score Cap (Severe multi-parameter exceedance)
  it('Scenario: Critical Calculated Index (100/100 multi-factor threshold exceedance)', () => {
    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 85.0,     // 85 mm/h extreme cloudburst
      soilMoisture: 96.0,     // 96% liquefaction zone
      tiltDegrees: 3.8,       // 3.8 deg rapid creep
      porePressure: 55.0,     // 55 kPa extreme uplift
      slopeAngle: 44,         // Steep 44 deg slope (Joshimath)
      sensorTimestamps: {
        rainfall: new Date(),
        soilMoisture: new Date(),
        tilt: new Date(),
        porePressure: new Date()
      },
      isDemo: true
    });

    expect(assessment.riskScore).toBe(100);
    expect(assessment.riskLevel).toBe('Critical');
    // Ensure critical score is transparently labelled as an empirical index, not guaranteed landslide
    expect(assessment.confidenceRating).toContain('Critical Calculated Index');
    expect(assessment.confidenceRating).toContain('Decision Support Advisory');
    expect(assessment.confidenceRating).toContain('Not a Confirmed Landslide');
    expect(assessment.scientificDisclaimer).toContain('Not an independently confirmed landslide');
    expect(assessment.factors.rawMeasurements.rainfall.value).toBe(85);
    expect(assessment.factors.rawMeasurements.soilMoisture.value).toBe(96);
  });

  // SCENARIO 5: Missing Data (Sensor telemetry dropout with dynamic weight balance)
  it('Scenario: Missing Data Handling (Graceful weight reallocation without false confidence)', () => {
    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 35.0,
      soilMoisture: null,     // TDR sensor offline/unconnected
      tiltDegrees: 0.8,
      porePressure: null,     // Piezometer offline
      slopeAngle: 30,
      sensorTimestamps: {
        rainfall: new Date(),
        tilt: new Date()
      },
      isDemo: false
    });

    expect(assessment.dataQuality.status).toBe('degraded');
    expect(assessment.dataQuality.missingSensors).toContain('soil_moisture');
    expect(assessment.dataQuality.missingSensors).toContain('pore_pressure');
    expect(assessment.dataQuality.missingSensors.length).toBe(2);
    // Calculated score should still be non-zero derived from remaining rain and tilt
    expect(assessment.riskScore).toBeGreaterThan(0);
  });

  // SCENARIO 6: Stale Telemetry (Stale timestamp watchdog applying penalty)
  it('Scenario: Stale Telemetry Watchdog (Applies uncertainty deduction and staleness flag)', () => {
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);

    const assessment = calculateLandslideHazardIndex({
      rainfallRate: 20.0,
      soilMoisture: 60.0,
      tiltDegrees: 0.5,
      porePressure: 15.0,
      slopeAngle: 30,
      sensorTimestamps: {
        rainfall: twoHoursAgo,    // Stale
        soilMoisture: twoHoursAgo,// Stale
        tilt: new Date(),
        porePressure: new Date()
      },
      isDemo: false
    });

    expect(assessment.dataQuality.staleSensors).toContain('rainfall');
    expect(assessment.dataQuality.staleSensors).toContain('soilMoisture');
    expect(assessment.dataQuality.freshnessPenalty).toBeGreaterThan(0);
    expect(assessment.dataQuality.status).toBe('degraded');
  });
});
