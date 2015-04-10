"use strict";
/**
 * @module bluemix/routes
 */

var log = require('logule').init(module, 'API'),
    uuid = require('node-uuid'),
    BlueHue = require('./hue'),
    db = require('./db');

db.deleteAllUsers();
db.initTicket();
var hue = new BlueHue();

function initHue() {
    hue.turnOff(1);
    hue.turnOff(2);
    hue.turnOff(3);
}
initHue();

var ticketTTL = 180000; // 3 minutes in milliseconds
function removeExpiredUsers() {
    try {
        var time = new Date().getTime() - ticketTTL;
        db.getUsersBefore(time, function(err, users) {
            if (err) {
                if (err.name !== 'NotFoundError') {
                    log.error('Failed to get expired users, err: '+err);
                }
            } else {
                users.forEach(function(user) {
                    db.deleteUser(user.mac, function(err) {
                        if (err) { log.error('Failed to delete user: '+user.mac); }
                        else {
                            log.info('User '+user.mac+' has been deleted!'); 
                            db.releaseTicket(user.ticket, function(err) {
                                if (err) { log.error('Failed to release ticket, err: '+err); }
                                else { hue.turnOff(user.ticket); }
                            });
                        }
                    });
                });
            }
        });
    } catch (err) {
        log.error('Unexpected error, err: '+err);
    }
}
setInterval(removeExpiredUsers, 30000);

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
            if (validateMacAndPasscodeFormat(mac, passcode)) {
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
                                db.releaseTicket(ticket, function(err) {
                                    if (err) { log.error('Failed to release ticket, err: '+err); }
                                });
                                if (err.name === 'DupKeyError') {
                                    return res.status(500).send({error: err.message});
                                } else {
                                    return res.status(500).send({error: 'Internal Error'});
                                }
                            }
                            hue.turnOn(ticket);
                            res.send({message: 'Success', lightbulb: ticket, key: key});
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
                color = req.body.color || undefined;

            if (validateKeyFormat(key) && validateColorFormat(color)) {
                db.getUser(key, function(err, user) {
                    if (err) {
                        if (err.name === 'IDError') {
                            log.error('Can\'t find the registry entry for the key: '+key);
                            return res.status(400).send({error: err.message});
                        }
                        log.error(err);
                        return res.status(500).send({error: 'Internal Error'});
                    }
                    hue.setColor(user.ticket, color.R, color.G, color.B);
                    res.send({message: 'Success'});
                });
            } else {
                log.error('Invalid request format, key: '+key+', color: '+JSON.stringify(color));
                res.status(400).send({error: 'Bad request'});
            }
        } catch (err) {
            log.error('Unexpected error, err: '+err);
            return res.status(500).send({error: 'Internal Error'});
        }
    };

    function resetHandler(req, res) {
        db.deleteAllUsers();
        db.initTicket();

        hue.turnOff(1);
        hue.turnOff(2);
        hue.turnOff(3);

        res.send('Success');
    };

    function validateMacAndPasscodeFormat(mac, passcode) {
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

    function validateColorFormat(color) {
        var R = color.R || undefined,
            G = color.G || undefined,
            B = color.B || undefined;

        try {
            R = parseInt(R, 10);
            G = parseInt(G, 10);
            B = parseInt(B, 10);
            if ((0 <= R && R <= 255) &&
                (0 <= G && G <= 255) &&
                (0 <= B && B <= 255)) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            log.error('Unexpected error detected when validating color setting, err: '+err);
            return false;
        }
    }

    function validateKeyFormat(key) {
        try {
            if (key) {
                var validator = /^([0-9A-F]{8}[-])([0-9A-F]{4}[-]){3}([0-9A-F]{12})$/i;
                if (validator.test(key)) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (err) {
            log.error('Unexpected error detected when validating key, err: '+err);
            return false;
        }
    }


    router.route('/register')
        .post(registerHandler)
        .options(allow_methods('POST'));

    router.route('/hue')
        .post(hueHandler)
        .options(allow_methods('POST'));

    router.route('/reset')
        .get(resetHandler);
};

exports.addTo = function(router) {
    this.bluemix(router);
};
