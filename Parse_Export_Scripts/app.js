#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

//Just s3 upload from local files
var upload_to_s3= require("./lib/upload_to_s3")
//upload_to_s3.perform();

//Just postgreSQL upload
var file_import = require('./lib/file_import.js');
file_import.perform();

/*
var promise = Parse.Promise.as();
promise = promise.then(function(){
    console.log('Starting backup.perform');
    var backup  = require('./lib/backup.js');
    return backup.perform();
}).then(function(){
	console.log('Starting file_import.perform');
	var file_import = require('./lib/file_import.js');
	file_import.perform();
}, function(error){
	console.log(JSON.stringify(error))
})
*/