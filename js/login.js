(async()=>{
  const $=s=>document.querySelector(s);
  const msg=$('#loginMsg');
  const sb=window.dchacaraSupabase;

  if(!sb){
    msg.textContent='Não foi possível carregar a conexão com o Supabase.';
    return;
  }

  // Nunca preenche a senha pelo código.
  $('#password').value='';
  const saved=localStorage.getItem('dchacara_login_supabase_v1');
  if(saved){ $('#login').value=saved; $('#remember').checked=true; }

  // Se já existe uma sessão válida, libera o painel.
  const {data:{session}}=await sb.auth.getSession();
  if(session){
    sessionStorage.setItem('dchacara_logged_in','true');
    sessionStorage.setItem('dchacara_user_role','Administrador');
  }

  $('#showPass').onclick=()=>{
    const input=$('#password');
    input.type=input.type==='password'?'text':'password';
  };

  $('#loginForm').onsubmit=async e=>{
    e.preventDefault();
    msg.textContent='Entrando...';
    const login=$('#login').value.trim();
    const password=$('#password').value;
    if(!login||!password){msg.textContent='Preencha seu login e sua senha.';return;}

    // O usuário vê Luiz.silva; o Supabase autentica pelo e-mail técnico.
    const normalized=login.toLowerCase();
    const email=normalized.includes('@')?normalized:`${normalized}@dchacara.local`;
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error||!data.session){
      msg.textContent='Login ou senha inválidos.';
      $('#password').value='';
      return;
    }

    const {data:profile}=await sb.from('profiles').select('name,role,active').eq('id',data.user.id).maybeSingle();
    if(profile && profile.active===false){
      await sb.auth.signOut();
      msg.textContent='Este usuário está desativado.';
      return;
    }

    sessionStorage.setItem('dchacara_logged_in','true');
    sessionStorage.setItem('dchacara_user_role',profile?.role||'Administrador');
    sessionStorage.setItem('dchacara_user_name',profile?.name||'Luiz Silva');
    if($('#remember').checked)localStorage.setItem('dchacara_login_supabase_v1',login);
    else localStorage.removeItem('dchacara_login_supabase_v1');
    location.href='dashboard.html';
  };

  $('#forgotBtn').onclick=()=>{msg.textContent='Para redefinir a senha, fale com o administrador do sistema.'};
  $('#teamBtn').onclick=()=>{msg.textContent='Entre em contato com a administração da D Chácara Empório.'};
  $('#panelBtn').onclick=()=>{$('#login').focus();msg.textContent='Informe seu login e senha para acessar o painel.'};
  $('#codeBtn').onclick=()=>{msg.textContent='Acesso por código ainda não está habilitado.'};
})();