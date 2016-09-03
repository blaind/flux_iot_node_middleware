import bodyParser = require('body-parser');
import express = require('express');
import fs = require('fs');
let app = express();

let clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
let Message = require('azure-iot-device').Message;

// parsers
app.use(bodyParser.json());

// config & connection
let config = JSON.parse(fs.readFileSync('config.json').toString());
let client = clientFromConnectionString(config.connectionString);

let poster = function() {
	let arr = [];
	for (let i = 0; i< 5*5; i++) {
		arr.push(Math.random() * 30);
	}

	let data = [arr, new Date()];

	if (isConnected) client.sendEvent(new Message(data), function(err) { console.log("Data sent!", err)});
};

// for testing, post random data
if (1 > 1) setInterval(poster, 1000);

// listen for incoming data
app.post('/', function (req, res) {
  // convert string to int
  for (let i in req.body.data) {
    req.body.data[i] = parseFloat(req.body.data[i]);
  }

  console.log("Received frame", req.body.data);

  // send msg to azure if connected, do not handle errors
  if (isConnected) client.sendEvent(new Message(req.body.data), function(err) {});

  // just reply to client
  res.send('Got it!');
});

// whether azure is connected
let isConnected = false;

let connectCallback = function (err) {
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
