// Script temporário para consultar roles via JavaScript
// Execute no console do navegador na página do sistema

async function checkRoles() {
  try {
    // Primeiro, listar todos os roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('role')
      .order('role');
    
    if (error) throw error;
    
    // Contar roles
    const roleCounts = {};
    profiles.forEach(p => {
      const role = p.role || 'null';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    console.log('=== CONTAGEM POR ROLE ===');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`${role}: ${count}`);
    });
    
    // Listar admins específicos
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .in('role', ['admin', 'administrator', 'director'])
      .order('email');
    
    if (adminError) throw adminError;
    
    console.log('\n=== ADMINS/DIRECTORS ATUAIS ===');
    admins.forEach(admin => {
      console.log(`${admin.email} - ${admin.role} (${admin.created_at})`);
    });
    
    return { roleCounts, admins };
    
  } catch (error) {
    console.error('Erro ao consultar roles:', error);
  }
}

// Execute esta função:
checkRoles();
