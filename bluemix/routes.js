"use strict";
/**
 * @module bluemix/routes
 */

var log = require('logule').init(module, 'bluemix');

function allow_methods(methods) {
    return function(req, res) {
        res.set('Allow', methods.join ? methods.join(',') : methods);
        res.send(200);
    };
}

exports.bluemix = function(router) {

    var registerHandler = function(req, res) {
        try {
            var mac = req.body.mac || undefined,
                passcode = req.body.passcode || undefined;

            if (mac && passcode) {
                
            } else {
                var errmsg = 'Not enough parameters.';
                log.error(errmsg);
                res.status(400).send({error: errmsg});
            }
        } catch (err) {
            log.error(err);
            res.status(400).send({error: err.message});
        }
    };

    router.route('/register')
        .post(registerHandler)
        .options(allow_methods('POST'));
};
