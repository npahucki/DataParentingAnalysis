var smr=require('smr')
var _=require('underscore')
var Parse=require('Parse').Parse
var pg = require('pg');

var client = new pg.Client({user: 'adminc5a6jjw', password: 'NGpJUPsxp3s4', host: 'localhost', port: 5432, database: 'dadsbackups'});
client.connect(function(err) {
    if(err) {
    	return console.error('Could not connect to postgres', err);
    }
    console.log("Connected to postgres")
    getExpectedMilestones('3SzFwzLQgK').then(function(results){
        console.log(results)
        client.end()
        console.log("Script complete!")
    })
})

function selectCompletionDays(listOfIds){
	var string="select distinct "
	for (var i = 0; i < listOfIds.length; i++) {
    	string+="i"+i+".completiondays as i"+i
    	if(i<listOfIds.length-1){
    		string+=","
    	}
	}
	string+="\nfrom "
	for (var i = 0; i < listOfIds.length; i++) {
    	string+="milestoneachievements i"+i
    	if(i<listOfIds.length-1){
    		string+=","
    	}
	}
	string+="\nwhere "
	for (var i = 0; i < listOfIds.length-1; i++) {
    	string+="i"+i+".babyid=i"+(i+1)+".babyid"
    	if(i<listOfIds.length-2){
    		string+=" and "
    	}
	}
	string+="\nand "
	for (var i = 0; i < listOfIds.length; i++) { 
    	string+="i"+i+".standardmilestoneid="+"'"+listOfIds[i]+"'"
    	if(i<listOfIds.length-1){
    		string+=" and "
    	}
	}
	return string
}

//Wrapper function for a postgresQuery.  Returns a Parse.Promise
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

function calculateAgeInDays(birthDate){
    var now = new Date();
    var diff = (now.getTime() - new Date(birthDate))/ (60 * 60 * 24 * 1000);
    return Math.round(diff);
}


//Returns Parse.Promise resolved with a regression object for a list of independent variables and dependent variable
function getRegression(listOfIndependentVariables,dependentVariable){
	var promise = new Parse.Promise();
    var validationSet=[]
    var trainingSetSize=0
	var allIds=listOfIndependentVariables.slice(0)
	allIds.push(dependentVariable)
	var regression = new smr.Regression({ numX: listOfIndependentVariables.length, numY: 1 })
	postgresQuery(selectCompletionDays(allIds)).then(function(results){
		//console.log("Total number of data points: "+results.rows.length)
    	_.each(results.rows,function(element){
    		var length=Object.keys(element).length
    		var obj={x:[],y:[]}
    		for(var i =0;i<length-1;i++){
    			var key="i"+i
    			obj.x.push(element[key])
    		}
    		var key="i"+(length-1)
    		obj.y.push(element[key])
            regression.push(obj)
    	})
    	promise.resolve(regression)
    },function(err){
        promise.reject(err)
    })
    return promise;
}

function getExpectedMilestones(babyId){
    var num=0
    var promise=new Parse.Promise();
    var promises=[]
    var numberOfPredictors=17
    var ageInDays
    var milestonesInRange
    var recordedMilestones
    var sortedExpectedMilestones=[]
    postgresQuery("select duedate from babies where id='"+babyId+"'").then(function(results){
        ageInDays=calculateAgeInDays(results.rows[0].duedate)
        return postgresQuery("select id from standardmilestones where rangelow<="+ageInDays+" and rangehigh>="+ageInDays+ " and id is not null and id not in (select standardmilestoneid from milestoneachievements where babyId='"+babyId+"' and standardmilestoneid is not null)")
    }).then(function(results){
        milestonesInRange=_.pluck(results.rows,'id')
        return postgresQuery("select distinct on (smt.tagid) ma.standardmilestoneid, smt.tagid, ma.completiondays from milestoneachievements ma, standardmilestonetags smt where ma.babyid='"+babyId+"' and ma.standardmilestoneid is not null and ma.standardmilestoneid=smt.standardmilestoneid")
    }).then(function(results){
        recordedMilestones=_.object(_.pluck(results.rows,"standardmilestoneid"),_.map(results.rows,function(value) {return Number(value.completiondays)}))
        var independentVariables=_.keys(recordedMilestones).slice(0,numberOfPredictors)
        var predictors=_.values(recordedMilestones).slice(0,numberOfPredictors)
        _.each(milestonesInRange,function(milestone){
            var prom=getRegression(independentVariables,milestone).then(
                function(results){
                    var obj={}
                    obj['x']=predictors
                    var prediction=results.hypothesize(obj)[0]
                    if(_.isFinite(prediction)){
                        sortedExpectedMilestones.push([milestone,prediction])
                    }
                    console.log("Calculating milestone "+ ++num)
                },function(err){
                    console.log(err)
                })
            promises.push(prom)
        })
        Parse.Promise.when(promises).then(function(){
            sortedExpectedMilestones=_.sortBy(sortedExpectedMilestones,function(value){return value[1]})
            console.log(sortedExpectedMilestones)
            sortedExpectedMilestones=_.map(sortedExpectedMilestones,function(value){return value[0]})
            promise.resolve(sortedExpectedMilestones)
        },function(err){
            console.log(err)
            promise.reject(err)
        })
    },function(err){
        console.log(err)
    })
    return promise
}

function testModel(regression, testData){
	var sum=0
	var count=0
	_.each(testData,function(element){
		var prediction = regression.hypothesize(_.pick(element,"x"))[0]
		var actual = element.y[0]
		var error = prediction-actual
		sum+=Math.abs(error)
		count++
	})
	console.log("Average error: "+sum/count)
}
