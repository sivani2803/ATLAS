import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/landslide_db',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_landslide_cinematic_earth_intel_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SENSOR_INGESTION_KEY: process.env.SENSOR_INGESTION_KEY || 'landslide_edge_telemetry_secure_key_9981',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  ALERT_EMAIL_FROM: process.env.ALERT_EMAIL_FROM || 'alerts@earth-intel.landslide.org',
};
