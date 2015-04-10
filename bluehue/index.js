"use strict";
/** @module bluemix */

var express = require('express');

exports.routes = require('./routes.js');

exports.router = express.Router();

exports.routes.addTo(exports.router);
