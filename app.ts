import bodyParser = require('body-parser');
import express = require('express');
import fs = require('fs');
import tty = require('tty');

let app = express();
let clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;
let Message = require('azure-iot-device').Message;

// parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// config & connection
let config = JSON.parse(fs.readFileSync('config.json').toString());
let client = clientFromConnectionString(config.connectionString);

/**
 * Below, max & graph = code for outputting sample data, one row per one data sample
 * x    x                                                                                                                       end
 * xx   xx                  xxxxxxxxxxxxxxxxxx  x    xx   xx   x              xxxxxxx   xxxx x         xx   x                   end
 * xx   xx                  xxxxxxxxxxxxxxxxxx  x    xx   xx   x              xxxxxxx   xxxx x         xx   x                   end
 * xxxxxxxxxxxxxxxxxxxxxx   xxxxxxxxxxxxxxxxxxxxxx   xxxxxxxxxxxxxxxxxxx xxx  xxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxx    end
 **/
let max = 5;
let graph = function(data) {
	let str = "";
	for (var i in data) {
		// if (i > 25) continue;
		let n = Math.round(data[i]/500);
		if (n > max) n = max;

		for (let a = 0; a < n; a++) {
			str += "x";
		}

		for (let a = 0; a < (max-n); a++) {
			str += " ";
		}
	}

	str += "end";
	console.log(str);
}

// A method for automatically push sample data (obsolete, wrong format data posted now)
let poster = function() {
	let arr = [];
	for (let i = 0; i< 5*5; i++) {
		arr.push(Math.random() * 30);
	}

	let data = [arr, new Date()];

	if (isConnected) client.sendEvent(new Message(JSON.stringify(data)), function(err) { });//console.log("Data sent!", err)});
};

// map array to keyed object ({0=>arr0, 1=>arr1, ...n})
let toObject = function(array) {
	let obj = {};
	let a = 0;
	for (var i in array) {
		obj[a] = array[i];
		a++;
	}

	return obj;
}

// for testing, post random data
if (1 > 1) setInterval(poster, 1000);

// listen for incoming data
let lastSent = null;
app.post('/', function (req, res) {
	//console.log(req.body);
  // convert string to int
  for (let i in req.body.data) {
    req.body.data[i] = parseFloat(req.body.data[i]);
  }

	graph(req.body.data);

  // send msg to azure if connected, do not handle errors
  if (isConnected && (!lastSent || new Date() - lastSent > 1000)) {
		//console.log("sending!", new Date() - lastSent, req.body.data);
		let obj = toObject(req.body.data);
		client.sendEvent(new Message(JSON.stringify(obj])), function(err) {});
		lastSent = new Date();
	}

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

// express listener
app.listen(3000, function () {
  console.log('Listening on port 3000!');
});
