var hue = require("node-hue-api"),
    hueAPI = hue.HueApi,
    lightState = hue.lightState,
    log = require('logule').init(module, 'Hue');


//var hostname = '192.168.1.106',
var hostname = '9.191.74.89',
    port     = '80',
    username = '1b9d344433a8e96228cb584f358f983f',
    api;


function BlueHue(){

    var self = this;

    if (! (this instanceof BlueHue)){
        return new BlueHue();
    }

    api = new hueAPI(hostname, username, 10000, port);
    api.config();
}


var displayResult = function(result) {
    log.info(JSON.stringify(result, null, 2));
};

BlueHue.prototype.setLightNo = function (light_no){

    this.light_no = light_no;
}

BlueHue.prototype.turnOn = function(light_no){

    log.info(" turn on the light ");

    var setOnState = lightState.create().on();
    api.setLightState(light_no, setOnState);
}

BlueHue.prototype.setReady = function(light_no){

    log.info("Set light in standby mode. ");

    var setReadyState = lightState.create().on().rgb(255,150,0).bri(50).shortAlert();
    api.setLightState(light_no, setReadyState);
}


BlueHue.prototype.turnOff = function(light_no){

    log.info(" turn off the light ");
    
    var setOffState = lightState.create().off();
    api.setLightState(light_no, setOffState);
}


BlueHue.prototype.setColor = function(light_no, R, G, B){

    log.info("set light color. light_no: " + light_no);

    var setColorState = lightState.create().rgb(R,G,B);
    api.setLightState(light_no, setColorState);
}

exports = module.exports = BlueHue;

