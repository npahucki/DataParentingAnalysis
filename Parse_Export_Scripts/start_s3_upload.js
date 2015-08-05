#!/bin/env node
//  OpenShift sample Node application
var env = process.env;

(function () {
    global.Parse = require("./lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

//Just s3 upload from local files
var upload_to_s3= require("./lib/upload_to_s3");
upload_to_s3.perform();
