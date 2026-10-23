-- Los visitantes anónimos no necesitan ejecutar funciones auxiliares de roles
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.current_role_name() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_pet_owner(uuid) from public, anon;
revoke execute on function public.is_pet_vet(uuid) from public, anon;
revoke execute on function public.is_vet() from public, anon;
revoke execute on function public.grant_vet_access(uuid, text) from public, anon;
revoke execute on function public.list_pet_vets(uuid) from public, anon;
grant execute on function public.current_role_name() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_pet_owner(uuid) to authenticated;
grant execute on function public.is_pet_vet(uuid) to authenticated;
grant execute on function public.is_vet() to authenticated;
grant execute on function public.grant_vet_access(uuid, text) to authenticated;
grant execute on function public.list_pet_vets(uuid) to authenticated;
