var Parse = require('./init_parse').createParse();
var prompt=require('prompt')
var l=[]
var count=0
var query = new Parse.Query("MilestoneAchievements2");
query.exists('similarity')
query.greaterThan('similarity',0.85)
query.descending('similarity')

function saveNewStandardMilestone(achievement,getNext){
	if(getNext){
		findMatches();
	}
	var queryStandardMilestones = new Parse.Query("StandardMilestones");
	var mostSimilar=achievement.get('mostSimilar')
	queryStandardMilestones.equalTo("title",mostSimilar)
	var mostSimilar=achievement.get('mostSimilar')
	queryStandardMilestones.first(function(standardMilestone){
		if (!standardMilestone){
			console.log("Could not find StandardMilestone")
			return;
		}
		else{
			achievement.set('standardMilestone', standardMilestone)
			achievement.set('standardMilestoneId',standardMilestone.id)
			console.log('Saved: '+ ++count)
			achievement.save().then(function(){
				if(!getNext){
					findMatches();
				}
			}, function(error){
				console.log(JSON.stringify(error))
			})
		}
	})
}

function findMatches(){
	query.notContainedIn("customTitle",l)
	query.first(function(achievement) {
		if(!achievement){
			console.log("No more matches to process.  Script complete.")
			return;
		}
		l.push(achievement.get('customTitle'))

		if (achievement.get('similarity')==1){ //Automatically save
			saveNewStandardMilestone(achievement,true);
		}
		else{ //Ask for human input
			console.log("Is this a match? (enter 'm') \n"+ achievement.get('customTitle') +"\n"+achievement.get('mostSimilar')+"\n"+achievement.get('similarity'))
			prompt.start()
			var match=false;
			prompt.get(['isMatch'], function (err, result) {
				if (result.isMatch=='m' || result.isMatch=='M'){
					match=true
				}
				if (match){
					saveNewStandardMilestone(achievement);
				}
				else{
					findMatches();
				}
			})
		}
	})
}

findMatches();
