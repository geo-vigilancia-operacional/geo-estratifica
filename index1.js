// ==========================================================
// ⚠️ CREDENCIAIS E LÓGICA DE LOGIN (Antigo login.js) ⚠️
// ==========================================================

const TENTATIVAS_MAXIMAS = 1;
let tentativasAtuais = 0;
let bloqueado = false;

// Credenciais e nomes de exibição
const CREDENCIAIS_OFUSCADAS = {
    'ADMINISTRADOR': { name: 'Administrador', pass: '1212121513' },
    'MARCIO':        { name: 'Márcio', pass: '124149' },
    'MARCOS':        { name: 'Marcos', pass: '127153' },
    'PAULO':         { name: 'Paulo', pass: '128139' },
    'EDSON':         { name: 'Edson', pass: '155145' },
    'NILO':          { name: 'Nilo', pass: '130151' },
};


function buscarCredenciais(usuario, senha) {
    const userKey = usuario.toUpperCase();
    const credencial = CREDENCIAIS_OFUSCADAS[userKey];
    
    if (credencial && senha === credencial.pass) {
        return credencial.name; 
    }
    return null; 
}
// index1.js (Adicione esta nova função)

function verificarLoginPersistente() {
    // Verifica se a chave 'acesso_liberado' existe no armazenamento local
    if (localStorage.getItem('acesso_liberado') === 'true') {
        
        // Se a chave existir, esconde o login e mostra o conteúdo
        const telaLogin = document.getElementById('telaLogin');
        const conteudoPrincipal = document.getElementById('conteudoPrincipal');
        
        if (telaLogin && conteudoPrincipal) {
            telaLogin.style.display = 'none';
            conteudoPrincipal.style.display = 'block';

            // Opcional: Você pode tentar recuperar a mensagem de boas-vindas se quiser
            // document.getElementById('mensagemBoasVindas').textContent = "BEM-VINDO DE VOLTA!"; 

            console.log("Acesso persistente restaurado.");
            return true;
        }
    }
    return false;
}

// 🚨 ADIÇÃO 2: Executa a checagem imediatamente ao carregar o script
verificarLoginPersistente();

// O restante do seu código index1.js (tentarLogin, credenciais, etc.) permanece o mesmo.

// Função principal que será chamada pelo botão no HTML
function tentarLogin() {
    const inputUsuario = document.getElementById('inputUsuario');
    const inputSenha = document.getElementById('inputSenha');
    const mensagemErro = document.getElementById('mensagemErro');
    const telaLogin = document.getElementById('telaLogin');
    const conteudoPrincipal = document.getElementById('conteudoPrincipal');
    const mensagemBoasVindas = document.getElementById('mensagemBoasVindas');
    
    // CHECAGEM DE BLOQUEIO
    if (bloqueado) {
        mensagemErro.textContent = 'Acesso bloqueado. Recarregue a página para tentar novamente.';
        return; 
    }
    
    const usuario = inputUsuario.value.trim();
    const senha = inputSenha.value.trim();

    const nomePersonalizado = buscarCredenciais(usuario, senha);

    if (nomePersonalizado) {
        // LOGIN BEM-SUCEDIDO
       // 🚨 ADIÇÃO 1: Salva uma chave no armazenamento local
        localStorage.setItem('acesso_liberado', 'true');
        mensagemBoasVindas.textContent = `BEM-VINDO, ${nomePersonalizado.toUpperCase()}!`;
        telaLogin.style.display = 'none';
        conteudoPrincipal.style.display = 'block';
        tentativasAtuais = 0;
        
        // 🚨 CHAME A FUNÇÃO DE INICIALIZAÇÃO DO SEU SCRIPT PRINCIPAL AQUI!
        // Se a sua lógica principal estiver em uma função chamada, por exemplo, 'iniciarAplicacao()', chame-a aqui.
        
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



