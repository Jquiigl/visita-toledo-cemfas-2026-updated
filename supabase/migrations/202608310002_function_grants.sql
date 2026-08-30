begin;
-- Supabase projects can have direct default grants as well as PUBLIC grants.
-- Clear both explicitly; only the authenticated role needs the two RPCs.
revoke all on function public.is_toledo_admin() from public,anon,authenticated;
grant execute on function public.is_toledo_admin() to authenticated;
revoke all on function public.touch_admin_session(uuid) from public,anon,authenticated;
grant execute on function public.touch_admin_session(uuid) to authenticated;
revoke all on function public.set_updated_at() from public,anon,authenticated;
commit;
