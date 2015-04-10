var log = require('logule').init(module, 'Bluemix DB'),
    config = require('./config'),
    async = require('async'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = mongoose.createConnection(config.dbUrl);

var UserSchema = new Schema({
    mac: String,
    passcode: String,
    key: String,
    ticket: Number
});
var User = db.model('User', UserSchema);

exports.createUser = function(mac, passcode, key, ticket, callback) {
    var user = new User({
        mac: mac,
        passcode: passcode,
        key: key,
        ticket: ticket
    });
    user.save(function(err) {
        if (err) { return callback(err, null); }
        callback(null, 'Success');
    });
};

exports.getUser = function(key, ticket, callback) {
    User.find({key: key, ticket: ticket}).exec(function(err, data) {
        if (err) {
            return callback(err, null);
        }
        else if (data.length === 0) {
            var error = new Error('Resource(s) with the specified id was not found');
            error.name = 'IDError';
            return callback(error, null);
        }
        var user = data[0];
        callback(null, user);
    });
};

exports.getUserByTime = function(before, callback) {
    
};

exports.deleteUser = function(mac, callback) {
    User.remove({mac: mac}, callback);
};

exports.deleteAllUsers = function(callback) {
    User.remove({}, callback);
};

var CounterSchema = new Schema({
    name: String,
    count: Number
});

var Counter = db.model('Counter', CounterSchema);

exports.initTicketCounter = function() {
    async.series({
        clean: function(callback) {
            Counter.remove({}, callback);
        },
        init: function(callback) {
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
        }
    }, function(err, result) {
        if (err) {
            log.error('Initialize ticket counter failed: ,err: '+err);
        }
    });
};

exports.getTicket = function(callback) {
    Counter.findOneAndUpdate({name: 'lightbulb', count: {$lte: 2}}, {$inc: {count: 1}}, function(err, counter) {
        if (err) { return callback(err, null); }
        if (counter) {
            log.info('Ticket issued! Current ticket count: '+counter.count);
            callback(null, counter.count);
        } else {
            log.info('Run out of ticket!');
            var error = new Error('No ticket left.');
            error.name = 'OutOfResourceError';
            callback(error, null);
        }
    });
};

exports.releaseTicket = function(callback) {
    Counter.findOneAndUpdate({name: 'lightbulb', count: {$gte: 0}}, {$inc: {count: -1}}, {}, function(err, counter) {
        if (err) { return callback(err, null); }
        if (counter) {
            log.info('Ticket released! Current ticket count: '+counter.count);
            callback(null, counter.count);
        } else {
            log.info('All tickets are released!');
            var error = new Error('All ticket are ready.');
            error.name = 'OutOfIndexError';
            callback(error, null);
        }
    });
};

