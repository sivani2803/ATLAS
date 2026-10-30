import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['soil_moisture', 'tiltmeter', 'rain_gauge', 'pore_pressure']
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded', 'stale'],
      default: 'online'
    },
    thresholds: {
      warning: {
        type: Number,
        required: true
      },
      critical: {
        type: Number,
        required: true
      }
    },
    depthMeters: {
      type: Number,
      default: 1.0
    },
    lastReadingValue: {
      type: Number,
      default: null
    },
    lastReadingAt: {
      type: Date,
      default: null
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 98
    },
    firmwareVersion: {
      type: String,
      default: 'v2.4.1-edge'
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

sensorSchema.index({ location: 1 });
sensorSchema.index({ type: 1 });
sensorSchema.index({ status: 1 });

export const Sensor = mongoose.model('Sensor', sensorSchema);
