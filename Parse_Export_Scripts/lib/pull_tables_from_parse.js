/***
 * Module to abstract pulling all tables from Parse.com
 * module.exports.perform returns a Parse.Promise which resolves when all of the
 * tables are backed up in the /tmp directory
 */

var env = process.env;

(function () {
    global.Parse = require("../lib/parse.js").Parse;
    global.Parse.initialize( env['PARSE_API_KEY'], env['PARSE_JS_KEY'], env['PARSE_MASTER_KEY']);
})
();

Parse.Cloud.useMasterKey();

var _ = require('underscore');
var fs = require('fs');
var flat = require('flat');
var arr2csv = require('../lib/arr2csv.js');

var sqlMapping = require('../lib/sql_mapping.js');

var results = [];
var today = new Date().toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '').
        replace(/\s\d{2}:\d{2}:\d{2}/,'');
var pathToBackupDir="/tmp/parse-backup-for-"+today

module.exports.perform = function(){
    var promise = new Parse.Promise();
    if (checkStatus() == "ready"){
        return main();
    }
    else{
        promise.reject("Missing env variables, maybe? note that we need these: env['PARSE_API_KEY'] && env['PARSE_JS_KEY'] && env['PARSE_MASTER_KEY'] && env['MAILGUN_KEY']");
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
    var tables = sqlMapping.tables();
    var promise = new Parse.Promise();
    var promises=[];
    var beginBackup=false;
    if(!(fs.existsSync(pathToBackupDir))){
        console.log("Could not find backup directory for today, creating a new one and starting backup")
        fs.mkdirSync(pathToBackupDir)
        beginBackup=true
    }
    else{
        console.log("Backup directory exists, checking for files")
        if(!tablesReady()){//Wait 20 minutes then try again
            promises.push(new Parse.Promise())//Ensures that the Promise.when() will not resolve automatically
            var minutesToWait=30
            var milliseconds=minutesToWait*60*1000
            console.log("Trying again in "+minutesToWait+" minutes...")
            setTimeout(function(){
                if(tablesReady()){//Proceed with script
                    promise.resolve()
                }
                else{
                    promise.reject("Upload failed after second try.")
                }
            },milliseconds)
        }
    }
    if(beginBackup){
        _.each(tables, function( table ){
            fs.writeFileSync(pathToBackupDir+"/"+table+".~", "Lock file for "+table)
            var prom=backupTable(table);
            promises.push(prom)
            prom.then(function(){
                console.log("Finished backup for "+ table)
                fs.unlinkSync(pathToBackupDir+"/"+table+".~")
            })
        })
    }
    Parse.Promise.when(promises).then( function(){
        console.log('Backup Complete');
        promise.resolve();
    }, function(error){
        console.log('Backup failed miserably ' + JSON.stringify(error));
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
        return Parse.Promise.when(addFileToResults(fileInfo.jsonFile), addFileToResults(fileInfo.csvFile));
    });
}

/***
* checks if all the tables are ready, synchronous
* @return boolean
*/
function tablesReady(){
    var ready=false;
    var files=fs.readdirSync(pathToBackupDir).sort();
    var tables = sqlMapping.tables();
    var result;
    var necessaryFiles=[]
    _.each(tables, function(table){
        necessaryFiles.push(table+".csv",table+".json") 
    })
    if(files.length==0){
        result="Directory is empty."
    } else if(files.join(',').indexOf("~")>-1){
        result="Files currently being written, wait your turn."
    } else if(necessaryFiles.sort().join(',')===files.join(',')){
        result="We have a full pok\xE9dex"
        ready= true
    } else{
        result="Missing some file."
    }
    console.log(result)
    return ready
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
    fs.writeFileSync(pathToBackupDir+"/"+fileName, bits);
    return fileName;
}
/***
 *
 * @param fileName, bits
 * @returns Parse.Promise
 */
function appendFile(fileName, bits){
    var promise = new Parse.Promise();

    fs.appendFile(pathToBackupDir+"/"+fileName, bits, function(err){
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

