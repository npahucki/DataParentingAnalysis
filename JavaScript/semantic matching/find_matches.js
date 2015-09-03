var Parse = require('./init_parse').createParse();
var prompt=require('prompt')
var l=[]
var completedTitles=[]
var count=0
var query = new Parse.Query("Similarities");
query.exists('standardMilestone');
query.descending('similarity');

function saveNewStandardMilestone(achievement,standardMilestone,getNext){
	if(getNext){
		findMatches();
	}
	achievement.set("standardMilestone",standardMilestone);
	achievement.save();
}

function deleteOtherPossibilities(achievement){
	var deletionQuery=new Parse.Query("Similarities")
	var psuedoAchievement=new Parse.Object("MilestoneAchievements")
	psuedoAchievement.id=achiement.id
	deletionQuery.equalTo("achievement1",psuedoAchievement)
	deletionQuery.each(function(similarityObject){
		similarityObject.destroy()//!!!!
	})
}

function findMatches(){
	query.notContainedIn("objectId",l)
	query.notContainedIn("title1",completedTitles)
	query.first(function(similarityObject) {
		if(!similarityObject){
			console.log("No more matches to process.  Script complete.");
			return;
		}
		l.push(similarityObject.get('objectId'))
		var standardMilestone=similarityObject.get('standardMilestone')
		var achievement=similarityObject.get("achievement1")
		if (similarityObject.get('similarityScore')==1){ //Automatically save
			saveNewStandardMilestone(achievement,standardMilestone,true);	
			completedTitles.push(similarityObject.get('title1'))
			deleteOtherPossibilities(achievement);
		}
		else{ //Ask for human input
			console.log("Is this a match? (enter 'm') \n"+ similarityObject.get('title1') +"\n"+similarityObject.get('title2')+"\n"+achievement.get('similarityScore'))
			prompt.start();
			var match=false;
			prompt.get(['isMatch'], function (err, result) {
				if (result.isMatch=='m' || result.isMatch=='M'){
					match=true
				}
				if (match){
					saveNewStandardMilestone(achievement,standardMilestone);
					completedTitles.push(similarityObject.get('title1'))
					deleteOtherPossibilities(achievement);
				}
				else{
					findMatches();
				}
			})
		}
	})
}

findMatches();
