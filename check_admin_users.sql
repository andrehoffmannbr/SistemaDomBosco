-- Verificar usuários administradores
select 
    p.id, 
    p.email, 
    p.role, 
    p.name, 
    p.tab_access,
    au.email as auth_email,
    au.created_at
from profiles p
left join auth.users au on p.id = au.id
where p.role in ('admin', 'administrator', 'director')
order by p.created_at desc;
