/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');

var BlueHue = require("./BlueHue.js")

// var hue = require("node-hue-api"),
//     hueAPI = hue.HueApi,
//     lightState = hue.lightState;


//var hostname = '192.168.1.106',
//    port = '',
// var hostname = 'cap-sg-prd-5.integration.ibmcloud.com',
//     port = '15077',
//     username = '1b9d344433a8e96228cb584f358f983f',
//     api;


//api = new hueAPI(hostname, username, 10000, port);
//api.config().then(displayResult).done();

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json();


var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
    
};


// setup middleware
var app = express();
app.use(jsonParser);
//app.use(app.router);
app.use(express.errorHandler());
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// render index page
app.get('/', function(req, res){
	res.render('index');
});

var hue = new BlueHue();



// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server

app.listen(port, host);
console.log('App started on port ' + port);


app.post("/turnOff", function(req,res){

    hue.turnOff(1);

    res.end();
})


app.post("/turnOn", function(req,res){

    var hue = new BlueHue();

    hue.turnOn(1);

    res.end();
})

app.post("/standby", function(req,res){


    var hue = new BlueHue();

    hue.setReady(1);

    res.end();
})

app.post("/set_color", function(req,res){


    var r = req.body.R;
    var g = req.body.G;
    var b = req.body.B;


    console.log("Set Color : R:"+ r +", G:"+g+", B:"+b);
    
    hue.setColor(1, r, g, b);

    res.end();
})
