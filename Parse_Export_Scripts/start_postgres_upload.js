#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

//Just postgreSQL upload
var file_import = require('./lib/file_import.js');
file_import.perform();
