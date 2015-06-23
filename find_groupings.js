var request=require("request");
var GENERIC_BABY_ID = "LyOL5AJKa4";
var Parse = require('./init_parse').createParse();
var _=require('underscore');
var http=require('http')
http.globalAgent.maxSockets = 50;
var achievementMap={};
var similarity=0;
var errs=[];
var achievements=[];
var achievementsToCheck=[];
var savedAchievements=[]
var achievementsToConsider={}  //Map from title to # of matches
var saved=0
var titles=[]
function findGroups(){
    if (achievementsToCheck.length==1){
      console.log(achievementsToConsider)
      console.log("No more achievements to process.  Script complete!")
      return;
    }
    var num=0
    var achievement1=achievementsToCheck.pop();
    var titleI=achievement1.get("customTitle");
    _.each(achievementsToCheck, function(achievement2){
        var titleJ=achievement2.get("customTitle");
        var url= "http://swoogle.umbc.edu/SimService/GetSimilarity"
        var params= {'operation':'api','phrase1':titleI,'phrase2':titleJ}
        request({url:url, qs:params}, function(err, response, body) {
          var sim=0;
          if(err){console.log(err);}
          console.log("Count: "+ ++num)
          if(Number(body)){
            var sim=Number(body)
          }
          if (sim>=0.9){
            console.log(sim)
            simObject=new Parse.Object("Similarities")
            simObject.set("achievement1",achievement1)
            simObject.set("title1",titleI)
            simObject.set("achievement2",achievement2)
            simObject.set("title2",titleJ)
            simObject.set("similarityScore",sim)
            simObject.save().then(function(){
              console.log("*****************SAVED: "+ ++saved+"***************")  
              console.log(titleI+"-----"+titleJ)
            }, function(error){
              console.log(error)
            })
            if(titleI in achievementsToConsider){
              achievementsToConsider[titleI]++
            }
            else{
              achievementsToConsider[titleI]=1
            }
          }
          if (num==achievementsToCheck.length-3){
          findGroups()
          }
        })  
        
    })
}

console.log("Start")
var query = new Parse.Query("MilestoneAchievements");
query.exists("customTitle");
query.doesNotExist("standardMilestone");
query.notEqualTo("customTitle","${He}'s born and is beautiful!");
query.include("baby");
query.equalTo("isSkipped", false);
query.equalTo("isPostponed", false);
//query.descending("customTitle");
var querySimilarities= new Parse.Query("Similarities");
querySimilarities.each(function(similarityObject){
  var title=similarityObject.get("title1")
  if (!(title in titles)){
    titles.push(title)
  }
}).then(function(){
  query.notContainedIn("title1",titles)
  query.each(function(achievement) {
      if(!achievement.get("baby")) {
        console.warn("Skipped achievement " + achievement.id + " because it had a null baby - PLEASE CHECK IT");
      }
      else if(achievement.get("baby").id != GENERIC_BABY_ID) {
        name=achievement.get("customTitle")
        if (name.indexOf("lb")==-1 &&name.indexOf("kg")==-1&&name.indexOf("kg")==-1 &&name.indexOf("cm")==-1 && name.indexOf("months")==-1){
          achievements.push(achievement)
        }
      }
    }).then(function(){
    console.log(achievements);
    console.log(achievements.length);
    achievementsToCheck=achievements.slice(0);
    findGroups();
  })
})