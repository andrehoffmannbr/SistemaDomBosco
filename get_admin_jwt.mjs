// Script para criar usuário admin e obter JWT válido
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyukvodgqagaedomwxcs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dWt2b2RncWFnYWVkb213eGNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcwNjI1NSwiZXhwIjoyMDcwMjgyMjU1fQ.GbCt1Quztme2aBCJg9qfFw0_Ay3t5nPOFHX6JT8lxQU';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dWt2b2RncWFnYWVkb213eGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MDYyNTUsImV4cCI6MjA3MDI4MjI1NX0.6QKvMHi-bVZDU0Mff0J_3BtKjYGa_jbKQ8T-EVDOGXE';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseClient = createClient(supabaseUrl, anonKey);

async function createAdminAndGetJWT() {
    const testEmail = `admin.test.${Date.now()}@exemplo.com`;
    const testPassword = 'admin123456';
    
    try {
        console.log('1. Criando usuário administrador...');
        
        // Criar usuário com service role
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true
        });
        
        if (authError) {
            console.error('Erro ao criar usuário:', authError);
            return;
        }
        
        console.log('Usuário criado:', authData.user.id);
        
        // Criar profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: testEmail,
                name: 'Admin Teste',
                role: 'administrator',
                tab_access: {}
            });
            
        if (profileError) {
            console.error('Erro ao criar profile:', profileError);
            return;
        }
        
        console.log('Profile criado com role: administrator');
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('2. Fazendo login para obter JWT...');
        
        // Fazer login com o usuário criado
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        
        if (loginError) {
            console.error('Erro no login:', loginError);
            return;
        }
        
        const jwt = loginData.session.access_token;
        console.log('\n=== JWT VÁLIDO ===');
        console.log(jwt);
        console.log('=================\n');
        
        // Verificar role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', loginData.user.id)
            .single();
            
        console.log('Profile verificado:', {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            name: profile.name
        });
        
        return {
            jwt,
            user: loginData.user,
            profile
        };
        
    } catch (error) {
        console.error('Erro geral:', error);
    }
}

createAdminAndGetJWT();
