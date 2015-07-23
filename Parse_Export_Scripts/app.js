#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    Parse.initialize( "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U", "Km9C7vBKrLdnDf8Uc3Zgf3qdw3qmbYa13R8RD1q2", env['PARSE_MASTER_KEY']);
})
();


var promise = Parse.Promise.as();

//Section 1
var backup  = require('./lib/backup.js');
/*
//backup.perform();


//Section 2
 var file_import = require('./lib/file_import.js');
 file_import.perform();
*/

promise = promise.then(function(){
    console.log('before backup.perform');
    return backup.perform();
}).then(function(msg){
    console.log(msg);
    console.log('before file_import.perform');
    var file_import = require('./lib/file_import.js');
    return file_import.perform();
})
