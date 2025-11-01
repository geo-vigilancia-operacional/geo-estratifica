// =========================================================
// CONTEÚDO NO ARQUIVO 'index1.js'
// =========================================================

// 1. Dicionário de Credenciais
const CREDENCIAIS_OFUSCADAS = {
    // Chave: Usuário (em MAIÚSCULAS)  |  Valor: { name: Nome para Boas-Vindas, pass: Senha Real }
    'ADMINISTRADOR': { name: 'Senhor Administrador', pass: '1212121513' },
    'MARCIO':        { name: 'Márcio', pass: '124149' },
    // Adicione ou altere suas credenciais aqui.
};

// 2. Variáveis de Controle
let tentativasAtuais = 0;
const TENTATIVAS_MAXIMAS = 1; 
let bloqueado = false; // Usado para bloquear após o limite

// 3. Função Auxiliar para Busca de Credenciais
function buscarCredenciais(usuario, senha) {
    const credencial = CREDENCIAIS_OFUSCADAS[usuario.toUpperCase()];
    return (credencial && credencial.pass === senha) ? credencial.name : null;
}

// 4. Função de Alternar Senha (Chamada pelo HTML)
function togglePasswordVisibility() {
    const senhaInput = document.getElementById('inputSenha');
    const icon = document.getElementById('toggleIcon');
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        icon.textContent = '🔒'; 
    } else {
        senhaInput.type = 'password';
        icon.textContent = '👁️'; 
    }
}

// 5. Função Principal de Login (Chamada pelo HTML)
function tentarLogin() {
    const inputUsuario = document.getElementById('inputUsuario');
    const inputSenha = document.getElementById('inputSenha');
    const mensagemErro = document.getElementById('mensagemErro');
    const telaLogin = document.getElementById('telaLogin');
    const conteudoPrincipal = document.getElementById('conteudoPrincipal');
    const mensagemBoasVindas = document.getElementById('mensagemBoasVindas');
    
    if (bloqueado) {
        mensagemErro.textContent = 'Acesso bloqueado. Recarregue a página para tentar novamente.';
        return; 
    }
    
    const usuario = inputUsuario.value.trim();
    const senha = inputSenha.value.trim();

    const nomePersonalizado = buscarCredenciais(usuario, senha);

    if (nomePersonalizado) {
        // LOGIN BEM-SUCEDIDO
        mensagemBoasVindas.textContent = `BEM-VINDO, ${nomePersonalizado.toUpperCase()}!`;
        telaLogin.style.display = 'none';
        conteudoPrincipal.style.display = 'block';
        tentativasAtuais = 0;
        
        // 🛑 ESTE É O PONTO CRÍTICO QUE RESOLVEMOS NA ÚLTIMA TENTATIVA!
        // ASSUMINDO QUE SEU script.js JÁ TEM A FUNÇÃO inicializarAplicacao()
        // (A função que contém todo o código da sua aplicação).
        if (typeof inicializarAplicacao === 'function') {
            inicializarAplicacao(); 
        }

    } else {
        // LOGIN FALHOU
        tentativasAtuais++;
        inputSenha.value = '';
        
        if (tentativasAtuais >= TENTATIVAS_MAXIMAS) {
            bloqueado = true;
            mensagemErro.textContent = 'Acesso bloqueado por tentativa incorreta. Recarregue a página.';
            document.querySelector('#telaLogin button').disabled = true;
        } else {
            mensagemErro.textContent = 'Usuário ou Senha incorretos.'; 
        }
    }
}






