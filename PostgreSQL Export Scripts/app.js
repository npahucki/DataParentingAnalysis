#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    global.
        Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();


var promise = Parse.Promise.as();

//var backup  = require('./lib/backup.js');
//backup.perform();

 var file_import = require('./lib/file_import.js');
 file_import.perform();


//promise = promise.then(function(){
//    console.log('before backup.perform');
//    return backup.perform();
//}).then(function(msg){
//    console.log(msg);
//    console.log('before file_import.perform');
//    var file_import = require('./lib/file_import.js');
//    return file_import.perform();
//})


