#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

//Section 1
//var backup  = require('./lib/backup.js');
//backup.perform();


//Section 2
//var file_import = require('./lib/file_import.js');
//file_import.perform();

//Test, just Parse.com download
//var pull_tables_from_parse = require('./lib/pull_tables_from_parse.js');
//pull_tables_from_parse.perform();

//Test, just s3 upload from local files
//var upload_to_s3= require("./lib/upload_to_s3")
//upload_to_s3.perform();

//Test, just postgreSQL upload
//var file_import = require('./lib/file_import.js');
//file_import.perform();

//Test, clear files
var clear_files=require('./lib/clear_files')
clear_files.perform();

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