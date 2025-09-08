DELETE
FROM public.workgroups_on_users
WHERE user_id = (SELECT id FROM public.asset_user WHERE email = 'admin@assets.swissgeol.ch')
  AND workgroup_id = 1;

INSERT INTO public.workgroups_on_users (workgroup_id, user_id, role)
VALUES (1, (SELECT id FROM public.asset_user WHERE email = 'admin@assets.swissgeol.ch'), 'Editor');
