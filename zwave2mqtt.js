var ZWave = require('openzwave-shared');
var os = require('os');
var mqtt = require('mqtt');

const axios = require('axios');
const config = require('./config');
const fs = require('fs');

var mqttClient;

const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
}

var logPath = __dirname + '/logs';

var zwave = new ZWave({
  ConsoleOutput: false,
  SaveConfiguration: true,
  UserPath: logPath,
  NetworkKey: config.securityKey
});

zwavedriverpaths = {
  "darwin": '/dev/cu.usbmodem1411',
  "linux": '/dev/ttyAMA0',
  "windows": '\\\\.\\COM3'
}

var nodes = [];
var homeid = null;

zwave.on('connected', function (version) {
  //process.send("**** CONNECTED ****");
  //process.send("Openzwave version:" + version);
});

zwave.on('driver ready', function (home_id) {
  homeid = home_id;
  //process.send('scanning homeid=0x' + homeid.toString(16) + '...');
});

zwave.on('driver failed', function () {
  //process.send('Failed to start driver');
  //process.exit();
});

zwave.on('node added', function (nodeid) {
  nodes[nodeid] = {
    manufacturer: '',
    manufacturerid: '',
    product: '',
    producttype: '',
    productid: '',
    type: '',
    name: '',
    loc: '',
    classes: {},
    ready: false,
  };
});

zwave.on('node event', function (nodeid, data) {
  //process.send('node ' + nodeid + ' event: Basic set ' + data);
  console.log('node ' + nodeid + ' event: ' + label + ': ' + data);
  eventReceivedToMQTT(nodeid, data);
});

zwave.on('value added', function (nodeid, comclass, value) {
  if (!nodes[nodeid]['classes'][comclass])
    nodes[nodeid]['classes'][comclass] = {};
  nodes[nodeid]['classes'][comclass][value.index] = value;
});

zwave.on('value changed', function (nodeid, comclass, value) {
  if (nodes[nodeid]['ready']) {
    let label = value['label'];
    let oldValue = nodes[nodeid]['classes'][comclass][value.index]['value'];
    let newValue = value['value'];

    //console.log('node ' + nodeid + ' changed: ' + comclass + ':' + label + ':' + newValue);
    console.log('node ' + nodeid + ' changed: ' + label + ': ' + newValue);
    valueChangedToMQTT (nodeid, label, oldValue, newValue);
  }
  nodes[nodeid]['classes'][comclass][value.index] = value;
});

zwave.on('value removed', function (nodeid, comclass, index) {
  if (nodes[nodeid]['classes'][comclass] &&
    nodes[nodeid]['classes'][comclass][index])
    delete nodes[nodeid]['classes'][comclass][index];
});

zwave.on('node ready', function (nodeid, nodeinfo) {
  nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
  nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
  nodes[nodeid]['product'] = nodeinfo.product;
  nodes[nodeid]['producttype'] = nodeinfo.producttype;
  nodes[nodeid]['productid'] = nodeinfo.productid;
  nodes[nodeid]['type'] = nodeinfo.type;
  nodes[nodeid]['name'] = nodeinfo.name;
  nodes[nodeid]['loc'] = nodeinfo.loc;
  nodes[nodeid]['ready'] = true;
  console.log('node%d: %s, %s', nodeid,
    nodeinfo.manufacturer ? nodeinfo.manufacturer : 'id=' + nodeinfo.manufacturerid,
    nodeinfo.product ? nodeinfo.product : 'product=' + nodeinfo.productid +
      ', type=' + nodeinfo.producttype);
  console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
    nodeinfo.name,
    nodeinfo.type,
    nodeinfo.loc);
  for (comclass in nodes[nodeid]['classes']) {
    switch (comclass) {
      case 0x25: // COMMAND_CLASS_SWITCH_BINARY
      case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
        zwave.enablePoll(nodeid, comclass);
        break;
    }
    var values = nodes[nodeid]['classes'][comclass];
    console.log('node%d: class %d', nodeid, comclass);
    for (idx in values)
      console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[
        idx]['value']);
  }
});

zwave.on('notification', function (nodeid, notif) {
  switch (notif) {
    case 0:
      //process.send('node ' + nodeid + ': message complete');
      break;
    case 1:
      //process.send('node ' + nodeid + ': timeout');
      break;
    case 2:
      console.log('node%d: nop', nodeid);
      //process.send('node ' + nodeid + ': nop');
      break;
    case 3:
      console.log('node%d: node awake', nodeid);
      //process.send('node ' + nodeid + ': node awake');
      break;
    case 4:
      console.log('node%d: node sleep', nodeid);
      //process.send('node ' + nodeid + ': node sleep');
      break;
    case 5:
      console.log('node%d: node dead', nodeid);
      //process.send('node ' + nodeid + ': node dead');
      break;
    case 6:
      console.log('node%d: node alive', nodeid);
      //process.send('node ' + nodeid + ': node alive');
      break;
  }
});

zwave.on('scan complete', function () {
  //process.send('====> scan complete');
  console.log('Scan complete')
  let data = JSON.stringify(nodes);
  storeData(nodes, './node-dump.json');

  mqttClient = mqtt.connect(config.mqttUrl);

  mqttClient.on("connect", function() {
    mqttClient.subscribe("zwave/command/#", function(err) {
       if (err) {
         console.log("Error connecting to mqtt broker")
      }
    });
  });

  mqttClient.on("message", function(topic, message) {
    // message is Buffer
    //console.log(topic.toString());
    //console.log(message.toString());
    let command = JSON.parse(message.toString());
    if ("zwave/command" === topic.toString()) {
      console.log("Node " + command.nodeId + " turned " + command.command);
      let onValue = "on" === command.command;
      zwave.setValue(command.nodeId,37,1,0,onValue);
    }
    //client.end();
  });

  //zwave.addNode(true);

  // set dimmer node 5 to 50%
  //    zwave.setValue(5,38,1,0,50);
  //zwave.setValue({node_id:5,	class_id: 38,	instance:1,	index:0}, 50 );
  //zwave.setValue({node_id:3,	class_id: 37,	instance:1,	index:0}, true );
  //zwave.setValue(3,37,1,0,true);
  //zwave.requestAllConfigParams(3);
});

zwave.on('controller command', function (n, rv, st, msg) {
  console.log(
    'controller commmand feedback: %s node==%d, retval=%d, state=%d', msg,
    n, rv, st);
  //process.send('Controller command feedback: ' + msg + ' node=' + n + ' retval=' + rv + ' state=' + st);
});

//process.send('Connecting to ' + zwavedriverpaths[os.platform()]);
zwave.connect(zwavedriverpaths[os.platform()]);

//process.on('SIGINT', function () {
  //process.send('Disconnecting...');
  //zwave.disconnect(zwavedriverpaths[os.platform()]);
  //process.exit();
//});


/*
process.on('message', function (message) {
  if (message === 'on') {
    zwave.setValue(4,37,1,0,true);
    zwave.setValue(6,37,1,0,true);
    zwave.setValue(7,37,1,0,true);
  } else if (message === 'off') {
    zwave.setValue(4,37,1,0,false);
    zwave.setValue(6,37,1,0,false);
    zwave.setValue(7,37,1,0,false);
  } else if (message === 'gang-ovn-off') {
    zwave.setValue(7,37,1,0,false);
  } else if (message === 'gang-ovn-on') {
    zwave.setValue(7,37,1,0,true);
  } else if (message === 'stue-ovn-off') {
    zwave.setValue(4,37,1,0,false);
    zwave.setValue(6,37,1,0,false);
  } else if (message === 'stue-ovn-on') {
    zwave.setValue(4,37,1,0,true);
    zwave.setValue(6,37,1,0,true);
  } else if (message === 'vifte-on') {
    zwave.setValue(9,37,1,0,true);
  } else if (message === 'vifte-off') {
    zwave.setValue(9,37,1,0,false);
  } else if (message === 'add-node-secure') {
    zwave.addNode(true);
  } else if (message === 'add-node') {
    zwave.addNode(false);
  } else if (message === 'remove-node') {
    zwave.removeNode();
  } else if (message === 'reset-controller') {
    //zwave.hardReset();
  } else if (message === 'lock-door') {
    zwave.setValue(11,98,1,0,true);
  } else if (message === 'unlock-door') {
    zwave.setValue(11,98,1,0,false);
  } else if (message === 'smekklaas-off') {
    zwave.setConfigParam(11,1,0,1);
  } else if (message === 'smekklaas-on') {
    zwave.setConfigParam(11,1,3,1);
  } else if (message === 'heal') {
    zwave.healNetwork();
  } else if (message === 'report_2') {
    console.log("Node: %j", nodes[2]);
    process.send(nodes[2]);
  } else if (message === 'report_3') {
    console.log("Node: %j", nodes[3]);
    process.send(nodes[3]);
  } else if (message === 'report_4') {
    console.log("Node: %j", nodes[4]);
    process.send(nodes[4]);
  }
});
*/

function valueChangedToMQTT(nodeid, label, oldValue, newValue) {
  let payload = {
    nodeId: nodeid,
    data: {
      label: label,
      newValue: newValue,
      oldValue: oldValue
    }
  };
  let options = {
    retain: true,
    qos: 2
  };

  //mqttClient.publish("zwave/event", JSON.stringify(payload));
  let topic = ['zwave', 'event', 'node', nodeid, topicLabelMapper(label)].join('/');
  let value = valueMapper(label, newValue);
  mqttClient.publish(topic, value, options);
}

function eventReceivedToMQTT(nodeid, dataReceived) {
  let payload = {
    nodeId: nodeid,
    data: dataReceived
  };

  //let topicString = "zwave/event/node"
  //mqttClient.publish("zwave/event", JSON.stringify(payload));

  let options = {
    retain: true,
    qos: 2
  };

  let topic = ['zwave', 'event', 'node', nodeId, topicLabelMapper(dataReceived.label)].join('/');
  let value = valueMapper(dataReceived.label, dataReceived.newValue);
  mqttClient.publish(topic, value, options);
}

function topicLabelMapper(topicLabel) {
  return topicLabel.toLowerCase().replace(/\s+/g, "");
}

function valueMapper(label, value) {
  if (label.toLowerCase() === "switch") {
    if (value === true) {
      return "true";
    } else {
      return "false";
    }
  }
  return value.toLowerCase().replace(/\s+/g, "");
}
