
var request=require("request");
var GENERIC_BABY_ID = "LyOL5AJKa4";
var Parse = require('./init_parse').createParse();
var _=require('underscore');
var http=require('http');
http.globalAgent.maxSockets = 50;
var simMap={};
var similarity=0;
var errs=[];
var titles=[];
var completed=["${He}'s born and is beautiful!"];
var num=0;

function findMostSimilar(achievement){
  var numProcessed=0;
	var customTitle=achievement.get("customTitle")
  var standardMilestoneQuery=new Parse.Query("StandardMilestones")
	standardMilestoneQuery.each(function(standardMilestone){
    var standardTitle=standardMilestone.get("title")
		var url= "http://swoogle.umbc.edu/SimService/GetSimilarity"
	  var params= {'operation':'api','phrase1':customTitle,'phrase2':standardTitle}
	  var sim=0;
	  request({url:url, qs:params}, function(err, response, body) {
      console.log("Checked against StandardMilestone: " + ++numProcessed)
  		if(err) { console.log(err);errs.push(err);}
  		if (Number(body)){
  			sim=Number(body)
      }
      if (sim>=0.75){
        var simObject= new Parse.Object("Similarities")
        simObject.set("achievement1",achievement)
        simObject.set("standardMilestone",standardMilestone)
        simObject.set("title1",customTitle)
        simObject.set("title2",standardTitle)
        simObject.set("similarityScore",sim)
        console.log("**********Saved: "+ ++num+"**********")
        console.log(customTitle+"----"+standardTitle);
        simObject.save();
      }
      if(numProcessed==901){
      console.log("**********Total Processed: "+completed.length+"**********")
      console.log(completed)
      getNextMilestone()
      }
    })
  })
}

var query = new Parse.Query("MilestoneAchievements");
query.exists("customTitle")
query.doesNotExist("standardMilestone");
query.include("baby");
query.equalTo("isSkipped", false);
query.equalTo("isPostponed", false);
query.descending("customTitle");
var querySimilarities= new Parse.Query("Similarities");
querySimilarities.each(function(similarityObject){
  var title=similarityObject.get("title1")
  if (!(title in titles)){
    titles.push(title)
  }
}).then(function(){
  query.notContainedIn("customTitle",titles)
  console.log("Start")
  console.log(titles)
  getNextMilestone();
})

function getNextMilestone(){
  query.notContainedIn("customTitle",completed);
  query.first(function(achievement) {
    if(!(achievement)){
      console.log("No more achievements to process. Script complete.")
    }
    else{
      completed.push(achievement.get("customTitle"))
      if(!achievement.get("baby")) {
          console.warn("Skipped achievement " + achievement.id + " because it had a null baby - PLEASE CHECK IT");
      }
      else if(achievement.get("baby").id != GENERIC_BABY_ID) {
        name=achievement.get("customTitle")
        if(name.indexOf("lb")==-1 && name.indexOf("cm")==-1 && name.indexOf("kg")==-1){
          findMostSimilar(achievement)   
        }
      }
      else{
        getNextMilestone()
      }
    }
  })
}