// Verificar usuários existentes usando fetch (browser)
const supabaseUrl = 'https://iyukvodgqagaedomwxcs.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dWt2b2RncWFnYWVkb213eGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MDYyNTUsImV4cCI6MjA3MDI4MjI1NX0.6QKvMHi-bVZDU0Mff0J_3BtKjYGa_jbKQ8T-EVDOGXE';

// Tentar fazer login com credenciais padrão
async function tryLogin(email, password) {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    
    if (response.ok) {
        const data = await response.json();
        return data.access_token;
    }
    return null;
}

async function testCredentials() {
    const credentials = [
        ['admin@dombosc.com', 'admin123'],
        ['admin@dombosc.com', 'admin123456'],
        ['admin@sistema.com', 'admin123'],
        ['admin@sistema.com', 'admin123456'],
        ['director@dombosc.com', 'admin123'],
        ['director@dombosc.com', 'admin123456']
    ];
    
    for (const [email, password] of credentials) {
        console.log(`Testando: ${email} / ${password}`);
        const jwt = await tryLogin(email, password);
        if (jwt) {
            console.log(`SUCESSO! JWT: ${jwt}`);
            return jwt;
        }
    }
    
    console.log('Nenhuma credencial funcionou');
    return null;
}

// Executar teste
testCredentials();
