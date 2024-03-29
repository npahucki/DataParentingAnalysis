/***
 * Module to abstract backing up Parse tables to S3
 *
 */

var env = process.env;

var _ = require('underscore');
var s3 = require('s3');
var fs = require('fs');
var flat = require('flat');
var arr2csv = require('../lib/arr2csv.js');
var pull_tables_from_parse = require('./pull_tables_from_parse.js');

var sqlMapping = require('../lib/sql_mapping.js');
var s3Client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 209715200, // this is the default (200 MB)
    multipartUploadSize: 157286400, // this is the default (150 MB)
    s3Options: {
        accessKeyId: env['S3_CLIENT_KEY'],
        secretAccessKey: env['S3_SECRET_KEY']
        //Backup to op-backups/dadsbackups
    }
});

var today = new Date().toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '').
        replace(/\s\d{2}:\d{2}:\d{2}/,'');
var pathToBackupDir="/tmp/parse-backup-for-"+today

var results = [];

module.exports.perform = function(){
    var promise = new Parse.Promise();
    if (checkStatus() == "ready"){
        return main();
    }
    else{
        promise.reject("Missing env variables, maybe? note that we need these: env['S3_CLIENT_KEY'] && env['S3_SECRET_KEY'] && env['PARSE_API_KEY'] && env['PARSE_JS_KEY'] && env['PARSE_MASTER_KEY'] && env['MAILGUN_KEY']");
    }
    return promise;
}


function checkStatus(){
    /***
     * Check if the backup should proceed. Dies otherwise
     * @return String
     */
    var status = "ready";
    if ( typeof(
        env['S3_CLIENT_KEY'] &&
        env['S3_SECRET_KEY'] &&
        env['PARSE_API_KEY'] &&
        env['PARSE_JS_KEY'] &&
        env['PARSE_MASTER_KEY'] &&
        env['MAILGUN_KEY']) === 'undefined' ){
        
        status = "dont";
    }
    return String(status);
}

/***
 * Main backup function. This wraps the actual backup
 * @return Parse.Promise
 */
function main(){
    pull_tables_from_parse.perform().then(function(){
        var tables = fs.readdirSync(pathToBackupDir);
        var promise=new Parse.Promise;
        var promises=[]
        console.log("Starting upload to S3");
        _.each(tables, function( table ){
            promises.push(transferFile(table));
        });

        Parse.Promise.when(promises).then(function(){
            console.log("Backup complete!")
            promise.resolve();
        }, function(error){
            console.log('Backup failed miserably ' + JSON.stringify(error));
            promise.reject(error);
        });
        return promise;
    }, function(err){
        console.log(err)
    });
}


/***
 *
 * @param table
 * @returns Parse.Promise
 */
function transferFile( fileName ){
    var path=pathToBackupDir+"/"+fileName
    var promise = new Parse.Promise();
    var params = {
        localFile: path,
        s3Params: {
            Bucket: "op-backups",
            Key: String('dadsbackups/' + env['PARSE_API_KEY'] + '/' + today + '/' + fileName)
        }
    };
    var uploader = s3Client.uploadFile(params);
    uploader.on('error', function(err) {
        console.log("Unable to upload "+ fileName);
        promise.reject(String("unable to upload: " + err.stack));
    });
    uploader.on('end', function() {
        console.log("Uploaded "+ fileName);
        promise.resolve(fileName);
    });
    return promise;
}