import { connectDatabase } from '../src/config/db.js';
import { Sensor } from '../src/models/Sensor.js';
import { ingestionService } from '../src/services/ingestionService.js';
import { logger } from '../src/utils/logger.js';

const simulateCycle = async () => {
  logger.info('Running real-time telemetry simulation pulse...');
  const sensors = await Sensor.find({ isDemo: true }).populate('location');

  for (const s of sensors) {
    let delta = 0;
    let newValue = s.lastReadingValue || 10;

    if (s.type === 'rain_gauge') {
      // Periodic rainfall variations
      delta = (Math.random() - 0.45) * 5;
      newValue = Math.max(0, Math.min(120, Number((newValue + delta).toFixed(1))));
    } else if (s.type === 'soil_moisture') {
      delta = (Math.random() - 0.45) * 2;
      newValue = Math.max(10, Math.min(98, Number((newValue + delta).toFixed(1))));
    } else if (s.type === 'tiltmeter') {
      delta = (Math.random() - 0.4) * 0.05;
      newValue = Math.max(0, Math.min(10, Number((newValue + delta).toFixed(3))));
    } else if (s.type === 'pore_pressure') {
      delta = (Math.random() - 0.45) * 1.5;
      newValue = Math.max(0, Math.min(80, Number((newValue + delta).toFixed(1))));
    }

    try {
      await ingestionService.ingestReading({
        sensorId: s.sensorId,
        value: newValue,
        unit: s.unit,
        observedAt: new Date(),
        dataSource: 'demo_simulator',
        metadata: { simulation: true, pulseTime: new Date().toISOString() }
      });
      logger.info(`Simulated reading pushed: ${s.sensorId} = ${newValue} ${s.unit}`);
    } catch (err) {
      logger.error(`Simulation push failed for ${s.sensorId}:`, err);
    }
  }
};

const run = async () => {
  await connectDatabase();
  logger.info('Telemetry Simulator running. Broadcasting real-time pulses every 10 seconds...');
  setInterval(simulateCycle, 10000);
  simulateCycle(); // Initial trigger
};

run();
