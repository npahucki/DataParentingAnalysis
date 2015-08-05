insert into tags (tag) --populate tags
select distinct tag from standardmilestones where tag not like '%,%' order by tag;

insert into standardmilestonetags (tagid,standardmilestoneid) --populate standardmilestonetags
select tags.id as tagid, standardmilestones.id as standardmilestoneid
from standardmilestones, tags
where standardmilestones.tag is not null and split_part(standardmilestones.tag,',',1)=tags.tag

union

select tags.id as tagid, standardmilestones.id as standardmilestoneid
from standardmilestones,tags
where not split_part(standardmilestones.tag,',',2)='' and split_part(standardmilestones.tag,',',2)=tags.tag;

alter table standardmilestones
drop column tag;

create extension intarray; --necessary for percentile calculations