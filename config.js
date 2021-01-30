require('dotenv').config();

const config = {
  appTitle: process.env.APP_TITLE,
  securityKey: process.env.SECURITY_KEY,
  mqttUrl: process.env.MQTT_URL,
  apiHostname: process.env.API_HOSTNAME,
  apiPort: process.env.API_PORT
}

module.exports = config;
