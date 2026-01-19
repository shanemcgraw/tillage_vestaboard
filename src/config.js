require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  adminPassword: process.env.ADMIN_PASSWORD,
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'board@tillage.place'
  },
  vestaboard: {
    apiKey: process.env.VESTABOARD_API_KEY,
    apiSecret: process.env.VESTABOARD_API_SECRET,
    subscriptionId: process.env.VESTABOARD_SUBSCRIPTION_ID
  }
};
