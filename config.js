require('dotenv').config();

const config = {
  appTitle: process.env.APP_TITLE,
  securityKey: process.env.SECURITY_KEY,
  apiHostname: process.env.API_HOSTNAME,
  apiPort: process.env.API_PORT
}

module.exports = config;
