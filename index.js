const express = require('express');
const config = require('./config');
const { httpLogger } = require('./middlewares');
const { logger } = require('./utils');
const axios = require('axios');
const bodyParser = require('body-parser');

const fs = require('fs');

const path = require('path');
const fork = require('child_process').fork;

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false  }));

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

app.get('/status', (req, res) => {
  let titleText = config.appTitle;
  res.render('status', { title: titleText, message: titleText })
});

app.get('/status/:nodeId', (req, res) => {
  let titleText = config.appTitle;
  let url = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + req.params.nodeId;
  axios.get(url)
    .then(response => {
      res.render('node-info', { title: titleText, data: response.data })
  })
});

app.get('/vaskerom', (req, res) => {
  let titleText = config.appTitle;
  let vaskeromMultisensorId = 8;
  let vaskeromVifteId = 9;
  let urlMulti = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + vaskeromMultisensorId;
  let urlVifte = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + vaskeromVifteId;

  const requestMulti = axios.get(urlMulti);
  const requestVifte = axios.get(urlVifte);

  axios.all([requestMulti, requestVifte]).then(axios.spread((...responses) => {
    const responseMulti = responses[0];
    const responseVifte = responses[1];

    res.render('vaskerom', { title: titleText, dataMulti: responseMulti.data, dataVifte: responseVifte.data })
  })).catch(errors => {
      // react on errors.
  })
});

app.get('/gang', (req, res) => {
  let titleText = config.appTitle;
  let gangLaasId = 11;
  let gangSensorId = 10;
  let gangOvnId = 7;
  let urlLaas = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + gangLaasId;
  let urlSensor = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + gangSensorId;
  let urlOvn = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + gangOvnId;

  const requestLaas = axios.get(urlLaas);
  const requestSensor = axios.get(urlSensor);
  const requestOvn = axios.get(urlOvn);

  axios.all([requestLaas, requestOvn, requestSensor]).then(axios.spread((...responses) => {
    const responseLaas = responses[0];
    const responseOvn = responses[1];
    const responseSensor = responses[2];

    res.render('gang', { title: titleText, dataLaas: responseLaas.data, dataSensor: responseSensor.data, dataOvn: responseOvn.data })
  })).catch(errors => {
      // react on errors.
  })
});

app.get('/stue', (req, res) => {
  let titleText = config.appTitle;
  let stueOvnHyllerId = 6;
  let stueOvnVindu = 4;
  //let stueDoorId = ?;
  let stueSensorId = 2;
  let urlOvnHyller = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + stueOvnHyllerId;
  let urlOvnVindu = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + stueOvnVindu;
  let urlSensor = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + stueSensorId;
  //let urlDoor = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + stueDoorId;

  const requestOvnHyller = axios.get(urlOvnHyller);
  const requestOvnVindu = axios.get(urlOvnVindu);
  const requestSensor = axios.get(urlSensor);

  axios.all([requestOvnHyller, requestOvnVindu, requestSensor]).then(axios.spread((...responses) => {
    const responseOvnHyller = responses[0];
    const responseOvnVindu = responses[1];
    const responseSensor = responses[2];

    res.render('stue', { title: titleText, dataOvnHyller: responseOvnHyller.data, dataSensor: responseSensor.data, dataOvnVindu: responseOvnVindu.data })
  })).catch(errors => {
      // react on errors.
  })
});

app.get('/elliot', (req, res) => {
  let titleText = config.appTitle;
  let elliotDoorId = 3;
  let urlDoor = 'http://' + config.apiHostname + ':' + config.apiPort + '/api/node/' + elliotDoorId;

  const requestDoor = axios.get(urlDoor);

  axios.all([requestDoor]).then(axios.spread((...responses) => {
    const responseDoor = responses[0];

    res.render('elliot', { title: titleText, dataDoor: responseDoor.data })
  })).catch(errors => {
      // react on errors.
  })
});

app.get('/on', (req, res) => {
  child_zwave.send('on');
  res.redirect('/');
});

app.get('/off', (req, res) => {
  child_zwave.send('off');
  res.redirect('/');
});

app.get('/gang-ovn-off', (req, res) => {
  child_zwave.send('gang-ovn-off');
  res.redirect('/gang');
});

app.get('/gang-ovn-on', (req, res) => {
  child_zwave.send('gang-ovn-on');
  res.redirect('/gang');
});

app.get('/stue-ovn-off', (req, res) => {
  child_zwave.send('stue-ovn-off');
  res.redirect('/stue');
});

app.get('/stue-ovn-on', (req, res) => {
  child_zwave.send('stue-ovn-on');
  res.redirect('/stue');
});

app.get('/vifte-on', (req, res) => {
  child_zwave.send('vifte-on');
  res.redirect('/vaskerom');
});

app.get('/vifte-off', (req, res) => {
  child_zwave.send('vifte-off');
  res.redirect('/vaskerom');
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
  res.redirect('/gang');
});

app.get('/smekklaas-off', (req, res) => {
  child_zwave.send('smekklaas-off');
  res.redirect('/gang');
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
