import { User } from '../src/models/User.js';
import { Location } from '../src/models/Location.js';
import { Sensor } from '../src/models/Sensor.js';
import { SensorReading } from '../src/models/SensorReading.js';
import { RiskAssessment } from '../src/models/RiskAssessment.js';
import { Alert } from '../src/models/Alert.js';
import { calculateLandslideHazardIndex } from '../src/services/hazardIndexService.js';
import { logger } from '../src/utils/logger.js';

export const DEMO_LOCATIONS = [
  {
    name: 'Wayanad Meppadi Ridge',
    code: 'WY-MEP-01',
    description: 'Steep tea-estate slope overlying fractured Precambrian gneiss. High vulnerability to extreme monsoonal cloudburst saturation.',
    latitude: 11.5512,
    longitude: 76.1302,
    region: 'Western Ghats, Kerala',
    elevation: 940,
    slopeAngle: 38,
    geologyType: 'Weathered Laterite over Gneiss Bedrock',
    monitoringStatus: 'active',
    isDemo: true
  },
  {
    name: 'Joshimath Ravigram Escarpment',
    code: 'JM-RAV-02',
    description: 'Active tectonic subsidence zone on ancient landslide debris. Severe ground fissuring and glacial runoff percolation.',
    latitude: 30.5564,
    longitude: 79.5638,
    region: 'Garhwal Himalayas, Uttarakhand',
    elevation: 1890,
    slopeAngle: 44,
    geologyType: 'Sheared Mica-Schist Colluvium',
    monitoringStatus: 'active',
    isDemo: true
  },
  {
    name: 'Oso Cascadia River Bend',
    code: 'WA-OSO-03',
    description: 'Glacial recessional outwash sand and lacustrine clay deposits along the North Fork Stillaguamish river valley.',
    latitude: 48.2783,
    longitude: -121.9167,
    region: 'Snohomish County, Washington (Cascadia)',
    elevation: 185,
    slopeAngle: 32,
    geologyType: 'Glacial Till and Lacustrine Silts',
    monitoringStatus: 'active',
    isDemo: true
  },
  {
    name: 'Brienz Brinzauls Insel Flank',
    code: 'CH-BRZ-04',
    description: 'High alpine calcareous rock flank with deep-seated gravitational slope deformation and accelerated seasonal permafrost thaw.',
    latitude: 46.6912,
    longitude: 9.6014,
    region: 'Albula Valley, Grisons (Swiss Alps)',
    elevation: 1650,
    slopeAngle: 51,
    geologyType: 'Fractured Dolomite & Anhydrite',
    monitoringStatus: 'active',
    isDemo: true
  },
  {
    name: 'Shimla Dhalli Ridge Flank',
    code: 'HP-SHM-05',
    description: 'Urban slope with high anthropogenic surcharge and saturated phyllite overburden along the Hindustan-Tibet highway cut.',
    latitude: 31.1048,
    longitude: 77.1734,
    region: 'Shimla Ridge, Himachal Pradesh',
    elevation: 2200,
    slopeAngle: 34,
    geologyType: 'Jutogh Group Phyllites and Quartzites',
    monitoringStatus: 'active',
    isDemo: true
  },
  {
    name: 'Coonoor Marapalam Ghat Section',
    code: 'TN-CNR-06',
    description: 'Stabilized terraced valley section with bio-engineering geotextiles and sub-surface perforated horizontal drains.',
    latitude: 11.3530,
    longitude: 76.7959,
    region: 'Nilgiri Biosphere, Tamil Nadu',
    elevation: 1450,
    slopeAngle: 26,
    geologyType: 'Charnockite Massif with Engineered Soil Retention',
    monitoringStatus: 'active',
    isDemo: true
  }
];

export const seedDemonstrationData = async (forceClean = false) => {
  logger.info('Starting demonstration dataset seed sequence...');

  if (forceClean) {
    logger.info('Force clean enabled: Purging existing demonstration records...');
    await User.deleteMany({});
    await Location.deleteMany({});
    await Sensor.deleteMany({});
    await SensorReading.deleteMany({});
    await RiskAssessment.deleteMany({});
    await Alert.deleteMany({});
  }

  // 1. Ensure Standard Role Demonstration Users
  let admin = await User.findOne({ email: 'admin@landslide.io' });
  if (!admin) {
    admin = await User.create({
      name: 'Dr. Elena Rostova (Chief Geotechnical Officer)',
      email: 'admin@landslide.io',
      passwordHash: await User.hashPassword('Admin@123456'),
      role: 'admin',
      status: 'active'
    });
  }

  let operator = await User.findOne({ email: 'operator@landslide.io' });
  if (!operator) {
    operator = await User.create({
      name: 'Marcus Vance (Senior Operations Dispatcher)',
      email: 'operator@landslide.io',
      passwordHash: await User.hashPassword('Operator@123456'),
      role: 'operator',
      status: 'active'
    });
  }

  let viewer = await User.findOne({ email: 'viewer@landslide.io' });
  if (!viewer) {
    viewer = await User.create({
      name: 'Public Safety Analyst',
      email: 'viewer@landslide.io',
      passwordHash: await User.hashPassword('Viewer@123456'),
      role: 'viewer',
      status: 'active'
    });
  }

  // 2. Create Monitored Locations
  const locationMap = new Map();
  for (const locData of DEMO_LOCATIONS) {
    let loc = await Location.findOne({ code: locData.code });
    if (!loc) {
      loc = await Location.create(locData);
    }
    locationMap.set(loc.code, loc);
  }

  // 3. Create Sensor Meshes for Each Location
  const sensorConfigs = [
    { type: 'rain_gauge', suffix: 'RAIN', name: 'Optical Tipping Rain Gauge', unit: 'mm/h', warning: 25, critical: 50 },
    { type: 'soil_moisture', suffix: 'SOIL', name: 'TDR Volumetric Soil Moisture', unit: '%', warning: 65, critical: 80 },
    { type: 'tiltmeter', suffix: 'TILT', name: 'Bi-Axial MEMS Tiltmeter', unit: 'deg', warning: 1.2, critical: 2.8 },
    { type: 'pore_pressure', suffix: 'PORE', name: 'Vibrating Wire Piezometer', unit: 'kPa', warning: 28, critical: 45 }
  ];

  const now = Date.now();
  const createdSensors = [];

  for (const [code, loc] of locationMap.entries()) {
    for (const conf of sensorConfigs) {
      const sensorId = `SEN-${code}-${conf.suffix}`;
      let sensor = await Sensor.findOne({ sensorId });
      
      // Determine simulated baseline characteristics based on location
      let baseValue = 0;
      let status = 'online';

      if (code === 'JM-RAV-02') { // Joshimath: Critical displacement
        if (conf.type === 'tiltmeter') baseValue = 3.4;
        else if (conf.type === 'soil_moisture') baseValue = 74;
        else if (conf.type === 'rain_gauge') baseValue = 18;
        else if (conf.type === 'pore_pressure') baseValue = 42;
      } else if (code === 'WY-MEP-01') { // Wayanad: Extreme rain burst & high pore pressure
        if (conf.type === 'rain_gauge') baseValue = 58;
        else if (conf.type === 'soil_moisture') baseValue = 88;
        else if (conf.type === 'tiltmeter') baseValue = 1.9;
        else if (conf.type === 'pore_pressure') baseValue = 38;
      } else if (code === 'CH-BRZ-04') { // Swiss Alps: Rockfall tilt creep
        if (conf.type === 'tiltmeter') baseValue = 2.1;
        else if (conf.type === 'soil_moisture') baseValue = 61;
        else if (conf.type === 'rain_gauge') baseValue = 12;
        else if (conf.type === 'pore_pressure') baseValue = 22;
      } else if (code === 'WA-OSO-03') { // Oso: Moderate moisture
        if (conf.type === 'soil_moisture') baseValue = 54;
        else if (conf.type === 'rain_gauge') baseValue = 14;
        else if (conf.type === 'tiltmeter') baseValue = 0.4;
        else if (conf.type === 'pore_pressure') baseValue = 18;
      } else if (code === 'HP-SHM-05') { // Shimla
        if (conf.type === 'soil_moisture') baseValue = 46;
        else if (conf.type === 'rain_gauge') baseValue = 8;
        else if (conf.type === 'tiltmeter') baseValue = 0.3;
        else if (conf.type === 'pore_pressure') baseValue = 14;
      } else { // Coonoor: Low baseline
        if (conf.type === 'soil_moisture') baseValue = 28;
        else if (conf.type === 'rain_gauge') baseValue = 2;
        else if (conf.type === 'tiltmeter') baseValue = 0.08;
        else if (conf.type === 'pore_pressure') baseValue = 6;
      }

      if (!sensor) {
        sensor = await Sensor.create({
          sensorId,
          name: `${loc.name} ${conf.name}`,
          type: conf.type,
          location: loc._id,
          unit: conf.unit,
          status,
          thresholds: { warning: conf.warning, critical: conf.critical },
          depthMeters: conf.type === 'pore_pressure' ? 6.5 : conf.type === 'soil_moisture' ? 1.5 : 0.2,
          lastReadingValue: baseValue,
          lastReadingAt: new Date(now),
          batteryLevel: Math.floor(88 + Math.random() * 11),
          isDemo: true
        });
      } else {
        sensor.lastReadingValue = baseValue;
        sensor.lastReadingAt = new Date(now);
        await sensor.save();
      }
      createdSensors.push(sensor);

      // Generate 24 hours of realistic time-series readings for charts
      const existingReadingsCount = await SensorReading.countDocuments({ sensor: sensor._id });
      if (existingReadingsCount < 10) {
        const sampleReadings = [];
        const hoursBack = 24;
        for (let h = hoursBack; h >= 0; h--) {
          const timestamp = new Date(now - h * 60 * 60 * 1000);
          // Realistic diurnal or incremental progression
          const noise = (Math.random() - 0.5) * 0.15 * baseValue;
          let val = Math.max(0, baseValue * (1 - (h / (hoursBack * 1.5))) + noise);
          if (conf.type === 'soil_moisture') val = Math.min(100, Math.max(5, val));
          if (conf.type === 'tiltmeter') val = Number(Math.max(0, val).toFixed(3));
          if (conf.type === 'rain_gauge') val = Number(Math.max(0, val).toFixed(1));
          if (conf.type === 'pore_pressure') val = Number(Math.max(0, val).toFixed(1));

          sampleReadings.push({
            sensor: sensor._id,
            location: loc._id,
            sensorType: sensor.type,
            value: val,
            unit: sensor.unit,
            observedAt: timestamp,
            ingestedAt: timestamp,
            dataSource: 'demo_simulator',
            qualityStatus: 'valid',
            isDemo: true
          });
        }
        await SensorReading.insertMany(sampleReadings);
      }
    }

    // 4. Compute and persist LHI Assessment for this location
    const locationSensors = await Sensor.find({ location: loc._id });
    let rainVal = null, soilVal = null, tiltVal = null, poreVal = null;
    const timestamps = {};

    locationSensors.forEach(s => {
      if (s.type === 'rain_gauge') { rainVal = s.lastReadingValue; timestamps.rainfall = s.lastReadingAt; }
      if (s.type === 'soil_moisture') { soilVal = s.lastReadingValue; timestamps.soilMoisture = s.lastReadingAt; }
      if (s.type === 'tiltmeter') { tiltVal = s.lastReadingValue; timestamps.tilt = s.lastReadingAt; }
      if (s.type === 'pore_pressure') { poreVal = s.lastReadingValue; timestamps.porePressure = s.lastReadingAt; }
    });

    const lhi = calculateLandslideHazardIndex({
      rainfallRate: rainVal,
      soilMoisture: soilVal,
      tiltDegrees: tiltVal,
      porePressure: poreVal,
      slopeAngle: loc.slopeAngle,
      sensorTimestamps: timestamps,
      isDemo: true
    });

    const assessment = await RiskAssessment.create({
      location: loc._id,
      riskScore: lhi.riskScore,
      riskLevel: lhi.riskLevel,
      factors: lhi.factors,
      methodVersion: lhi.methodVersion,
      dataQuality: lhi.dataQuality,
      confidenceRating: lhi.confidenceRating,
      evaluatedAt: new Date(now),
      isDemo: true
    });

    loc.currentRiskScore = lhi.riskScore;
    loc.currentRiskLevel = lhi.riskLevel;
    loc.lastAssessmentAt = new Date(now);
    await loc.save();

    // 5. Create Demonstration Alerts for High/Critical locations
    if (lhi.riskLevel === 'Critical') {
      const existingAlert = await Alert.findOne({ location: loc._id, severity: 'Critical' });
      if (!existingAlert) {
        await Alert.create({
          location: loc._id,
          relatedAssessment: assessment._id,
          severity: 'Critical',
          title: `[DEMO SIMULATION] High Displacement Benchmark: ${loc.name} (Test Sector)`,
          message: `[Simulated Exercise] Synthetic slope shear strain recorded at ${tiltVal}° with ${soilVal}% moisture saturation. Composite LHI score reached ${lhi.riskScore}/100 for algorithm testing purposes only. No real-world emergency or evacuation directive.`,
          triggerCondition: {
            metric: 'LHI_COMPOSITE',
            threshold: 75,
            observedValue: lhi.riskScore,
            unit: 'index'
          },
          status: 'active',
          deduplicationKey: `DEMO_CRITICAL_${loc.code}`,
          deliveryStatus: {
            inApp: true,
            email: 'unconfigured',
            sms: 'unconfigured'
          },
          isDemo: true
        });
      }
    } else if (lhi.riskLevel === 'High') {
      const existingAlert = await Alert.findOne({ location: loc._id, severity: 'High' });
      if (!existingAlert) {
        await Alert.create({
          location: loc._id,
          relatedAssessment: assessment._id,
          severity: 'High',
          title: `[DEMO SIMULATION] Elevated Rainfall Advisory: ${loc.name} (Test Sector)`,
          message: `[Simulated Exercise] Synthetic precipitation intensity (${rainVal} mm/h) and pore-water pressure (${poreVal} kPa) recorded above threshold for model testing. Not real emergency telemetry.`,
          triggerCondition: {
            metric: 'PRECIPITATION_PORE_PRESSURE',
            threshold: 55,
            observedValue: lhi.riskScore,
            unit: 'index'
          },
          status: 'acknowledged',
          acknowledgedBy: operator._id,
          acknowledgedAt: new Date(now - 15 * 60 * 1000),
          acknowledgementNotes: 'Demonstration acknowledgement logged by test operator.',
          deduplicationKey: `DEMO_HIGH_${loc.code}`,
          deliveryStatus: {
            inApp: true,
            email: 'unconfigured',
            sms: 'unconfigured'
          },
          isDemo: true
        });
      }
    }

  }

  logger.info('Demonstration dataset successfully seeded.');
  return {
    usersCreated: 3,
    locationsMonitored: DEMO_LOCATIONS.length,
    sensorsActive: createdSensors.length,
    demoAccounts: [
      { role: 'admin', email: 'admin@landslide.io', password: 'Admin@123456' },
      { role: 'operator', email: 'operator@landslide.io', password: 'Operator@123456' },
      { role: 'viewer', email: 'viewer@landslide.io', password: 'Viewer@123456' }
    ]
  };
};
