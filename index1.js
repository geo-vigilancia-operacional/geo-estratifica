// =========================================================
// ARQUIVO: index1.js (Versão Aprimorada sem ícones)
// =========================================================

// 1. Dicionário de Credenciais (simulação local)
const CREDENCIAIS_OFUSCADAS = {
    'ADMINISTRADOR': { name: 'Senhor Administrador', pass: '1212121513' },
    'MARCIO':        { name: 'Márcio', pass: '124149' },
    // Adicione ou altere suas credenciais aqui.
};

// 2. Variáveis de Controle
let tentativasAtuais = 0;
const TENTATIVAS_MAXIMAS = 3; // permite até 3 tentativas
let bloqueado = false;
let tempoBloqueio = 30; // segundos de bloqueio
let timer; // controle do temporizador

// 3. Buscar credenciais
function buscarCredenciais(usuario, senha) {
    const credencial = CREDENCIAIS_OFUSCADAS[usuario.toUpperCase()];
    return (credencial && credencial.pass === senha) ? credencial.name : null;
}

// 4. Alternar visibilidade da senha (sem ícones)
function togglePasswordVisibility() {
    const senhaInput = document.getElementById('inputSenha');
    const toggleBtn = document.getElementById('toggleBtn');

    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        toggleBtn.textContent = 'Ocultar senha';
    } else {
        senhaInput.type = 'password';
        toggleBtn.textContent = 'Mostrar senha';
    }
}

// 5. Temporizador de bloqueio
function iniciarContagemBloqueio() {
    const mensagemErro = document.getElementById('mensagemErro');
    const botaoLogin = document.querySelector('#telaLogin button');

    let segundosRestantes = tempoBloqueio;
    bloqueado = true;
    botaoLogin.disabled = true;

    mensagemErro.textContent = `Acesso bloqueado. Tente novamente em ${segundosRestantes}s.`;

    timer = setInterval(() => {
        segundosRestantes--;
        if (segundosRestantes > 0) {
            mensagemErro.textContent = `Acesso bloqueado. Tente novamente em ${segundosRestantes}s.`;
        } else {
            clearInterval(timer);
            bloqueado = false;
            tentativasAtuais = 0;
            mensagemErro.textContent = '';
            botaoLogin.disabled = false;
        }
    }, 1000);
}

// 6. Função principal de login
function tentarLogin() {
    const inputUsuario = document.getElementById('inputUsuario');
    const inputSenha = document.getElementById('inputSenha');
    const mensagemErro = document.getElementById('mensagemErro');
    const telaLogin = document.getElementById('telaLogin');
    const conteudoPrincipal = document.getElementById('conteudoPrincipal');
    const mensagemBoasVindas = document.getElementById('mensagemBoasVindas');

    if (bloqueado) {
        mensagemErro.textContent = 'Acesso bloqueado. Aguarde o tempo de espera.';
        return;
    }

    const usuario = inputUsuario.value.trim();
    const senha = inputSenha.value.trim();
    const nomePersonalizado = buscarCredenciais(usuario, senha);

    if (nomePersonalizado) {
        // LOGIN OK
        mensagemBoasVindas.textContent = `BEM-VINDO, ${nomePersonalizado.toUpperCase()}!`;

        // Transição suave
        telaLogin.style.opacity = '0';
        setTimeout(() => {
            telaLogin.style.display = 'none';
            conteudoPrincipal.style.display = 'block';
            conteudoPrincipal.style.opacity = '0';
            setTimeout(() => conteudoPrincipal.style.opacity = '1', 100);

            if (typeof inicializarAplicacao === 'function') {
                inicializarAplicacao();
            }
        }, 400);

    } else {
        // LOGIN FALHOU
        tentativasAtuais++;
        inputSenha.value = '';

        if (tentativasAtuais >= TENTATIVAS_MAXIMAS) {
            iniciarContagemBloqueio();
        } else {
            mensagemErro.textContent = `Usuário ou senha incorretos. Tentativas restantes: ${TENTATIVAS_MAXIMAS - tentativasAtuais}`;
        }
    }
}

// 7. UX: limpar mensagem de erro ao digitar
window.addEventListener('DOMContentLoaded', () => {
    const inputUsuario = document.getElementById('inputUsuario');
    const inputSenha = document.getElementById('inputSenha');
    const mensagemErro = document.getElementById('mensagemErro');

    inputUsuario.addEventListener('input', () => mensagemErro.textContent = '');
    inputSenha.addEventListener('input', () => mensagemErro.textContent = '');
});








