-- Execute after migrations in a disposable test database. All fixture rows roll back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.admin_users(user_id) values('00000000-0000-4000-8000-000000000001');
insert into public.registrations(id,activity_id) values('10000000-0000-4000-8000-000000000001','toledo-2026');
insert into public.participants(registration_id,name,role,adult,transport) values('10000000-0000-4000-8000-000000000001','PERSONA FICTICIA','Titular',true,'bus');

set local role anon;
do $$declare t text; begin
  foreach t in array array['activities','registrations','participants','vehicles','menus','buses','evaluations','survey_questions','evaluation_answers','admin_users','admin_sessions'] loop
    begin execute format('select * from public.%I',t);raise exception 'FAIL: anonymous read on %',t;exception when insufficient_privilege then null;end;
    begin execute format('delete from public.%I',t);raise exception 'FAIL: anonymous delete on %',t;exception when insufficient_privilege then null;end;
  end loop;
  begin insert into public.registrations(activity_id) values('toledo-2026');raise exception 'FAIL: anonymous insert';exception when insufficient_privilege then null;end;
end $$;

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$declare t text; n integer; begin
  if public.is_toledo_admin() then raise exception 'FAIL: member is admin';end if;
  foreach t in array array['activities','registrations','participants','vehicles','menus','buses','evaluations','survey_questions','evaluation_answers','admin_sessions'] loop
    execute format('select count(*) from public.%I',t) into n;if n<>0 then raise exception 'FAIL: member reads %',t;end if;
    execute format('delete from public.%I',t);get diagnostics n=row_count;if n<>0 then raise exception 'FAIL: member deletes %',t;end if;
  end loop;
  update public.activities set title='forbidden';get diagnostics n=row_count;if n<>0 then raise exception 'FAIL: member updates';end if;
  begin insert into public.registrations(activity_id) values('toledo-2026');raise exception 'FAIL: member insert';exception when insufficient_privilege then null;end;
  begin insert into public.admin_users(user_id) values(auth.uid());raise exception 'FAIL: self promotion';exception when insufficient_privilege then null;end;
end $$;

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$declare rid uuid;pid uuid;v uuid;m uuid;b uuid;e uuid;q uuid; sid uuid:=gen_random_uuid();n integer; begin
  if not public.is_toledo_admin() then raise exception 'FAIL: administrator denied';end if;
  select count(*) into n from public.participants;if n<>1 then raise exception 'FAIL: admin read';end if;
  insert into public.registrations(activity_id) values('toledo-2026') returning id into rid;
  insert into public.menus(activity_id,label) values('toledo-2026','MENÚ FICTICIO') returning id into m;
  insert into public.buses(activity_id,label,capacity) values('toledo-2026','BUS FICTICIO',50) returning id into b;
  insert into public.vehicles(registration_id,model,plate) values(rid,'MODELO FICTICIO','TEST-ONLY') returning id into v;
  insert into public.participants(registration_id,name,role,adult,transport,vehicle_id,meal,menu_id) values(rid,'OTRA PERSONA FICTICIA','Titular',true,'car',v,true,m) returning id into pid;
  update public.participants set name='ACTUALIZACIÓN FICTICIA' where id=pid;get diagnostics n=row_count;if n<>1 then raise exception 'FAIL: admin update';end if;
  insert into public.evaluations(activity_id,comment) values('toledo-2026','COMENTARIO FICTICIO') returning id into e;
  insert into public.survey_questions(activity_id,label) values('toledo-2026','Global') returning id into q;
  insert into public.evaluation_answers(evaluation_id,question_id,score) values(e,q,5);
  begin insert into public.evaluation_answers(evaluation_id,question_id,score) values(e,q,6);raise exception 'FAIL: invalid score';exception when check_violation then null;end;
  insert into public.admin_sessions(id,user_id) values(sid,auth.uid());
  if not public.touch_admin_session(sid) then raise exception 'FAIL: new session rejected';end if;
  begin update public.admin_sessions set last_seen=now()+interval '1 year';raise exception 'FAIL: forged expiry';exception when insufficient_privilege then null;end;
  delete from public.admin_sessions where id=sid;
  if public.touch_admin_session(sid) then raise exception 'FAIL: revoked session accepted';end if;
  delete from public.participants where id=pid;get diagnostics n=row_count;if n<>1 then raise exception 'FAIL: admin delete';end if;
  begin insert into public.admin_users(user_id) values('00000000-0000-4000-8000-000000000002');raise exception 'FAIL: application can grant administrator';exception when insufficient_privilege then null;end;
end $$;

reset role;
insert into public.admin_sessions(id,user_id,last_seen) values('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',now()-interval '31 minutes');
set local role authenticated;
do $$begin if public.touch_admin_session('20000000-0000-4000-8000-000000000001') then raise exception 'FAIL: idle session accepted';end if;end$$;
reset role;
delete from public.admin_users where user_id='00000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$begin if public.is_toledo_admin() or exists(select 1 from public.participants) then raise exception 'FAIL: removed administrator retains access';end if;end$$;
rollback;
select 'RLS verified: anon denied; member denied; admin CRUD; no self-promotion; session revocation and idle expiry' as result;
