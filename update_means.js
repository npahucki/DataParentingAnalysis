var GENERIC_BABY_ID = "LyOL5AJKa4";
var Parse = require('./init_parse').createParse();
var _=require('underscore');
var math=require('mathjs');

function calculateMilestoneValues(milestoneMeta) {
    // data is { milestone : stdMilstone, completedOnDays : []}
    var milestone = milestoneMeta.milestone;
    var listOfDays = milestoneMeta.completedOnDays
    if (listOfDays.length > 1) {
      var mean = math.mean(listOfDays)
      var stdev = math.std(listOfDays)
      var lowRange=mean-2*stdev
      var highRange=mean+2*stdev
      
      milestone.set("calculatedMean",Math.round(Number(mean)));
      milestone.set("calculatedStdDev",Math.round(Number(stdev)));
      milestone.set("dataPoints",Number(listOfDays.length));
      milestone.set("calculatedRangeLow",Math.round(Number(lowRange)));
      milestone.set("calculatedRangeHigh",Math.round(Number(highRange)));
      return milestone.save();
    }
}

var processedCount = 0;
var query = new Parse.Query("MilestoneAchievements");
var achievements=[];
query.exists("standardMilestone");
query.include("standardMilestone");
query.equalTo("isSkipped", false);
query.equalTo("isPostponed", false);
query.select("completionDays") // Cooper: double check. 

var stdMilestoneMap = {}; // milestoneId to object, { milestone : stdMilstone, completedOnDays : []}
query.each(function(achievement) {
    if(!achievement.get("standardMilestone")) {
        console.warn("Skipped achievement " + achievement.id + " because it had a null standardMilestone - PLEASE CHECK IT");
    } else if(!achievement.get("baby")) {
        console.warn("Skipped achievement " + achievement.id + " because it had a null baby - PLEASE CHECK IT");
    } else if(achievement.get("baby").id != GENERIC_BABY_ID) {
      var milestone = achievement.get("standardMilestone");
      var milestoneMeta = stdMilestoneMap[milestone.id];
      if(!milestoneMeta) {
        milestoneMeta = { completedOnDays : [], milestone : milestone };
        stdMilestoneMap[milestone.id] = milestoneMeta;
      } 
      if(achievement.get("completionDays")){
        milestoneMeta.completedOnDays.push(achievement.get("completionDays"));
      }
        console.log("Processed " + ++processedCount);
    }
}).then(function() {
  var promises = [];
  _.each(_.values(stdMilestoneMap) , function(milestoneMeta) {
    promises.push(calculateMilestoneValues(milestoneMeta));
  });
  return Parse.Promise.when(promises);
}).then(function() {
  console.log("Successfully completed script!");
}, function(error){
  console.error("Could not complete script :" + JSON.stringify(error));
});