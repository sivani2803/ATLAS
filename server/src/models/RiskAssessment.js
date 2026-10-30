import mongoose from 'mongoose';

const riskAssessmentSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Moderate', 'High', 'Critical']
    },
    factors: {
      rainfallScore: { type: Number, default: 0 },
      soilMoistureScore: { type: Number, default: 0 },
      displacementScore: { type: Number, default: 0 },
      porePressureScore: { type: Number, default: 0 },
      slopeFactor: { type: Number, default: 1.0 },
      weights: {
        rainfall: { type: Number, default: 0.35 },
        soilMoisture: { type: Number, default: 0.25 },
        displacement: { type: Number, default: 0.25 },
        porePressure: { type: Number, default: 0.15 }
      },
      rawMeasurements: {
        rainfall: { type: mongoose.Schema.Types.Mixed },
        soilMoisture: { type: mongoose.Schema.Types.Mixed },
        displacement: { type: mongoose.Schema.Types.Mixed },
        porePressure: { type: mongoose.Schema.Types.Mixed }
      }
    },
    scientificDisclaimer: {
      type: String,
      default: 'Empirical decision-support indicator. Not an independently confirmed landslide or certified prediction.'
    },
    methodVersion: {
      type: String,
      default: 'LHI-v2.2-EmpiricalPhysicsBased'
    },
    dataQuality: {
      status: {
        type: String,
        enum: ['optimal', 'partial', 'degraded'],
        default: 'optimal'
      },
      missingSensors: [{ type: String }],
      staleSensors: [{ type: String }],
      freshnessPenalty: { type: Number, default: 0 }
    },
    confidenceRating: {
      type: String,
      default: 'Decision Support Advisory'
    },
    evaluatedAt: {
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

riskAssessmentSchema.index({ location: 1, evaluatedAt: -1 });
riskAssessmentSchema.index({ riskLevel: 1 });
riskAssessmentSchema.index({ evaluatedAt: -1 });

export const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema);
