"use strict";
var server = require('./app.js').server,
    log = require('logule').init(module, 'Server');

var port = process.env.PORT || 3005;
server.listen(port, function() {
    log.info("Server running on port %d", port);
});
