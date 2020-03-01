const express = require('express');
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
  res.render('index', { title: 'Smarthome', message: 'Smarthome' })
});

app.get('/on', (req, res) => {
  child_zwave.send('on');
  res.redirect('/');
});

app.get('/off', (req, res) => {
  child_zwave.send('off');
  res.redirect('/');
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
