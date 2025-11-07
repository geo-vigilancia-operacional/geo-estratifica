// =========================================================
// ARQUIVO: index1.js (Versão Final Segura)
// =========================================================

// --- 1. Credenciais simuladas ---
const CREDENCIAIS_OFUSCADAS = {
    'ADMINISTRADOR': { name: 'Administrador', pass: '1212121513' },
    'MARCIO': { name: 'Márcio', pass: '124149' },
    'MARCOS': { name: 'Marco Marcílio', pass: '127153' },
    'PAULO': { name: 'Paulo', pass: '128139' },
    'EDSON': { name: 'Edson', pass: '155145' },
    'NILO': { name: 'Nilo', pass: '130151' },
};

// 2. Controle de tentativas e bloqueio
let tentativasAtuais = 0;
const TENTATIVAS_MAXIMAS = 3;
let bloqueado = false;

// 3. Função auxiliar de busca de credenciais
function buscarCredenciais(usuario, senha) {
  const credencial = CREDENCIAIS_OFUSCADAS[usuario.toUpperCase()];
  return credencial && credencial.pass === senha ? credencial.name : null;
}

// 4. Alternar visibilidade da senha
function togglePasswordVisibility() {
  const senhaInput = document.getElementById('loginSenha');
  const toggleBtn = document.getElementById('toggleBtn');
  if (senhaInput.type === 'password') {
    senhaInput.type = 'text';
    toggleBtn.textContent = 'Ocultar senha';
  } else {
    senhaInput.type = 'password';
    toggleBtn.textContent = 'Mostrar senha';
  }
}

// 5. Função principal de login
function tentarLogin() {
  if (bloqueado) return alert('Acesso bloqueado. Recarregue a página.');

  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const mensagemErro = document.getElementById('mensagemErro');
  const telaLogin = document.getElementById('telaLogin');
  const conteudoPrincipal = document.getElementById('conteudoPrincipal');
  const mensagemBoasVindas = document.getElementById('mensagemBoasVindas');

  const nome = buscarCredenciais(usuario, senha);

 if (nome) {
  // Sucesso no login
  mensagemBoasVindas.textContent = `BEM-VINDO, ${nome.toUpperCase()}!`;
  telaLogin.style.display = 'none';
  conteudoPrincipal.style.display = 'block';
  tentativasAtuais = 0;
  localStorage.setItem('usuarioLogado', nome);

  setTimeout(() => {
    if (typeof inicializarAplicacao === 'function') {
      inicializarAplicacao();
    }
  }, 500);
}

  } else {
    tentativasAtuais++;
    document.getElementById('loginSenha').value = '';
    const restantes = TENTATIVAS_MAXIMAS - tentativasAtuais;
    if (tentativasAtuais >= TENTATIVAS_MAXIMAS) {
      bloqueado = true;
      mensagemErro.textContent = 'Acesso bloqueado. Recarregue a página.';
    } else {
      mensagemErro.textContent = `Usuário ou senha incorretos. Tentativas restantes: ${restantes}`;
      mensagemErro.style.color = 'rgba(255,0,0,0.7)';
    }
  }

// 6. Função de logout manual ou automático
function logout() {
  localStorage.removeItem('usuarioLogado');
  document.getElementById('conteudoPrincipal').style.display = 'none';
  document.getElementById('telaLogin').style.display = 'flex';
}

// 7. Verificar sessão ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const usuarioLogado = localStorage.getItem('usuarioLogado');
  const telaLogin = document.getElementById('telaLogin');
  const conteudoPrincipal = document.getElementById('conteudoPrincipal');
  const mensagemBoasVindas = document.getElementById('mensagemBoasVindas');

  if (usuarioLogado) {
    telaLogin.style.display = 'none';
    conteudoPrincipal.style.display = 'block';
    mensagemBoasVindas.textContent = `BEM-VINDO, ${usuarioLogado.toUpperCase()}!`;
    if (typeof inicializarAplicacao === 'function') inicializarAplicacao();
  } else {
    telaLogin.style.display = 'flex';
    conteudoPrincipal.style.display = 'none';
  }

  // Logout automático após 10 minutos de inatividade
  const TEMPO_INATIVIDADE = 10 * 60 * 1000;
  let timerInatividade;

  function resetTimerInatividade() {
    clearTimeout(timerInatividade);
    timerInatividade = setTimeout(() => {
      alert('Você ficou inativo por 10 minutos. Faça login novamente.');
      logout();
    }, TEMPO_INATIVIDADE);
  }

  ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evento =>
    document.addEventListener(evento, resetTimerInatividade)
  );

  // Limpar mensagem de erro ao digitar
  const inputUsuario = document.getElementById('inputUsuario');
  const inputSenha = document.getElementById('inputSenha');
  const mensagemErro = document.getElementById('mensagemErro');

  if (inputUsuario && inputSenha && mensagemErro) {
    inputUsuario.addEventListener('input', () => mensagemErro.textContent = '');
    inputSenha.addEventListener('input', () => mensagemErro.textContent = '');
  }

  resetTimerInatividade();
});




















