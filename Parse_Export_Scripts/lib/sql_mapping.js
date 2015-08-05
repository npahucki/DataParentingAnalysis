
var mapping = {
    tables: function(){
        var self = this;
        var all = Object.keys(self).map(function(k){ return String( typeof(self[k]) ) == 'function' ? null : k });
        return all.filter(Boolean);
    },
    cols: function(table){
        var self = this;
        return Object.keys(self[table]);
    },
    '_Installation' : {
        'userId': 'user.id',
        'appIdentifier': 'appIdentifier',
        'appName': 'appName',
        'appVersion': 'appVersion',
        'deviceType': 'deviceType',
        'installationId': 'installationId',
        'parseVersion': 'parseVersion',
        'timeZone': 'timeZone',
        'badge': 'badge'
    },
    '_User' : {
        'email': 'email',
        'screenName': 'screenName',
        'username': 'username',
        'authDataType': 'authData',
        'emailIsVerified': 'emailIsVerified',
        'isMale': 'isMale',
        'usesMetric': 'usesMetric',
        'showMilestoneStats': 'showMilestoneStats',
        'launchCount': 'launchCount',
        'lastSeenAt': 'lastSeenAt'
    },
    'Babies': {
        'parentUserId': 'parentUser.id',
        'name': 'name',
        'isMale': 'isMale',
        'dueDate': 'dueDate',
        'birthDate': 'birthDate'
    },
    'BabyAssignedTips': {

        'babydId': 'baby.id',
        'tipId': 'tip.id',
        'isHidden': 'isHidden',
        'assignmentDate': 'assignmentDate'
    },
    'Measurements': {

        'milestoneAchievementId': 'achievement.id',
        'babyId': 'baby.id',
        'type': 'type',
        'unit': 'unit',
        'quantity': 'quantity'
    },
    'MilestoneAchievements': {

        'babyId': 'baby.id',
        'customTitle' : 'customTitle',
        'standardMilestoneId': 'standardMilestone.id',
        'isPostponed': 'isPostponed',
        'isSkipped': 'isSkipped',
        'completionDate': 'completionDate',
        'completionDays': 'completionDays'
    },
    'StandardMilestones': {

        'title': 'title',
        'shortDescription': 'shortDescription',
        'canCompare': 'canCompare',
        'babySex': 'babySex',
        'parentSex': 'parentSex',
        'rangeHigh': 'rangeHigh',
        'rangeLow': 'rangeLow',
        'tag': 'tag'
    },
    'Tips': {
        'relatedMilestoneId': 'relatedMilestoneId',
        'condition': 'condition',
        'title': 'title',
        'shortDescription': 'shortDescription',
        'babySex': 'babySex',
        'parentSex': 'parentSex',
        'tipType': 'tipType',
        'rangeHigh': 'rangeHigh',
        'rangeLow': 'rangeLow'
    }
}

module.exports = mapping;