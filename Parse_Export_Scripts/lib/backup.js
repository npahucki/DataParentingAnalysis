/***
 * Module to abstract backing up Parse tables to S3
 *
 */

var env = process.env;

(function () {
    global.Parse = require("../lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

Parse.Cloud.useMasterKey();


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
        accessKeyId: env['S3_CLIENT_KEY'],
        secretAccessKey: env['S3_SECRET_KEY']
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
        //promise.resolve( main() );
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
    var tables = sqlMapping.tables();
    var promise = Parse.Promise.as();
    var promises=[]
    _.each(tables, function( table ){
        promise = promise.then(function() {
            console.log("Starting Backup for " + table);
            return backupTable(table);
        });
    });

    promise.then( function(){
        //console.log('Backup Complete');
        return notify("Backup Complete", results, "");

    }, function(error){
        //console.log('Backup failed miserably ' + JSON.stringify(error));
        return notify("Backup failed miserably", error, "");
    });
    return promise;
}


/***
 * backups a whole table. This acts as a wrapper for individual actions
 * @param table
 * @return Parse.promise
 */
function backupTable(table) {
    return retrieveData(table).then(function (fileInfo) {
        return Parse.Promise.when(transferFile(fileInfo.jsonFile), transferFile(fileInfo.csvFile))
            .then(function () {
                Parse.Promise.when(deleteFile(fileInfo.jsonFile));
            })
            .then(function () {
                Parse.Promise.when(addFileToResults(fileInfo.jsonFile), addFileToResults(fileInfo.csvFile));
            });

    });
}

/***
 * Retrieves a table from Parse.com
 * @param table
 * @return Parse.Promise
 */
function retrieveData(table){
    var fieldName = table.indexOf('_') == 0 ?
        table.substring(1, table.length) :
        table;

    //BAD BAD PARSE.COM API. You need to leave the _ to query the
    // _Installation table.
    if ('_Installation' === table){
        fieldName = table;
    }

    var fixed_csv_cols = ['id', 'createdAt', 'updatedAt'];
    var csv_cols = sqlMapping.cols(table).concat(fixed_csv_cols);

    var jsonFile = writeFile(table + '.json', '{"results": [');
    var csvFile = writeFile(table + '.csv', arr2csv.toString(csv_cols));


    var separator = "";

    return new Parse.Query(fieldName).each(function(obj){
        var copy = flat(obj.attributes);
        if ( obj.get('tag') ){
            copy['tag'] = obj.get('tag').toString();
        }
        var csv  = toCsv(copy, table);
        _.each(fixed_csv_cols, function(k){
            csv.push(obj[k]);
        });

        var promise = Parse.Promise.when(
            appendFile(jsonFile, separator + String( JSON.stringify(obj))),
            appendFile(csvFile, arr2csv.toString(csv))
        );

        if(separator == ""){
            separator = ",";
        }

        return promise;
    }).then( function(){
        return appendFile(jsonFile, ']}');
    }).then(function() {
        return Parse.Promise.as({jsonFile : jsonFile, csvFile : csvFile});
    });
}

function toCsv(obj, table){
    var csv = [];
    var keys = Object.keys(sqlMapping[table]);
    _.each(keys, function(k){
        var flattened_key_to_use = sqlMapping[table][k];
        csv.push(obj[flattened_key_to_use]);
    });
    return csv;
}



/***
 *
 * @param table, bits
 * @returns fileName
 */
function writeFile(fileName, bits){
    fs.writeFileSync(fileName, bits);
    return fileName;
}
/***
 *
 * @param fileName, bits
 * @returns Parse.Promise
 */
function appendFile(fileName, bits){
    var promise = new Parse.Promise();

    fs.appendFile(fileName, bits, function(err){
        if (err){
            promise.reject(err);
        }
        else{
            promise.resolve(fileName);
        }
    });
    return promise;
}


/***
 *
 * @param fileName
 * @returns Parse.Promise
 */
function deleteFile(fileName){
    var promise = new Parse.Promise();
    fs.unlink(fileName, function (err) {
        if (err){
            promise.reject(err);
        }
        else{
            promise.resolve(fileName);
        }
    });
    return promise;
}
/***
 *
 * @param table
 * @returns Parse.Promise
 */
function transferFile( fileName ){
    var promise = new Parse.Promise();
    var params = {
        localFile: fileName,
        s3Params: {
            Bucket: "op-backups",
            Key: String('dadsbackups/' + env['PARSE_API_KEY'] + '/' + today + '/' + fileName)
        }
    };
    //use promise.resolve and promise.reject
    // var uploader = s3Client.uploadFile(params);
    // uploader.on('error', function(err) {
    //     console.log("Unable to upload "+ fileName);
    //     promise.reject(String("unable to upload: " + err.stack));
    // });
    // uploader.on('end', function() {
    //     console.log("Uploaded "+ fileName);
    //     promise.resolve(fileName);
    // });
    console.log("Uploaded "+ fileName);
    promise.resolve(fileName);
    return promise;

}

/***
 *
 * @param table
 * @returns Parse.Promise
 */
function addFileToResults(filePath){
    var promise = new Parse.Promise();
    results.push(filePath);
    promise.resolve(filePath);
    return promise;
}


//Get rid of this
function tableToFile(table){
    return String(table + '.json' );
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

