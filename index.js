const express = require('express');
const config = require('./config');
const { httpLogger } = require('./middlewares');
const { logger } = require('./utils');

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

app.get('/remove-node', (req, res) => {
  child_zwave.send('remove-node');
  res.redirect('/');
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
