var log = require('logule').init(module, 'Bluemix DB'),
    config = require('./config'),
    async = require('async'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = mongoose.createConnection(config.dbUrl);

var UserSchema = new Schema({
    mac: {type: String, unique: true},
    passcode: String,
    key: String,
    ticket: Number,
    createAt: Number
});
var User = db.model('User', UserSchema);

exports.createUser = function(mac, passcode, key, ticket, callback) {
    var user = new User({
        mac: mac,
        passcode: passcode,
        key: key,
        ticket: ticket,
        createAt: new Date().getTime()
    });
    user.save(function(err) {
        if (err) {
            if (err.code === 11000) {
                var error = new Error('Already registered');
                error.name = 'DupKeyError';
                return callback(error, null);
            }
            return callback(err, null); 
        }
        callback(null, 'Success');
    });
};

exports.getUser = function(key, callback) {
    User.find({key: key}).exec(function(err, data) {
        if (err) { return callback(err, null); }
        else if (data.length === 0) {
            var error = new Error('Resource(s) with the specified id was not found');
            error.name = 'IDError';
            return callback(error, null);
        }
        var user = data[0];
        callback(null, user);
    });
};

exports.getUsersBefore = function(timeStamp, callback) {
    User.find({createAt: {$lt: timeStamp}}).exec(function(err, data) {
        if (err) { return callback(err, null); }
        else if (data.length === 0) {
            var error = new Error('No user has been created before '+timeStamp);
            error.name = 'NotFoundError';
            return callback(error, null);
        }
        callback(null, data);
    });
};

exports.deleteUser = function(mac, callback) {
    User.remove({mac: mac}, callback);
};

exports.deleteAllUsers = function() {
    User.remove({}, function(err) {
        if (err) { log.error('Failed to delete all users, err: '+err); }
    });
};

var CounterSchema = new Schema({
    name: String,
    count: Number
});
var Counter = db.model('Counter', CounterSchema);

var TicketSchema = new Schema({
    number: Number,
    issued: Boolean
});
var Ticket = db.model('Ticket', TicketSchema);

exports.initTicket = function() {
    async.series({
        clean_counter: function(callback) {
            Counter.remove({}, callback);
        },
        clean_ticket: function(callback) {
            Ticket.remove({}, callback);
        },
        init_counter: function(callback) {
            var counter = new Counter({
                name: 'lightbulb',
                count: 0
            });
            counter.save(function(err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, null);
                }
            });
        },
        init_ticket: function(callback) {
            for (var i = 1; i <= config.totalTickets; i++) {
                var ticket = new Ticket({
                    number: i,
                    issued: false
                });
                ticket.save(function(err) {
                    if (err) { log.error('Unable to create ticket: '+i); }
                });
            }
        }
    }, function(err, result) {
        if (err) {
            log.error('Initialize ticket counter failed: ,err: '+err);
        }
    });
};

exports.getTicket = function(callback) {
    Counter.findOneAndUpdate({name: 'lightbulb', count: {$lt: config.totalTickets}}, {$inc: {count: 1}}, function(err, counter) {
        if (err) { return callback(err, null); }
        if (counter) {
            Ticket.findOneAndUpdate({issued: false}, {$set: {issued: true}}, function(err, ticket) {
                if (err) {
                    log.error('Failed to find free ticket!');
                } else {
                    log.info('Ticket issued: '+ticket.number+'. Current ticket count: '+counter.count);
                    callback(null, ticket.number);
                }
            });
        } else {
            log.info('Run out of ticket!');
            var error = new Error('No ticket left.');
            error.name = 'OutOfResourceError';
            callback(error, null);
        }
    });
};

exports.releaseTicket = function(ticketNumber, callback) {
    Counter.findOneAndUpdate({name: 'lightbulb', count: {$gte: 0}}, {$inc: {count: -1}}, {}, function(err, counter) {
        if (err) { return callback(err, null); }
        if (counter) {
            Ticket.findOneAndUpdate({number: ticketNumber}, {$set: {issued: false}}, function(err) {
                if (err) {
                    log.error('Failed to release ticket: '+ticketNumber);
                } else {
                    log.info('Ticket released: '+ticketNumber+'. Current ticket count: '+counter.count);
                    callback(null, null);
                }
            });
        } else {
            log.info('All tickets are released!');
            var error = new Error('All ticket are ready.');
            error.name = 'OutOfIndexError';
            callback(error, null);
        }
    });
};

