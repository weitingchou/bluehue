/**
 * @module
 */

var log = require('logule').init(module, 'Bluemix route');

var dbUrl = process.env.VCAP_SERVICES ?
            JSON.parse(process.env.VCAP_SERVICES).mongolab[0].credentials.uri :
            'mongodb://localhost:27017/';
var totalTickets = 3; // Number of Hue lightbulbs

log.info("Using MongoDB located at %s", dbUrl);

module.exports = {
    dbUrl: dbUrl,
    totalTickets: totalTickets
};
