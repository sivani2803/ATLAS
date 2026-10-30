import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    relatedSensor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sensor',
      default: null
    },
    relatedAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskAssessment',
      default: null
    },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    triggerCondition: {
      metric: { type: String, default: 'LHI_SCORE' },
      threshold: { type: Number },
      observedValue: { type: Number },
      unit: { type: String }
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active'
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    acknowledgementNotes: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    deduplicationKey: {
      type: String,
      index: true
    },
    cooldownUntil: {
      type: Date,
      default: null
    },
    deliveryStatus: {
      inApp: { type: Boolean, default: true },
      email: { type: String, default: 'unconfigured' },
      sms: { type: String, default: 'unconfigured' }
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

alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ location: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
