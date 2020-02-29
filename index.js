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

app.get('/on', (req, res) => {
  child_zwave.send('on');
  res.send('Hello World!');
});

app.get('/off', (req, res) => {
  child_zwave.send('off');
  res.send('Hello World!');
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
