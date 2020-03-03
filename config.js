require('dotenv').config();

const config = {
  dbHostname: process.env.DB_HOSTNAME,
  dbName: process.env.DB_NAME,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  appTitle: process.env.APP_TITLE,
  securityKey: process.env.SECURITY_KEY
}

module.exports = config;
