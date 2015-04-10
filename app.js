var express = require('express'),
    bodyParser = require('body-parser'),
    log = require('logule').init(module, 'Bluemix app'),
    dye = require('dye'),
    http = require('http'),
    bluehue = require('./bluehue');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api', bluehue.router);

app.use(function(req, res, next) {
    res.on('finish', function() {
        var method = res.statusCode < 400 ? dye.green(req.method) : dye.red(req.method);
        log.info('%s %s %d %d', dye.bold(method), req.OriginalUrl, res.statusCode, res._headers['content-length']);
    });
    res.on('error', function(err) {
        log.error('%s %s %d %s', req.method, req.originalUrl, res.statusCode, err);
    });
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

var server = http.createServer(app);

exports.app = app;
exports.server = server;
