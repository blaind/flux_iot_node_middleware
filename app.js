var clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var express = require('express');
var bodyParser = require('body-parser')
var app = express();

// parsers, urlencoded probably not needed
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
 
// connect to azure
var connectionString = '//ADD STR HERE//'; 
var client = clientFromConnectionString(connectionString);

// listen for incoming data
app.post('/', function (req, res) {
  // convert string to int
  for (var i in req.body.data) {
    req.body.data[i] = parseInt(req.body.data[i]);
  }

  console.log("Received frame", req.body.data);

  // send msg to azure if connected, do not handle errors
  if (isConnected) client.sendEvent(new Message(req.body.data), function(err) {});

  // just reply to client
  res.send('Got it!');
});

// whether azure is connected
var isConnected = false;

var connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err);
  } else {
    console.log('Client connected');
    isConnected = true;
  }
};

client.open(connectCallback);

app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
