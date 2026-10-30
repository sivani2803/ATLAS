export const logger = {
  info: (msg, meta = {}) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(`[${new Date().toISOString()}] [WARN] \x1b[33m${msg}\x1b[0m`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (msg, err = {}) => {
    console.error(`[${new Date().toISOString()}] [ERROR] \x1b[31m${msg}\x1b[0m`, err?.stack || err);
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
    }
  }
};
