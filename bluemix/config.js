/**
 * @module
 */

var log = require('logule').init(module, 'Bluemix route');

var dbUrl = process.env.VCAP_SERVICES ?
            JSON.parse(process.env.VCAP_SERVICES).mongolabNoSQLDB[0].credentials.url :
            'mongodb://localhost:27017/';

log.info("Using MongoDB located at %s", dbUrl);

module.exports = {
    dbUrl: dbUrl
};
