drop schema public cascade;
create schema public;


CREATE TABLE installation (
  userId VARCHAR,
  appIdentifier VARCHAR,
  appName VARCHAR,
  appVersion VARCHAR,
  deviceType VARCHAR,
  installationId VARCHAR,
  parseVersion VARCHAR,
  timeZone VARCHAR,
  badge INTEGER,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX installation_id_index ON installation (id);
CREATE INDEX installation_userId_index ON installation (userId);

CREATE TABLE users(
  email VARCHAR,
  screenName VARCHAR,
  username VARCHAR,
  authDataType VARCHAR, --anonymous | facebook | email
  emailVerified BOOLEAN,
  isMale BOOLEAN,
  usesMetric BOOLEAN,
  showMilestoneStats BOOLEAN,
  launchCount INTEGER,
  lastSeenAt TIMESTAMP,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX user_id_index ON users (id);

CREATE TABLE babies (
  parentUserId VARCHAR,
  name VARCHAR,
  isMale BOOLEAN,
  dueDate TIMESTAMP,
  birthDate TIMESTAMP,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX babies_id_index ON babies (id);
CREATE INDEX babies_parentUserId_index ON babies (parentUserId);


CREATE TABLE babyAssignedTips (
  babyId VARCHAR,
  tipId VARCHAR,
  isHidden BOOLEAN,
  assignmentDate TIMESTAMP,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX babyAssignedTips_id_index ON babyAssignedTips (id);
CREATE INDEX babyAssignedTips_babyId_index ON babyAssignedTips (babyId);


CREATE TABLE measurements (
  milestoneAchievementId VARCHAR,
  babyId VARCHAR,
  type VARCHAR,
  unit VARCHAR,
  quantity FLOAT,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX measurements_id_index ON measurements (id);
CREATE INDEX measurements_milestoneAchievementId_index ON measurements (milestoneAchievementId);
CREATE INDEX measurements_babyId_index ON measurements (babyId);

CREATE TABLE milestoneAchievements (
  babyId VARCHAR,
  customTitle VARCHAR,
  standardMilestoneId VARCHAR,
  isPostponed BOOLEAN,
  isSkipped BOOLEAN,
  completionDate TIMESTAMP,
  completionDays INTEGER,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX milestoneAchievements_id_index ON milestoneAchievements (id);
CREATE INDEX milestoneAchievements_baby_index ON milestoneAchievements (babyId);
CREATE INDEX milestoneAchievements_standardMilestoneId_index ON milestoneAchievements (standardMilestoneId);
CREATE INDEX milestoneAchievements_isSkipped_IsPostponed_compound_index ON milestoneAchievements (isSkipped,isPostponed);

CREATE TABLE standardMilestones (
  title VARCHAR,
  shortDescription VARCHAR,
  canCompare BOOLEAN,
  babySex INTEGER,
  parentSex INTEGER,
  rangeHigh INTEGER,
  rangeLow INTEGER,
  tag VARCHAR,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX standardMilestones_id_index ON standardMilestones(id);

CREATE TABLE tips (
  relatedMilestoneId VARCHAR,
  condition VARCHAR,
  title VARCHAR,
  shortDescription VARCHAR,
  babySex INTEGER,
  parentSex INTEGER,
  tipType INTEGER,
  rangeHigh INTEGER,
  rangeLow INTEGER,
  id VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX tips_id_index ON tips(id);
CREATE INDEX tips_relatedMilestoneId_index ON tips(relatedMilestoneId);

CREATE TABLE tags
(
id serial NOT NULL,
tag VARCHAR NOT NULL,
PRIMARY KEY (id)
);

CREATE TABLE standardmilestonetags
(
standardmilestoneid VARCHAR NOT NULL references standardmilestones(id),
tagid int NOT NULL references tags(id),
PRIMARY KEY(standardmilestoneid,tagid)
);