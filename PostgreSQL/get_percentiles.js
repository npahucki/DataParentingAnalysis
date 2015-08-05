var pg = require('pg');
var _ = require('underscore');
var Parse = require('./init_parse').createParse();

var create_percentile_function="CREATE OR REPLACE FUNCTION percentiles_for_baby (x varchar) RETURNS table( tag varchar, percentile double precision) AS $$ select t.tag, round(avg(idx(subquery.arrayofdays,completiondays)::double precision/icount(subquery.arrayofdays) * 100)) as percentile from milestoneachievements ma, standardmilestones sm, babies b, tags t, standardmilestonetags smt, (select standardmilestoneid, sort_desc(array_agg(completiondays)::int[]) as arrayofdays from milestoneachievements ma1 where completiondays is not null and not ma1.isskipped and not ma1.ispostponed group by standardmilestoneid order by count(completiondays) desc) as subquery where b.id=ma.babyid and ma.standardmilestoneid=sm.id and subquery.standardmilestoneid=sm.id and sm.id=smt.standardmilestoneid and t.id=smt.tagid and b.id=$1 group by t.tag order by percentile $$ LANGUAGE SQL;"
var database = "dadsbackups";
//var conString = env['OPENSHIFT_POSTGRESQL_DB_URL'] + '/' + database ;
//var client = new pg.Client(conString);
var client = new pg.Client({user: 'adminc5a6jjw', password: 'NGpJUPsxp3s4', host: 'localhost', port: 5432, database: 'dadsbackups'});
var num=0
var objs=0
var count=0
function getPercentiles(babyId){
	return "select percentiles_for_baby('"+babyId+"');"
}
var query=new Parse.Query("Babies")
client.connect(function(err) {
    if(err) {
    	return console.error('Could not connect to postgres', err);
    }
    console.log("Connected to postgres")
    postgresQuery(create_percentile_function).then(function(){
    postgresQuery("select id from babies").then(function(results){
    var babyIds=_.pluck(results.rows,"id")
    console.log(babyIds)
    var promises=[]
    _.each(babyIds, function(id){
    	promises.push(postgresQuery(getPercentiles(id)).then(function(results){
	    	var listOfPercentiles=_.pluck(results.rows, "percentiles_for_baby")
	    	var jsonPercentiles=_.reduce(listOfPercentiles, function(obj,value){
				var tag=value.split(",")[0].slice(1).replace(/\"/g,"")
				var percentile=parseInt(value.split(",")[1].slice(0,-1))
				obj[tag]=percentile
				return obj
			},new Object())
			console.log("Processed "+ ++num)
			if (!_.isEmpty(jsonPercentiles)){
				console.log(jsonPercentiles)
				console.log("Getting object "+ ++count)
				query.get(id).then(function(baby){
					console.log("Got object "+ ++objs)
					baby.set("percentiles", jsonPercentiles)
					//return baby.save();
				},function(err){
					console.log(err);
				})

			}
    	}))
    })
    Parse.Promise.when(promises).then(function(){
    	client.end();
    })
    },function(err){
    	console.log(err);
	});
	});
})

function postgresQuery(queryString){
	var promise = new Parse.Promise();
	client.query(queryString,function(err, result){
		if(err){
			promise.reject(err)
		}
		else{
			promise.resolve(result)
		}
	})
	return promise
}