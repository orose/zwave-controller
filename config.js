require('dotenv').config();

const config = {
  dbName: process.env.DB_NAME,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  appTitle: process.env.APP_TITLE
}

module.exports = config;
