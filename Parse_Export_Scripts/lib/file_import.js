var pg = require('pg');
var copyFrom = require('pg-copy-streams').from;
var fs = require('fs');
var _ = require('underscore');
var Parse = require("Parse").Parse;

var sqlMapping = require('../lib/sql_mapping.js');

var env = process.env;

function main(){
    var database = "dadsbackups";
    var conString = env['OPENSHIFT_POSTGRESQL_DB_URL'] + '/' + database ;
    var client = new pg.Client(conString);
    var client = new pg.Client({user: 'adminc5a6jjw', password: 'NGpJUPsxp3s4', host: 'localhost', port: 5432, database: 'dadsbackups'});
    // var client = new pg.Client({user: 'porta', password: 'porta', host: 'localhost', port: 5432, database: 'dadsbackups'});
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
                var fileName = file + ".csv"
                var queryString = 'COPY ' + tableName + " FROM stdin DELIMITER ',' CSV HEADER QUOTE '\"' ESCAPE '\\';";
                var stream = client.query(copyFrom(queryString));
                stream.on('error', function(err){
                    return console.error('failed', err);
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
                client.end();
                console.log("Script complete!")
            })
            
        });
    });
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

        //status = "dont";
    }
    return String(status);
}


module.exports.perform = function(){
    if (checkStatus() == "ready"){
        main();
    }
    else{
        console.log("Missing env variables, maybe? note that we need these: env['OPENSHIFT_POSTGRESQL_DB_URL'] && env['MAILGUN_KEY']");
    }
    return "Starting backup";
}