-- J&A Smartwatch — habilitar o primeiro administrador
-- 1) Primeiro crie o usuário em Supabase > Authentication > Users > Add user.
-- 2) Substitua o e-mail abaixo pelo e-mail EXATO do usuário criado.
-- 3) Execute no SQL Editor do projeto Supabase.
-- Este script não cria usuário nem define senha; apenas promove o perfil existente.

update public.profiles p
set role = 'admin',
    updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('COLOQUE-SEU-EMAIL-AQUI');

-- Verificação: deve retornar o e-mail do usuário e role = admin.
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('COLOQUE-SEU-EMAIL-AQUI');
