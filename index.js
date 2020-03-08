const express = require('express');
const config = require('./config');
const { httpLogger } = require('./middlewares');
const { logger } = require('./utils');

const fs = require('fs');

const path = require('path');
const fork = require('child_process').fork;

const app = express();
const port = 3000;

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

app.get('/add-node-secure', (req, res) => {
  child_zwave.send('add-node-secure');
  res.redirect('/');
});

app.get('/remove-node', (req, res) => {
  child_zwave.send('remove-node');
  res.redirect('/');
});

app.get('/reset-controller', (req, res) => {
  child_zwave.send('reset-controller');
  res.redirect('/');
});

app.get('/heal', (req, res) => {
  child_zwave.send('heal');
  res.redirect('/');
});

app.get('/unlock-door', (req, res) => {
  child_zwave.send('unlock-door');
  res.redirect('/');
});

app.get('/lock-door', (req, res) => {
  child_zwave.send('lock-door');
  res.redirect('/');
});

app.get('/smekklaas-on', (req, res) => {
  child_zwave.send('smekklaas-on');
  res.redirect('/');
});

app.get('/smekklaas-off', (req, res) => {
  child_zwave.send('smekklaas-off');
  res.redirect('/');
});

app.get('/report/:nodeId', (req, res) => {
  child_zwave.send('report_' + req.params.nodeId);
  res.redirect('/');
});

child_zwave.on('message', message => {
  logger.info(`ZWaveController: ${message}`);
  //let data = JSON.stringify(message);
  //fs.writeFileSync('./logs/message-dump.json', data);
})

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
