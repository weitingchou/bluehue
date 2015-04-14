"use strict";
/**
 * @module bluemix/routes
 */

var log = require('logule').init(module, 'Watson');

var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI();

function allow_methods(methods) {
    return function(req, res) {
        res.set('Allow', methods.join ? methods.join(',') : methods);
        res.send(200);
    };
}

exports.alchemy = function(router) {

    function handler(req, res) {
        try {
            var content = req.body.content || undefined;
            if (content) {
                var api = req.originalUrl.split('/')[3];
                log.debug('input api: '+api);
                var options = {};
                switch (api) {
                    case 'keywords':
                        options = {'sentiment': 1};
                        break;
                    case 'sentiment':
                        break;
                    default:
                        var err = new Error('Unknown api: '+api);
                        log.error(err);
                        throw err;
                }
                alchemyapi[api]('text', content, options, function(response) {
                    var result;
                    switch (api) {
                        case 'sentiment':
                            result = response.docSentiment || undefined;
                            break;
                        default:
                            result = response[api] || undefined;
                    }
                    if (result) {
                        res.send(JSON.stringify(result));
                    } else {
                        res.status(500).send(JSON.stringify({error: 'Unable to analyze the content'}));
                    }
                });
            } else {
                res.status(400).send(JSON.stringify({error: 'Bad request, content: '+content}));
            }
        } catch (err) {
            log.error('Unexpected error, err: '+err);
            res.status(500).send(JSON.stringify({error: 'Interal Error'}));
        }
    };

    router.route('/alchemy/keywords')
        .post(handler)
        .options(allow_methods('POST'));

    router.route('/alchemy/sentiment')
        .post(handler)
        .options(allow_methods('POST'));
};

exports.addTo = function(router) {
    this.alchemy(router);
};
