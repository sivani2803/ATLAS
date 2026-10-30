import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: 120
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    },
    region: {
      type: String,
      required: true,
      trim: true
    },
    elevation: {
      type: Number,
      default: 0 // meters
    },
    slopeAngle: {
      type: Number,
      required: true,
      min: 0,
      max: 90 // degrees
    },
    geologyType: {
      type: String,
      default: 'Colluvial soil & fractured bedrock'
    },
    monitoringStatus: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active'
    },
    currentRiskScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    },
    currentRiskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Low'
    },
    lastAssessmentAt: {
      type: Date,
      default: Date.now
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

locationSchema.index({ latitude: 1, longitude: 1 });
locationSchema.index({ region: 1 });
locationSchema.index({ currentRiskLevel: 1 });

export const Location = mongoose.model('Location', locationSchema);
