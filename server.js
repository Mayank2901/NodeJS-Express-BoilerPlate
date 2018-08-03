var dotenv = require('dotenv');
dotenv.load()
var fs = require('fs');
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/config');

var port = process.env.PORT || 8080; // set our port
// Connect to mongodb
var connect = function() {
	mongoose.connect(config.db, config.mongoose);
};
connect();

var response = {
	error: false,
	data: null,
	userMessage: '',
	errors: null
};

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function(file) {
	if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

// Bootstrap application settings
require('./config/express')(app, passport);
// Bootstrap routes
var router = express.Router();
require('./config/routes')(router, passport);
app.use('/api', router);
var server = app.listen(port);
console.log('API started, Assigned port : ' + port);
module.exports = app;