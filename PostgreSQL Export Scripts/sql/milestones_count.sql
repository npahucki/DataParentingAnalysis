SELECT 
  babies.id, 
  babies.parentuserid, 
  babies.name, 
  babies.ismale, 
  babies.duedate, 
  babies.birthdate, 
  standardmilestones.title, 
  milestoneachievements.completiondate,
  milestoneachievements.completiondays,
  standardmilestones.babysex, 
  standardmilestones.parentsex  
FROM 
  public.milestoneachievements
INNER JOIN babies ON babies.id = milestoneachievements.babyid
INNER JOIN standardmilestones ON milestoneachievements.standardmilestoneid = standardmilestones.id;
