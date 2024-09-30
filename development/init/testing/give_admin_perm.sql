UPDATE public.asset_user
SET is_admin ='true'
WHERE email='admin@assets.swissgeol.ch';

INSERT INTO public.workgroups_on_users (workgroup_id, user_id, role) 
VALUES (1, (SELECT id FROM public.asset_user WHERE email = 'admin@assets.swissgeol.ch'), 'master-editor');