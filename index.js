const express = require('express');
const mysql = require('mysql');
const config = require('./config');
const { httpLogger } = require('./middlewares');
const { logger } = require('./utils');

const fs = require('fs');

const path = require('path');
const fork = require('child_process').fork;

const app = express();
const port = 3000;

const db = mysql.createConnection ({
    host: config.dbHostname,
    user: config.dbUsername,
    password: config.dbPassword,
    database: config.dbName
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

const zwaveserver = path.resolve('./zwaveserver.js');
const parameters = [];
const options = {
    stdio: [ 'pipe', 'pipe', 'pipe', 'ipc'  ]
};
const child_zwave = fork(zwaveserver, parameters, options);

app.use(httpLogger);
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  let titleText = config.appTitle;
  res.render('index', { title: titleText, message: titleText })
});

app.get('/on', (req, res) => {
  child_zwave.send('on');
  res.redirect('/');
});

app.get('/off', (req, res) => {
  child_zwave.send('off');
  res.redirect('/');
});

app.get('/add-node', (req, res) => {
  child_zwave.send('add-node');
  res.redirect('/');
});

app.get('/remove-node', (req, res) => {
  child_zwave.send('remove-node');
  res.redirect('/');
});

app.get('/report/:nodeId', (req, res) => {
  child_zwave.send('report_' + req.params.nodeId);
  res.redirect('/');
});

child_zwave.on('message', message => {
  let data = JSON.stringify(message);
  fs.writeFileSync('./logs/message-dump.json', data);
})

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
