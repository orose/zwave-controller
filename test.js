var OZW = require('openzwave-shared');
var zwave = new OZW();
// OR pass extra options
var zwave = new OZW({
    Logging: true,     // disable file logging (OZWLog.txt)
    ConsoleOutput: false // enable console logging
});

zwave.connect('/dev/ttyAMA0');
