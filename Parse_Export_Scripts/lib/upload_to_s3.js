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


var sqlMapping = require('../lib/sql_mapping.js');
var s3Client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 209715200, // this is the default (200 MB)
    multipartUploadSize: 157286400, // this is the default (150 MB)
    s3Options: {
        accessKeyId: 'AKIAIBY43TYP7CVAVFMA',
        secretAccessKey: 'iYib6DRIal9VtRrrZKFRqcbxqLbErAuH54SOOUSY'
        //Backup to op-backups/dadsbackups
    }
});

var today = new Date().toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '').
        replace(/\s\d{2}:\d{2}:\d{2}/,'');


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
        
        //status = "dont";
    }
    return String(status);
}

/***
 * Main backup function. This wraps the actual backup
 * @return Parse.Promise
 */
function main(){
    var dir = __dirname.substring(0, __dirname.lastIndexOf('/'));
    var tables = fs.readdirSync(dir);
    tables=_.filter(tables, function(fileName){
        return (fileName.split('.').pop()=="json" || fileName.split('.').pop()=="csv") && fileName!="package.json"
    })
    var promise=new Parse.Promise;
    var promises=[]
    console.log("Starting Backup for " + tables);
    _.each(tables, function( table ){
        promises.push(transferFile(table));
    });

    Parse.Promise.when(promises).then(function(){
        console.log("Backup complete!")
        promise.resolve();
    }, function(error){
        console.log('Backup failed miserably ' + JSON.stringify(error));
        return notify("Backup failed miserably", error, "");
    });
    return promise;
}


/***
 *
 * @param table
 * @returns Parse.Promise
 */
function transferFile( fileName ){
    var path=__dirname.substring(0, __dirname.lastIndexOf('/'))+"/"+fileName
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


/***
 *
 * @return Parse.promise
 */
function notify(title, object, mimeType) {

    var Mailgun = require('mailgun').Mailgun;

    var mg = new Mailgun(env['MAILGUN_KEY']);
    mg.sendText('app@alerts.dataparenting.com', 'cooper.sloan@gmail.com',
        "[DP_ALERT]:" + title,
        typeof object === 'string' ? object : JSON.stringify(object,null,4),
        'noreply@alerts.dataparenting.com', {},
        function(err) { //replace error message
            if (err) console.log("Email couldn't be sent. This is the error: " + err);
        });

};

