var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var fs = require('fs');
var _ = require('underscore');
//var Parse = require("parse.js").Parse;
var today = new Date().toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '').
        replace(/\s\d{2}:\d{2}:\d{2}/,'');
var pathToBackupDir="/tmp/parse-backup-for-"+today

var sqlMapping = require('../lib/sql_mapping.js');
var pull_tables_from_parse = require('./pull_tables_from_parse.js');

var env = process.env;

/***
 * Main import function. This wraps the actual import
 * @return Parse.Promise
 */
function main(){
    pull_tables_from_parse.perform().then(function(){
        var mainPromise=new Parse.Promise();
        var database = "dadsbackups";
        var conString = env['OPENSHIFT_POSTGRESQL_DB_URL'] + '/' + database ;
        var client = new pg.Client(conString);
        //Uncomment the following line for local testing
        //var client = new pg.Client({user: 'adminc5a6jjw', password: 'NGpJUPsxp3s4', host: 'localhost', port: 5432, database: 'dadsbackups'});
        client.connect(function(err) {
            if(err) {
                return console.error('could not connect to postgres', err);
            }
            console.log("Connected to postgres")
            //run create_tables.sql
            var init_script = fs.readFileSync('./lib/create_tables.sql').toString();
            client.query(init_script, function(err, result){
                if(err){
                    console.log('error: ', err);
                    return
                }
                console.log('Finished creating table schema, beginning write');
                var promises=[]
                _.each(sqlMapping.tables(), function(file){
                    var tableName = file.toLowerCase().replace('_', '');
                    if (tableName == "user"){
                        tableName = "users";
                    }
                    var promise = new Parse.Promise();
                    promises.push(promise);
                    var fileName = pathToBackupDir + "/" + file + ".csv"
                    var queryString = 'COPY ' + tableName + " FROM stdin DELIMITER ',' CSV HEADER QUOTE '\"' ESCAPE '\\';";
                    var stream = client.query(copyFrom(queryString));
                    stream.on('error', function(err){
                        promise.reject(err);
                    });
                    stream.on('end', function(){
                        console.log("Finished writing table " + tableName);
                        promise.resolve()
                    })
                    var str = fs.readFileSync(fileName);
                    stream.write(str);
                    stream.end();
                });
                Parse.Promise.when(promises).then(function(){
                    var tags_script = fs.readFileSync('./lib/populate_tags.sql').toString();
                    client.query(tags_script, function(err, result){
                        if(err){
                            console.log('error: ', err);
                            return
                        }
                        client.end();
                        mainPromise.resolve();
                        console.log("Script complete!");
                    });
                },function(err){
                    mainPromise.reject(err);
                });
            });
        });
        return mainPromise;
    }, function(err){
        console.log(JSON.stringify(err))
    })
    
}


/***
 *
 * PostgreSQL 9.2 database added.  Please make note of these credentials:

 Root User: adminc5a6jjw
 Root Password: NGpJUPsxp3s4
 Database Name: dadsbackups

 Connection URL: postgresql://$OPENSHIFT_POSTGRESQL_DB_HOST:$OPENSHIFT_POSTGRESQL_DB_PORT
 *
 *
 */


function checkStatus(){
    /***
     * Check if the backup should proceed. Dies otherwise
     * @return String
     */
    var status = "ready";
    if ( typeof(
        env['OPENSHIFT_POSTGRESQL_DB_URL'] &&
        env['MAILGUN_KEY']) === 'undefined' ){

        status = "dont";
    }
    return String(status);
}


module.exports.perform = function(){
    var promise=new Parse.Promise();
    if (checkStatus() == "ready"){
        return main();
    }
    else{
        promise.reject("Missing env variables, maybe? note that we need these: env['OPENSHIFT_POSTGRESQL_DB_URL'] && env['MAILGUN_KEY']");
    }
    return promise;
}