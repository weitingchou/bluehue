"use strict";
/**
 * @module bluemix/routes
 */

var log = require('logule').init(module, 'Bluemix'),
    uuid = require('node-uuid'),
    BlueHue = require('./BlueHue'),
    db = require('./db');

log.error('in routes, init ticket');
db.initTicketCounter();
var hue = new BlueHue();

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
            if (validateMacAndPasscode(mac, passcode)) {
                db.getTicket(function(err, ticket) {
                    log.debug('Ticket get: '+ticket);
                    if (err) {
                        if (err.name === 'OutOfResourceError') {
                            log.info(err.message);
                            return res.status(500).send({error: err.message});
                        }
                        log.error('Failed to get ticket, err'+err);
                        return res.status(500).send({error: 'Internal Error'});
                    } else {
                        var key = uuid.v4();
                        db.createUser(mac, passcode, key, ticket, function(err) {
                            if (err) {
                                log.error('Failed to create user, err: '+err);
                                return res.status(500).send({error: 'Internal Error'});
                            }
                            hue.turnOn(ticket);
                            res.send({message: 'Success', ticket: ticket, key: key});
                        });
                    }
                });
            } else {
                log.error('Invalid MAC address or passcode, MAC: %s, passcode: %s', mac, passcode);
                res.status(400).send({error: 'Invalid MAC address or passcode'});
            }
        } catch (err) {
            log.error('Unexpected error, err: '+err);
            return res.status(500).send({error: 'Internal Error'});
        }
    };

    var hueHandler = function(req, res) {
        try {
            var key = req.body.key || undefined,
                ticket = req.body.ticket || undefined,
                color = req.body.color || undefined;

            if (key && ticket && validateColor(color)) {
                db.getUser(key, ticket, function(err) {
                    if (err) {
                        if (err.name === 'IDError') {
                            log.error('Can\'t find the registry entry for the key (%s) and ticket (%d) pair', key, ticket);
                            return res.status(400).send({error: err.message});
                        }
                        log.error(err);
                        return res.status(500).send({error: 'Internal Error'});
                    }
                    hue.setColor(ticket, color.R, color.G, color.B);
                    res.send({message: 'Success'});
                });
            } else {
                log.error('Invalid request format, key: '+key+', ticket: '+ticket+', color: '+JSON.stringify(color));
                res.status(400).send({error: 'Bad request'});
            }
        } catch (err) {
            log.error('Unexpected error, err: '+err);
            return res.status(500).send({error: 'Internal Error'});
        }
    };

    function validateMacAndPasscode(mac, passcode) {
        try {
            if (mac && passcode) {
                var macValidator = /^([0-9A-F]{2}){6}$/i;
                if (!macValidator.test(mac)) {
                    return false;
                }
                var passcodeValidator = /^([0-9]{2}){3}$/i;
                if (!passcodeValidator.test(passcode)) {
                    return false;
                }
                return true;
            } else {
                return false;
            }
        } catch (err) {
            log.error('Unexpected error, err: '+err);
            return false;
        }
    }

    function validateColor(color) {
        var R = color.R || undefined,
            G = color.G || undefined,
            B = color.B || undefined;

        try {
            if ((0 <= R <= 255) &&
                (0 <= G <= 255) &&
                (0 <= B <= 255)) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            log.error('Unexpected error detected when validating color setting, err: '+err);
            return false;
        }
    }


    router.route('/register')
        .post(registerHandler)
        .options(allow_methods('POST'));

    router.route('/hue')
        .post(hueHandler)
        .options(allow_methods('POST'));
};

exports.addTo = function(router) {
    this.bluemix(router);
};
