import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema(
  {
    sensor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sensor',
      required: true
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    sensorType: {
      type: String,
      required: true,
      enum: ['soil_moisture', 'tiltmeter', 'rain_gauge', 'pore_pressure']
    },
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    observedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    ingestedAt: {
      type: Date,
      default: Date.now
    },
    dataSource: {
      type: String,
      enum: ['edge_http', 'edge_mqtt', 'demo_simulator', 'manual_import'],
      default: 'demo_simulator'
    },
    qualityStatus: {
      type: String,
      enum: ['valid', 'suspect', 'out_of_range'],
      default: 'valid'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: false
  }
);

sensorReadingSchema.index({ sensor: 1, observedAt: -1 });
sensorReadingSchema.index({ location: 1, observedAt: -1 });
sensorReadingSchema.index({ location: 1, sensorType: 1, observedAt: -1 });
sensorReadingSchema.index({ observedAt: -1 });

export const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);
