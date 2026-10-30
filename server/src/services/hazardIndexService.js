/**
 * @file hazardIndexService.js
 * @description Landslide Hazard Index (LHI) Calculation Engine.
 * 
 * SCIENTIFIC & TRANSPARENCY NOTICE:
 * This model is an empirical multi-factor decision-support heuristic designed
 * for environmental hazard monitoring and early advisory notification.
 * It synthesizes hydrological (rainfall, soil saturation, pore water pressure)
 * and geomechanical (displacement/tilt, slope inclination) telemetry.
 * 
 * DISCLAIMER:
 * This index is NOT a certified geotechnical slope failure prediction or safety certification.
 * It serves strictly as an operational prioritization tool.
 */

export const LHI_CONFIG = {
  version: 'LHI-v2.2-EmpiricalPhysicsBased',
  weights: {
    rainfall: 0.35,
    soilMoisture: 0.25,
    displacement: 0.25,
    porePressure: 0.15
  },
  thresholds: {
    lowMax: 29.99,
    moderateMax: 54.99,
    highMax: 74.99,
    criticalMin: 75.00
  },
  staleThresholdMinutes: 60
};

/**
 * Normalizes rainfall intensity (mm/h) into [0, 100] hazard score.
 * Based on empirical thresholds for shallow translational landslides.
 */
export const normalizeRainfall = (rateMmPerHour) => {
  if (rateMmPerHour == null || isNaN(rateMmPerHour)) return null;
  const val = Math.max(0, Number(rateMmPerHour));
  if (val <= 5) return (val / 5) * 15;
  if (val <= 20) return 15 + ((val - 5) / 15) * 35; // 5-20 mm/h -> 15-50 score
  if (val <= 50) return 50 + ((val - 20) / 30) * 30; // 20-50 mm/h -> 50-80 score
  return Math.min(100, 80 + ((val - 50) / 50) * 20); // 50+ mm/h -> 80-100 score
};

/**
 * Normalizes volumetric soil moisture percentage (0 - 100%) into [0, 100] hazard score.
 * Above 70-80% saturation, pore air space disappears and shear strength drops drastically.
 */
export const normalizeSoilMoisture = (percentage) => {
  if (percentage == null || isNaN(percentage)) return null;
  const val = Math.max(0, Math.min(100, Number(percentage)));
  if (val < 35) return (val / 35) * 15;
  if (val < 60) return 15 + ((val - 35) / 25) * 35; // 35-60% -> 15-50 score
  if (val < 80) return 50 + ((val - 60) / 20) * 30; // 60-80% -> 50-80 score
  return Math.min(100, 80 + ((val - 80) / 20) * 20); // 80-100% -> 80-100 score
};

/**
 * Normalizes tiltmeter / displacement rate (degrees or mm/m) into [0, 100] hazard score.
 */
export const normalizeDisplacement = (tiltDegrees) => {
  if (tiltDegrees == null || isNaN(tiltDegrees)) return null;
  const val = Math.max(0, Number(tiltDegrees));
  if (val <= 0.2) return (val / 0.2) * 10;
  if (val <= 1.0) return 10 + ((val - 0.2) / 0.8) * 35; // 0.2-1.0 deg -> 10-45 score
  if (val <= 3.0) return 45 + ((val - 1.0) / 2.0) * 35; // 1.0-3.0 deg -> 45-80 score
  return Math.min(100, 80 + ((val - 3.0) / 3.0) * 20); // >3.0 deg -> 80-100 score
};

/**
 * Normalizes pore water pressure (kPa) into [0, 100] hazard score.
 */
export const normalizePorePressure = (pressureKpa) => {
  if (pressureKpa == null || isNaN(pressureKpa)) return null;
  const val = Math.max(0, Number(pressureKpa));
  if (val <= 5) return (val / 5) * 15;
  if (val <= 20) return 15 + ((val - 5) / 15) * 35; // 5-20 kPa -> 15-50 score
  if (val <= 45) return 50 + ((val - 20) / 25) * 35; // 20-45 kPa -> 50-85 score
  return Math.min(100, 85 + ((val - 45) / 30) * 15);
};

/**
 * Slope inclination multiplier based on Mohr-Coulomb stability:
 * Steeper angles amplify triggering factors.
 */
export const calculateSlopeFactor = (slopeDegrees = 30) => {
  const angle = Math.max(5, Math.min(85, Number(slopeDegrees) || 30));
  // Reference slope 30 degrees = factor 1.0
  const rad = (angle * Math.PI) / 180;
  const refRad = (30 * Math.PI) / 180;
  const rawFactor = Math.sin(rad) / Math.sin(refRad);
  return Number(Math.max(0.7, Math.min(1.35, rawFactor)).toFixed(3));
};

/**
 * Determines risk categorical level from numeric score.
 */
export const getRiskLevelFromScore = (score) => {
  if (score >= LHI_CONFIG.thresholds.criticalMin) return 'Critical';
  if (score >= LHI_CONFIG.thresholds.moderateMax) return 'High';
  if (score >= LHI_CONFIG.thresholds.lowMax) return 'Moderate';
  return 'Low';
};

/**
 * Computes Landslide Hazard Index with transparent factor breakdown and data quality tracking.
 * 
 * @param {Object} params
 * @param {number} [params.rainfallRate] - mm/h
 * @param {number} [params.soilMoisture] - %
 * @param {number} [params.tiltDegrees] - deg
 * @param {number} [params.porePressure] - kPa
 * @param {number} [params.slopeAngle] - deg
 * @param {Object} [params.sensorTimestamps] - { rainfall?: Date, soilMoisture?: Date, tilt?: Date, porePressure?: Date }
 * @param {boolean} [params.isDemo=false]
 * @returns {Object} Comprehensive evaluation result
 */
export const calculateLandslideHazardIndex = ({
  rainfallRate = null,
  soilMoisture = null,
  tiltDegrees = null,
  porePressure = null,
  slopeAngle = 30,
  sensorTimestamps = {},
  isDemo = false
}) => {
  const missingSensors = [];
  const staleSensors = [];
  const now = Date.now();
  const maxStaleMs = LHI_CONFIG.staleThresholdMinutes * 60 * 1000;

  const checkFreshness = (key, ts) => {
    if (!ts) return;
    const diff = now - new Date(ts).getTime();
    if (diff > maxStaleMs) {
      staleSensors.push(key);
    }
  };

  checkFreshness('rainfall', sensorTimestamps.rainfall);
  checkFreshness('soilMoisture', sensorTimestamps.soilMoisture);
  checkFreshness('tiltmeter', sensorTimestamps.tilt);
  checkFreshness('porePressure', sensorTimestamps.porePressure);

  // Normalize available values
  const sRain = normalizeRainfall(rainfallRate);
  const sSoil = normalizeSoilMoisture(soilMoisture);
  const sTilt = normalizeDisplacement(tiltDegrees);
  const sPore = normalizePorePressure(porePressure);

  if (sRain == null) missingSensors.push('rain_gauge');
  if (sSoil == null) missingSensors.push('soil_moisture');
  if (sTilt == null) missingSensors.push('tiltmeter');
  if (sPore == null) missingSensors.push('pore_pressure');

  // Dynamic weight reallocation among present sensors
  let activeWeightTotal = 0;
  const factorMap = [
    { key: 'rainfall', score: sRain, weight: LHI_CONFIG.weights.rainfall },
    { key: 'soilMoisture', score: sSoil, weight: LHI_CONFIG.weights.soilMoisture },
    { key: 'displacement', score: sTilt, weight: LHI_CONFIG.weights.displacement },
    { key: 'porePressure', score: sPore, weight: LHI_CONFIG.weights.porePressure }
  ];

  factorMap.forEach(f => {
    if (f.score != null) {
      activeWeightTotal += f.weight;
    }
  });

  let rawWeightedScore = 0;
  if (activeWeightTotal > 0) {
    factorMap.forEach(f => {
      if (f.score != null) {
        const reallocatedWeight = f.weight / activeWeightTotal;
        rawWeightedScore += f.score * reallocatedWeight;
      }
    });
  } else {
    // If no sensor telemetry exists at all, baseline fallback
    rawWeightedScore = 10;
  }

  // Geometric slope amplification
  const slopeFactor = calculateSlopeFactor(slopeAngle);
  let finalScore = rawWeightedScore * slopeFactor;

  // Stale penalty adjustment to indicate uncertainty
  let freshnessPenalty = 0;
  if (staleSensors.length > 0) {
    freshnessPenalty = Math.min(15, staleSensors.length * 4);
  }

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
  const riskLevel = getRiskLevelFromScore(finalScore);

  let dataQualityStatus = 'optimal';
  if (missingSensors.length >= 2 || staleSensors.length >= 2) {
    dataQualityStatus = 'degraded';
  } else if (missingSensors.length > 0 || staleSensors.length > 0) {
    dataQualityStatus = 'partial';
  }

  let confidenceRating = isDemo
    ? finalScore >= 75
      ? 'Critical Calculated Index (Simulated Telemetry — Extreme Infiltration Watch; Decision Support Advisory, Not a Confirmed Landslide)'
      : 'Decision Support Advisory (Demonstration Telemetry)'
    : dataQualityStatus === 'optimal'
    ? finalScore >= 75
      ? 'Critical Calculated Index (Active Telemetry Exceedance — Geotechnical Evacuation Advisory)'
      : 'Active Telemetry Verified'
    : 'Telemetry Impaired - Degraded Inputs';

  return {
    riskScore: finalScore,
    riskLevel,
    factors: {
      rainfallScore: sRain != null ? Math.round(sRain) : 0,
      soilMoistureScore: sSoil != null ? Math.round(sSoil) : 0,
      displacementScore: sTilt != null ? Math.round(sTilt) : 0,
      porePressureScore: sPore != null ? Math.round(sPore) : 0,
      slopeFactor,
      weights: LHI_CONFIG.weights,
      rawMeasurements: {
        rainfall: {
          value: rainfallRate !== null ? Number(rainfallRate) : null,
          unit: 'mm/h',
          warningThreshold: 25,
          criticalThreshold: 50,
          normalizedScore: sRain != null ? Math.round(sRain) : null
        },
        soilMoisture: {
          value: soilMoisture !== null ? Number(soilMoisture) : null,
          unit: '%',
          warningThreshold: 65,
          criticalThreshold: 80,
          normalizedScore: sSoil != null ? Math.round(sSoil) : null
        },
        displacement: {
          value: tiltDegrees !== null ? Number(tiltDegrees) : null,
          unit: 'deg',
          warningThreshold: 1.2,
          criticalThreshold: 2.8,
          normalizedScore: sTilt != null ? Math.round(sTilt) : null
        },
        porePressure: {
          value: porePressure !== null ? Number(porePressure) : null,
          unit: 'kPa',
          warningThreshold: 28,
          criticalThreshold: 45,
          normalizedScore: sPore != null ? Math.round(sPore) : null
        }
      }
    },
    scientificDisclaimer: 'Empirical decision-support indicator. Not an independently confirmed landslide or certified prediction.',
    methodVersion: LHI_CONFIG.version,
    dataQuality: {
      status: dataQualityStatus,
      missingSensors,
      staleSensors,
      freshnessPenalty
    },
    confidenceRating,
    evaluatedAt: new Date(),
    isDemo
  };
};
