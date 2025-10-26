/ ==========================================================
// 🛑 CHAVE DE CONTROLE DO MODO MANUTENÇÃO 🛑
// Quando 'true', o sistema será bloqueado na inicialização.
// Quando 'false', o sistema funcionará normalmente.
// ==========================================================
const MODO_MANUTENCAO_ATIVO = true; // <-- Adicione esta linha!
// ==========================================================
let bairros = [];
let dadosOvitrampas = []; // ✅ novo
let estado = {
    bairroSelecionado: null,
    quadrasDisponiveis: [],
    quadrasSelecionadas: new Set(),
    quadrasPositivas: new Set(), // ✅ novo
    dadosBairros: {}
};
// --- ELEMENTOS DO DOM ---
const selectBairro = document.getElementById("bairro");
const resumoGeralDiv = document.getElementById("resumoGeral");
const listaQuadrasDiv = document.getElementById("listaQuadras");
const resumoProgramadosDiv = document.getElementById("resumoProgramados");
const entradaQuadras = document.getElementById("entradaQuadras");
const aplicarTextoBtn = document.getElementById("aplicarTexto");
const limparTudoBtn = document.getElementById("limparTudo");
const dadosDetalhesDiv = document.getElementById("dadosDetalhes");

// 1.FUNÇÃO AUXILIAR PARA SALVAR O ARQUIVO NO FORMATO .doc
function salvarConteudoComoDoc(html, filename) {
    // Esta função prepara o HTML para ser reconhecido como um documento Word
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Relatório</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + html + footer;
    
    // Cria um Blob (objeto binário) e aciona o download
    const blob = new Blob([sourceHTML], {
        type: 'application/msword'
    });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// 2.FUNÇÃO PRINCIPAL PARA GERAR O RELATÓRIO ESTILO WORD (COM TRATAMENTOS DETALHADOS)
function gerarRelatorioWord() {
    console.log("Iniciando a geração do Relatório Word (com tratamentos detalhados)...");

    if (!estado || !estado.bairroSelecionado) {
        alert("Selecione um bairro e defina a estratificação primeiro!");
        return;
    }

    try {
        const bairro = estado.bairroSelecionado;
        
        // --- FUNÇÕES AUXILIARES DE BUSCA ROBUSTA ---
        const getValue = (id) => document.getElementById(id)?.value.trim() || 'N/A';
        const getText = (id) => document.getElementById(id)?.textContent.trim() || 'N/A';
        
        // Função de Formatação de Data
        const formatarData = (data) => {
            if (!data || data === 'N/A') return 'N/A';
            const dataObj = new Date(data + "T00:00:00"); 
            if (isNaN(dataObj)) return 'N/A'; 
            return dataObj.toLocaleDateString('pt-BR');
        };
        
        // Função para formatar números (adicionar pontos de milhar, se necessário)
        const formatarNumero = (valor) => {
            if (valor === 'N/A' || valor === null || valor === undefined) return '0';
            return String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        };

        // --- FONTES DE DADOS (Extrações do DOM) ---
        const resumoGeral = document.getElementById('resumoGeral')?.textContent || '';
        const resumoProgramadosText = document.getElementById('resumoProgramados')?.textContent || '';
        
        // Extração de Variáveis (Geral/Estática)
        const totalImoveisGeral = formatarNumero(resumoGeral.match(/Total de Imóveis:\s*(\d+)/)?.[1]); 
        const totalHabitantesGeral = formatarNumero(resumoGeral.match(/Total de Habitantes:\s*(\d+)/)?.[1]); 
        const totalQuadrasAtivas = resumoGeral.match(/Total de Quadras \(ativas\):\s*(\d+)/)?.[1] || 'N/A';
        // ... (outras extrações gerais) ...
        
        // Extração de Variáveis (Programadas/Dinâmica)
        const totalHabitantesProg = formatarNumero(resumoProgramadosText.match(/Total de Habitantes:\s*(\d+)/)?.[1]); 
        const imoveisProgramados = formatarNumero(resumoProgramadosText.match(/Imóveis Programados:\s*(\d+)/)?.[1]); 
        // ... (outras extrações programadas) ...

        // Extração de Inputs (Programação)
        const tipoAcao = document.getElementById('tipoSelect')?.options[document.getElementById('tipoSelect').selectedIndex].textContent.trim() || 'Estratificação de Área';
        const quadrasSelecionadasLista = getValue("quadrasEstratificadas");
        const quadrasPositivas = getValue("quadrasPositivas") || "Nenhuma";
        const percentualFechadosPrevisto = getValue("percentualFechados");
        const imoveisTrabalhar = formatarNumero(getValue("imoveisATrabalhar")); 
        const media = getValue("media");
        const servidores = getValue("servidores");
        const diasProgramados = getValue("dias");
        const dataInicioProg = formatarData(getValue("dataInicio"));
        const dataTerminoProg = formatarData(getValue("dataTermino"));

        // Extração de Inputs (Resultados/Execução)
        const quadrasTrabalhadas = getValue("quadrasTrabalhadasInput");
        const hdp = getValue("hdpInput");
        const hdt = getValue("hdtInput");
        const semanaInicial = getValue("semanaInicial");
        const semanaFinal = getValue("semanaFinal");
        const ciclo = getValue("ciclo");
        const dataInicioReal = formatarData(getValue("dataInicioReal"));
        const dataTerminoReal = formatarData(getValue("dataTerminoReal"));
        const imoveisTrabalhados = formatarNumero(getValue("imoveisTrabalhadosInput"));
        const fechados = formatarNumero(getValue("fechadosInput"));
        const focosPorImovel = getValue("focosPorImovelInput");
        const totalDepositosPositivos = formatarNumero(getValue("totalDepositos")); 
        const depositosEliminados = formatarNumero(getValue("depositosEliminadosInput"));
        const responsavel = getValue("responsavel");
        const obs = getValue("observacoes");
        
        // ==========================================================
        // !!! NOVAS VARIÁVEIS DE TRATAMENTO !!!
        // ==========================================================
        const btiTratados = formatarNumero(getValue("imoveisBtiInput"));        // QTD Imóveis Tratados Com BTI
        const espTratados = formatarNumero(getValue("imoveisEspInput"));        // QTD Imóveis Tratados Com ESP
        const depositosBti = formatarNumero(getValue("depositosBtiInput"));     // Depósitos Tratados Com BTI
        const depositosEsp = formatarNumero(getValue("depositosEspInput"));     // Depósitos Tratados Com ESP
        const larvicidaBti = getValue("larvicidaBtiInput");                     // Larvicida Total Gasto Com BTI
        const larvicidaEsp = getValue("larvicidaEspInput");                     // Larvicida Total Gasto Com ESP
        
        // Detalhes dos Depósitos Positivos
        const depositosDetalhes = {
            'A1': formatarNumero(getValue("a1")), 'A2': formatarNumero(getValue("a2")),
            'B': formatarNumero(getValue("b")), 'C': formatarNumero(getValue("c")),
            'D1': formatarNumero(getValue("d1")), 'D2': formatarNumero(getValue("d2")),
            'E': formatarNumero(getValue("e"))
        };

        const depositosDetalhadosFrase = Object.entries(depositosDetalhes)
            .filter(([key, value]) => Number(value.replace(/\./g, '')) > 0) 
            .map(([key, value]) => `${key}/${value}`)
            .join(', ');

        // --- MONTAGEM DA NARRATIVA EM HTML ---
        let htmlContent = '';
        
        // 1. TÍTULO E CONTEXTO
        htmlContent += `<h1 style="text-align: center; color: #1e88e5;">RELATÓRIO DE AÇÃO </h1>`;
        htmlContent += `<h2 style="text-align: center; color: #555;">Bairro: ${bairro.toUpperCase()}</h2>`;
        htmlContent += `<p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')} - <strong>Responsável:</strong> ${responsavel}</p>`;
        htmlContent += `<hr style="border: 1px solid #ddd;">`;
        
        htmlContent += `<h3 style="color: #00796b;">1. CONTEXTO E PROGRAMAÇÃO</h3>`;
        
        let intro = `Este relatório detalha a ação de combate ao Aedes Aegypti realizada no bairro <strong>${bairro}</strong> (com ${totalQuadrasAtivas} quadras ativas), classificada como <strong>${tipoAcao}</strong>.`;
        
        // ... (Período de execução/programação) ...
        if (dataInicioReal !== 'N/A' && dataTerminoReal !== 'N/A') {
             intro += ` A execução ocorreu no período de <strong>${dataInicioReal}</strong> a <strong>${dataTerminoReal}</strong>.`;
        } else if (dataInicioProg !== 'N/A' && dataTerminoProg !== 'N/A') {
             intro += ` A ação foi programada para o período de <strong>${dataInicioProg}</strong> a <strong>${dataTerminoProg}</strong>.`;
        }
        
        htmlContent += `<p>${intro}</p>`;
        
        // 2. ESFORÇO E METAS PROGRAMADAS
        htmlContent += `<h3 style="color: #00796b;">2. ESFORÇO E METAS PROGRAMADAS</h3>`;
        htmlContent += `<p>O bairro ${bairro} possui um total de <strong>${totalHabitantesGeral}</strong> habitantes e <strong>${totalImoveisGeral}</strong> imóveis ativos.</p>`;
        
        htmlContent += `<p>O foco desta ação foram as quadras programadas: <strong>${quadrasSelecionadasLista}</strong>.`;
        
        if (quadrasPositivas !== 'Nenhuma' && quadrasPositivas !== 'N/A') {
             htmlContent += ` As quadras identificadas com positividade de larvas (Foco) foram: <strong>${quadrasPositivas}</strong>.`;
        }
        
        htmlContent += `</p>`;
        
        htmlContent += `<p>O esforço programado incluiu:</p>`;
        htmlContent += `<ul>`;
        htmlContent += `<li><strong>Habitantes Cobertos:</strong> ${totalHabitantesProg}</li>`;
        htmlContent += `<li><strong>Imóveis Programados para Trabalho:</strong> ${imoveisProgramados} (com uma previsão de ${percentualFechadosPrevisto}% de imóveis fechados).</li>`;
        htmlContent += `<li><strong>Recursos:</strong> Foram alocados ${servidores} servidores, com média de ${media} imóveis/servidor por dia, totalizando ${diasProgramados} dias de trabalho programados.</li>`;
        htmlContent += `</ul>`;

        // 3. RESULTADOS DA EXECUÇÃO
        if (quadrasTrabalhadas !== '0' && quadrasTrabalhadas !== 'N/A') {
            htmlContent += `<h3 style="color: #00796b;">3. RESULTADOS E DESEMPENHO</h3>`;
            htmlContent += `<p><strong>Visão Geral:</strong> O trabalho cobriu <strong>${quadrasTrabalhadas}</strong> quadras, pertencentes às Semanas/Ciclo <strong>${semanaInicial} a ${semanaFinal} (Ciclo ${ciclo})</strong>. O desempenho foi de <strong>HDP/HDT: ${hdp} / ${hdt}</strong>.</p>`;

            // Desempenho Imóveis
            htmlContent += `<h4>Desempenho da Cobertura</h4>`;
            htmlContent += `<ul>`;
            htmlContent += `<li><strong>Total de Imóveis Visitados:</strong> ${imoveisTrabalhados}</li>`;
            htmlContent += `<li><strong>Imóveis Fechados Encontrados:</strong> ${fechados}</li>`;
            htmlContent += `<li><strong>Focos/Imóvel (Índice):</strong> ${focosPorImovel}</li>`;
            htmlContent += `<li><strong>Depósitos Eliminados:</strong> ${depositosEliminados}</li>`;
            htmlContent += `</ul>`;
            
            // Achados Detalhados
            if (totalDepositosPositivos !== '0') {
                 let achadosFrase = `Foram encontrados <strong>${totalDepositosPositivos}</strong> depósitos positivos.`;
                 if (depositosDetalhadosFrase.length > 0) {
                      achadosFrase += ` Estes depósitos estavam distribuídos nos seguintes tipos: <strong>${depositosDetalhadosFrase}</strong>.`;
                 }
                 htmlContent += `<p>${achadosFrase}</p>`;
            }

            // ==========================================================
            // !!! NOVO BLOCO: TRATAMENTOS E LARVICIDAS !!!
            // ==========================================================
            htmlContent += `<h4>Tratamentos Realizados e Recursos</h4>`;
            htmlContent += `<ul>`;
            htmlContent += `<li><strong>Imóveis Tratados (BTI/ESP):</strong> ${btiTratados} / ${espTratados}</li>`;
            htmlContent += `<li><strong>Depósitos Tratados (BTI/ESP):</strong> ${depositosBti} / ${depositosEsp}</li>`;
            htmlContent += `<li><strong>Larvicida Gasto (BTI/ESP):</strong> ${larvicidaBti} / ${larvicidaEsp}</li>`;
            htmlContent += `</ul>`;
            // ==========================================================
        }
        
        // 4. OBSERVAÇÕES
        if (obs !== 'N/A' && obs.length > 0) {
             htmlContent += `<h3 style="color: #00796b;">4. OBSERVAÇÕES ADICIONAIS</h3>`;
             htmlContent += `<p style="white-space: pre-wrap; border: 1px dashed #ccc; padding: 10px;">${obs}</p>`;
        }
        
        // --- FUNÇÃO PARA SALVAR COMO .doc ---
        const nomeArquivo = `Relatorio_${bairro.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
        
        salvarConteudoComoDoc(htmlContent, nomeArquivo);

    } catch (error) {
        console.error("Erro fatal ao gerar o Relatório Word:", error);
        alert("Erro ao tentar gerar o relatório. Verifique o console para detalhes.");
    }
}

// 3.FUNÇÃO AUXILIAR PARA SALVAR O ARQUIVO NO FORMATO TXT (AGORA COM UTF-8 BOM)
function salvarConteudoComoTxt(conteudo, filename) {
    // Adiciona o BOM (Byte Order Mark) para forçar o Excel a usar UTF-8
    const conteudoComBOM = "\uFEFF" + conteudo;
    
    const blob = new Blob([conteudoComBOM], {
        type: 'text/plain;charset=utf-8' // Mantenha o UTF-8 no Blob
    });
    
    // Cria um link de download e o aciona
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
// 4.FUNÇÃO PRINCIPAL PARA EXPORTAR OS DADOS COMO TABELA TXT/CSV
function exportarTabelaTXT() {
    console.log("Iniciando a exportação da Tabela TXT...");

    if (!estado || !estado.bairroSelecionado) {
        alert("Selecione um bairro e defina a estratificação primeiro!");
        return;
    }

    try {
        const bairro = estado.bairroSelecionado;
        const SEPARADOR = ';'; // Define o separador CSV como ponto e vírgula
        
        // --- FUNÇÕES AUXILIARES DE BUSCA ROBUSTA ---
        const getValue = (id) => document.getElementById(id)?.value.trim() || 'N/A';
        const getText = (id) => document.getElementById(id)?.textContent.trim() || 'N/A';
        
        // Função de Formatação de Data
        const formatarData = (data) => {
            if (!data || data === 'N/A') return 'N/A';
            const dataObj = new Date(data + "T00:00:00"); 
            if (isNaN(dataObj)) return 'N/A'; 
            return dataObj.toLocaleDateString('pt-BR');
        };
        
        // Função para formatar números (remove pontos de milhar para manter o formato puro em planilhas)
        const formatarNumeroPuro = (valor) => {
            if (valor === 'N/A' || valor === null || valor === undefined) return '0';
            return String(valor).replace(/\D/g, ''); // Remove tudo que não for dígito
        };


        // --- FONTES DE DADOS (Extrações do DOM) ---
        const resumoGeral = document.getElementById('resumoGeral')?.textContent || '';
        const resumoProgramadosText = document.getElementById('resumoProgramados')?.textContent || '';
        
        // Extração de Variáveis (Geral/Estática)
        const totalImoveisGeral = formatarNumeroPuro(resumoGeral.match(/Total de Imóveis:\s*(\d+)/)?.[1]); 
        const totalHabitantesGeral = formatarNumeroPuro(resumoGeral.match(/Total de Habitantes:\s*(\d+)/)?.[1]); 
        const totalQuadrasAtivas = resumoGeral.match(/Total de Quadras \(ativas\):\s*(\d+)/)?.[1] || 'N/A';
        
        // Extração de Variáveis (Programadas/Dinâmica)
        const imoveisProgramados = formatarNumeroPuro(resumoProgramadosText.match(/Imóveis Programados:\s*(\d+)/)?.[1]); 
        
        // Extração de Inputs (Programação)
        const tipoAcao = document.getElementById('tipoSelect')?.options[document.getElementById('tipoSelect').selectedIndex].textContent.trim() || 'Estratificação de Área';
        const quadrasSelecionadasLista = getValue("quadrasEstratificadas").replace(/,/g, '|'); // Substitui vírgulas por barras para não quebrar o CSV
        const quadrasPositivas = getValue("quadrasPositivas").replace(/,/g, '|'); 
        const percentualFechadosPrevisto = getValue("percentualFechados");
        const media = getValue("media");
        const servidores = getValue("servidores");
        const diasProgramados = getValue("dias");
        const dataInicioProg = formatarData(getValue("dataInicio"));
        const dataTerminoProg = formatarData(getValue("dataTermino"));

        // Extração de Inputs (Resultados/Execução)
        const quadrasTrabalhadas = formatarNumeroPuro(getValue("quadrasTrabalhadasInput"));
        const hdp = getValue("hdpInput");
        const hdt = getValue("hdtInput");
        const semanaInicial = getValue("semanaInicial");
        const semanaFinal = getValue("semanaFinal");
        const ciclo = getValue("ciclo");
        const dataInicioReal = formatarData(getValue("dataInicioReal"));
        const dataTerminoReal = formatarData(getValue("dataTerminoReal"));
        const imoveisTrabalhados = formatarNumeroPuro(getValue("imoveisTrabalhadosInput"));
        const fechados = formatarNumeroPuro(getValue("fechadosInput"));
        const focosPorImovel = getValue("focosPorImovelInput");
        const totalDepositosPositivos = formatarNumeroPuro(getValue("totalDepositos")); 
        const depositosEliminados = formatarNumeroPuro(getValue("depositosEliminadosInput"));
        const responsavel = getValue("responsavel");
        const obs = getValue("observacoes").replace(/(\r\n|\n|\r)/gm, ' | ').replace(/;/g, ','); // Limpa quebras de linha e ponto-e-vírgula

        // Variáveis de Tratamento
        const btiTratados = formatarNumeroPuro(getValue("imoveisBtiInput"));
        const espTratados = formatarNumeroPuro(getValue("imoveisEspInput"));
        const depositosBti = formatarNumeroPuro(getValue("depositosBtiInput"));
        const depositosEsp = formatarNumeroPuro(getValue("depositosEspInput"));
        const larvicidaBti = getValue("larvicidaBtiInput");
        const larvicidaEsp = getValue("larvicidaEspInput");
        
        // Detalhes dos Depósitos Positivos (Mantendo o formato limpo)
        const depositosDetalhes = {
            'A1': formatarNumeroPuro(getValue("a1")), 'A2': formatarNumeroPuro(getValue("a2")),
            'B': formatarNumeroPuro(getValue("b")), 'C': formatarNumeroPuro(getValue("c")),
            'D1': formatarNumeroPuro(getValue("d1")), 'D2': formatarNumeroPuro(getValue("d2")),
            'E': formatarNumeroPuro(getValue("e"))
        };
        // Monta a string como "A1:10|A2:20" para não usar o separador principal
        const depositosDetalhadosFrase = Object.entries(depositosDetalhes)
            .filter(([key, value]) => Number(value) > 0) 
            .map(([key, value]) => `${key}:${value}`)
            .join('|');

        // --- MONTAGEM DA TABELA TXT/CSV ---
        let tabelaContent = `CAMPO${SEPARADOR}VALOR\n`;

        // 1. GERAL
        tabelaContent += `Data de Geração${SEPARADOR}${new Date().toLocaleDateString('pt-BR')}\n`;
        tabelaContent += `Responsável pela Informação${SEPARADOR}${responsavel}\n`;
        tabelaContent += `Bairro${SEPARADOR}${bairro}\n`;
        tabelaContent += `Tipo de Ação${SEPARADOR}${tipoAcao}\n`;
        tabelaContent += `Quadras Ativas no Bairro${SEPARADOR}${totalQuadrasAtivas}\n`;
        tabelaContent += `Imóveis Ativos no Bairro${SEPARADOR}${totalImoveisGeral}\n`;
        tabelaContent += `Habitantes no Bairro${SEPARADOR}${totalHabitantesGeral}\n`;
        tabelaContent += '\n';

        // 2. PROGRAMAÇÃO
        tabelaContent += `--- PROGRAMAÇÃO ---\n`;
        tabelaContent += `Quadras Selecionadas (Meta)${SEPARADOR}${quadrasSelecionadasLista}\n`;
        tabelaContent += `Quadras Positivas (Ação)${SEPARADOR}${quadrasPositivas}\n`;
        tabelaContent += `Imóveis Programados (Trabalho)${SEPARADOR}${imoveisProgramados}\n`;
        tabelaContent += `Previsão de Fechados (%) (Meta)${SEPARADOR}${percentualFechadosPrevisto}\n`;
        tabelaContent += `Servidores Alocados${SEPARADOR}${servidores}\n`;
        tabelaContent += `Média Imóveis/Servidor${SEPARADOR}${media}\n`;
        tabelaContent += `Dias Programados${SEPARADOR}${diasProgramados}\n`;
        tabelaContent += `Data Início Programada${SEPARADOR}${dataInicioProg}\n`;
        tabelaContent += `Data Término Programada${SEPARADOR}${dataTerminoProg}\n`;
        tabelaContent += '\n';

        // 3. RESULTADOS
        tabelaContent += `--- RESULTADOS ---\n`;
        tabelaContent += `Ciclo${SEPARADOR}${ciclo}\n`;
        tabelaContent += `Semana Inicial${SEPARADOR}${semanaInicial}\n`;
        tabelaContent += `Semana Final${SEPARADOR}${semanaFinal}\n`;
        tabelaContent += `Data Início Real${SEPARADOR}${dataInicioReal}\n`;
        tabelaContent += `Data Término Real${SEPARADOR}${dataTerminoReal}\n`;
        tabelaContent += `Quadras Trabalhadas${SEPARADOR}${quadrasTrabalhadas}\n`;
        tabelaContent += `Imóveis Trabalhados (Visitados)${SEPARADOR}${imoveisTrabalhados}\n`;
        tabelaContent += `Imóveis Fechados${SEPARADOR}${fechados}\n`;
        tabelaContent += `HDP (Hora/Dia/Profissional)${SEPARADOR}${hdp}\n`;
        tabelaContent += `HDT (Hora/Dia/Total)${SEPARADOR}${hdt}\n`;
        tabelaContent += `Índice de Focos/Imóvel${SEPARADOR}${focosPorImovel}\n`;
        tabelaContent += '\n';
        
        // 4. ACHADOS E TRATAMENTO
        tabelaContent += `--- AÇÕES E TRATAMENTO ---\n`;
        tabelaContent += `Total Depósitos Positivos${SEPARADOR}${totalDepositosPositivos}\n`;
        tabelaContent += `Detalhe Depósitos Positivos${SEPARADOR}${depositosDetalhadosFrase}\n`;
        tabelaContent += `Depósitos Eliminados${SEPARADOR}${depositosEliminados}\n`;
        tabelaContent += `Imóveis Tratados (BTI)${SEPARADOR}${btiTratados}\n`;
        tabelaContent += `Imóveis Tratados (ESP)${SEPARADOR}${espTratados}\n`;
        tabelaContent += `Depósitos Tratados (BTI)${SEPARADOR}${depositosBti}\n`;
        tabelaContent += `Depósitos Tratados (ESP)${SEPARADOR}${depositosEsp}\n`;
        tabelaContent += `Larvicida Gasto (BTI)${SEPARADOR}${larvicidaBti}\n`;
        tabelaContent += `Larvicida Gasto (ESP)${SEPARADOR}${larvicidaEsp}\n`;
        tabelaContent += '\n';

        // 5. OBSERVAÇÕES
        tabelaContent += `--- OBSERVAÇÕES ---\n`;
        tabelaContent += `Observações Adicionais${SEPARADOR}${obs}\n`;
        
        // --- FUNÇÃO PARA SALVAR COMO .txt ---
        const nomeArquivo = `Tabela_Dados_${bairro.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
        
        salvarConteudoComoTxt(tabelaContent, nomeArquivo);

    } catch (error) {
        console.error("Erro fatal ao exportar a Tabela TXT:", error);
        alert("Erro ao tentar exportar a tabela. Verifique o console para detalhes.");
    }
}
// 5.--- FUNÇÕES PRINCIPAIS ---
function carregarDados() {
    Promise.all([
        fetch('bairros_4ciclo_2025.json').then(r => r.json()),
        fetch('ACOMPANHAMENTO_OVITRAMPAS.json').then(r => r.json())
    ])
    .then(([dadosBairros, dadosOvi]) => {
        bairros = dadosBairros;
        dadosOvitrampas = dadosOvi;

        preencherListaBairros();

        console.log('Bairros carregados:', bairros.length, 'registros');
        console.log('Ovitrampas carregadas:', dadosOvitrampas.length, 'registros');
    })
    .catch(error => {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique o console para detalhes.');
    });
}
// 6. PREENCHER LISTA DE BAIRROS
function preencherListaBairros() {
    if (!selectBairro) return;
    
    selectBairro.innerHTML = '<option value="">-- Escolha um bairro --</option>';
    
    const bairrosUnicos = [...new Set(bairros.map(item => item.BAIRRO))].sort();
    
    bairrosUnicos.forEach(bairro => {
        const option = document.createElement("option");
        option.value = bairro;
        option.textContent = bairro;
        selectBairro.appendChild(option);
    });
}
// 7. MONTAR RESUMO GERAL DO BAIRRO (COM TODOS OS DADOS)
function montarResumoGeral() {
    if (!resumoGeralDiv) return;

    const bairroNome = estado.bairroSelecionado;
    if (!bairroNome) {
        resumoGeralDiv.innerHTML = "";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === bairroNome);

    if (dadosBairro.length === 0) {
        resumoGeralDiv.innerHTML = "<em>Nenhum dado encontrado para este bairro.</em>";
        return;
    }

    // Quadras únicas
    const quadrasUnicas = [...new Set(dadosBairro.map(item => String(item.QT).trim()))];

    // Quadras ativas
    const quadrasAtivas = quadrasUnicas.filter(qt => {
        const row = dadosBairro.find(b => String(b.QT).trim() === qt);
        const total = Number(row?.TOTAL);
        return !isNaN(total) && total > 0;
    });

    // Totais
    const totais = calcularTotaisBairro(dadosBairro);
    const totalProgramados = (totais.TOTAL || 0) - (totais["AP. ACIMA DO TÉRREO"] || 0);

    // ✅ CORREÇÃO APLICADA AQUI: Contando os registros do bairro
    const totalOvitrampasBairro = dadosOvitrampas
        .filter(o => o["BAIRRO "]?.trim() === bairroNome.trim())
        .length; // ✅ Aqui contamos o número de registros no array filtrado

    resumoGeralDiv.innerHTML = `
        <div class="small"><strong>Bairro:</strong> ${bairroNome}</div>
        <span><strong>Total de Quadras (ativas):</strong> ${quadrasAtivas.length}</span>
        <span><strong>Total de Imóveis:</strong> ${totais.TOTAL}</span>
        <span><strong>Residências (R):</strong> ${totais.R}</span>
        <span><strong>Comércios (C):</strong> ${totais.C}</span>
        <span><strong>Terrenos Baldios (TB):</strong> ${totais.TB}</span>
        <span><strong>Outros (OU):</strong> ${totais.OU}</span>
        <span><strong>Pontos Estratégicos (PE):</strong> ${totais.PE}</span>
        <span><strong>Apartamentos Acima Térreo:</strong> ${totais["AP. ACIMA DO TÉRREO"] || 0}</span>
        <span><strong>Total de Habitantes:</strong> ${totais.HABITANTES}</span>
        <span>🏠 <strong>Imóveis Programados:</strong> ${totalProgramados}</span>
        <span>🐕 <strong>Cães:</strong> ${totais.CÃO}</span>
        <span>🐈 <strong>Gatos:</strong> ${totais.GATO}</span>
        <span>🧪 <strong>Ovitrampas (palhetas):</strong> ${totalOvitrampasBairro}</span>
    `;
}
// 8. CALCULAR TOTAIS COMPLETOS DO BAIRRO
function calcularTotaisBairro(dadosBairro) {
    const campos = [
        'R', 'C', 'TB', 'OU', 'PE', 'TOTAL', 'APARTAMENTO EXISTENTE',
        'APARTAMENTO NO TÉRREO', 'AP. ACIMA DO TÉRREO', 'HABITANTES',
        'TANQUE EXISTENTE', 'TANQUE PEIXADO', 'TAMBOR EXISTENTE', 'TAMBOR PEIXADO',
        'CISTERNA EXISTENTE', 'CISTERNA VEDADA', 'CISTERNA PEIXADA',
        'CACIMBA EXISTENTE', 'CACIMBA VEDADA', 'CACIMBA PEIXADA',
        "CAIXAS D'ÁGUA EXISTENTE", "CAIXAS D'ÁGUA NORMAL", "CAIXAS D'ÁGUA VEDADA",
        "CAIXAS D'ÁGUA ED. NORMAL", "CAIXAS D'ÁGUA ED. VEDADA",
        'FILTRO', 'VASO C/ PLANTA', 'POTE', 'TINA', 'CÃO', 'GATO'
    ];
    
    const totais = {};
    
    campos.forEach(campo => {
        totais[campo] = dadosBairro.reduce((total, item) => {
            let valor = item[campo];

            // Se for string numérica, converte
            if (typeof valor === "string") {
                valor = valor.trim();
                valor = valor === "" ? 0 : Number(valor);
            }

            // Se não for número válido, ignora (considera 0)
            if (isNaN(valor)) valor = 0;

            return total + valor;
        }, 0);
    });
    
    return totais;
}
// 9. MONTAR LISTA DE QUADRAS COM DETALHES
function montarListaQuadras() {
    if (!listaQuadrasDiv) return;

    listaQuadrasDiv.innerHTML = "";

    if (!estado.bairroSelecionado) {
        listaQuadrasDiv.innerHTML = "<em>Selecione um bairro primeiro.</em>";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);

    // pega todas as quadras e aplica a ordenação pai/filho
    const quadras = [...new Set(dadosBairro.map(item => item.QT))].sort((a, b) => {
        const [paiA, filhoA] = a.split("/").map(Number);
        const [paiB, filhoB] = b.split("/").map(Number);

        if (paiA !== paiB) return paiA - paiB;
        if (filhoA == null && filhoB != null) return -1;
        if (filhoA != null && filhoB == null) return 1;
        if (filhoA != null && filhoB != null) return filhoA - filhoB;
        return 0;
    });

    estado.quadrasDisponiveis = quadras.filter(q => {
        const dadosQuadra = dadosBairro.find(b => b.QT === q);
        return dadosQuadra && Number(dadosQuadra.TOTAL) > 0;
    });

    if (quadras.length === 0) {
        listaQuadrasDiv.innerHTML = "<em>Nenhuma quadra encontrada.</em>";
        return;
    }

    quadras.forEach(quadra => {
        const dadosQuadra = dadosBairro.find(b => b.QT === quadra);
        const somaTotal = Number(dadosQuadra?.TOTAL || 0);
        const isExtinta = somaTotal === 0;

        const wrapper = document.createElement("div");
        wrapper.className = "quadra-item";

        // === Checkbox normal ===
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = quadra;
        checkbox.id = `quadra-${quadra}`;

        if (isExtinta) {
            checkbox.disabled = true;
        } else {
            checkbox.checked = Array.from(estado.quadrasSelecionadas).includes(quadra);
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    estado.quadrasSelecionadas.add(quadra);
                } else {
                    estado.quadrasSelecionadas.delete(quadra);
                    estado.quadrasPositivas.delete(quadra);
                }
                atualizarProgramados();
                atualizarQuadrasSelecionadas();
                atualizarQuadrasPositivas();
            });
        }
 // === Checkbox positiva ===
        const checkboxPositivo = document.createElement("input");
        checkboxPositivo.type = "checkbox";
        checkboxPositivo.value = quadra;
        checkboxPositivo.id = `positivo-${quadra}`;
        checkboxPositivo.style.marginLeft = "10px";

        const labelPositivo = document.createElement("label");
        labelPositivo.htmlFor = checkboxPositivo.id;
        labelPositivo.textContent = "Positiva";
        labelPositivo.style.marginLeft = "4px";
        labelPositivo.style.fontSize = "0.85em";
        labelPositivo.style.color = "#ccc";

        if (isExtinta) {
            checkboxPositivo.disabled = true;
        } else {
            checkboxPositivo.disabled = !estado.quadrasSelecionadas.has(quadra);
        }

        checkboxPositivo.checked = estado.quadrasPositivas.has(quadra);

        checkboxPositivo.addEventListener("change", () => {
            if (checkboxPositivo.checked) {
                estado.quadrasPositivas.add(quadra);
            } else {
                estado.quadrasPositivas.delete(quadra);
            }
            atualizarQuadrasPositivas();
        });

        checkbox.addEventListener("change", () => {
            if (isExtinta) {
                checkboxPositivo.disabled = true;
            } else {
                checkboxPositivo.disabled = !checkbox.checked;
            }
            
            if (!checkbox.checked) {
                checkboxPositivo.checked = false;
                estado.quadrasPositivas.delete(quadra);
                atualizarQuadrasPositivas();
            }
        });

        // === Label da quadra ===
        const label = document.createElement("label");
        label.htmlFor = checkbox.id;

        if (isExtinta) {
            label.innerHTML = `<span class="extinta">${quadra} (extinta)</span>`;
        } else {
            label.innerHTML = `<span class="quadra-numero">${quadra}</span> <small>(${somaTotal} imóveis)</small>`;
            wrapper.classList.add("destacada"); // aplica destaque a todas ativas
        }

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        wrapper.appendChild(checkboxPositivo);
        wrapper.appendChild(labelPositivo);
        listaQuadrasDiv.appendChild(wrapper);
    });
}
//10.
function atualizarQuadrasSelecionadas() {
    const textarea = document.getElementById("quadrasEstratificadas");
    const detalhesDiv = document.getElementById("dadosDetalhes");

    if (!textarea || !detalhesDiv) {
        console.warn("⚠️ Elementos 'quadrasEstratificadas' ou 'dadosDetalhes' não existem no HTML.");
        return;
    }

    if (estado.quadrasSelecionadas.size === 0) {
        textarea.value = "";
        detalhesDiv.innerHTML = "";
        return;
    }

    // mantém só quadras válidas do bairro e que não sejam extintas
    const quadrasValidas = Array.from(estado.quadrasSelecionadas).filter(q => {
        const dados = bairros.find(b => b.BAIRRO === estado.bairroSelecionado && b.QT === q);
        return dados && Number(dados.TOTAL) > 0;
    });

    textarea.value = quadrasValidas.join(", ");
    detalhesDiv.innerHTML = ""; // pode ser expandido para mostrar dados detalhados
}

// 11.Função para calcular e atualizar o campo 'Imóveis a Trabalhar'
function calcularImoveisATrabalhar() {
    // 1. Obter o valor de 'Imóveis Programados'
    // Acessa o valor pelo ID, agora que ele foi adicionado no HTML gerado
    const imoveisProgramados = Number(document.getElementById("imoveisProgramadosValue").textContent);

    // 2. Obter o percentual de fechados. Se o campo não for encontrado, assume 0.
    const inputFechados = document.getElementById("percentualFechados");
    const percentualFechados = inputFechados ? Number(inputFechados.value) || 0 : 0;

    // 3. O valor inicial para 'Imóveis a Trabalhar' é o mesmo que 'Imóveis Programados'
    let imoveisTrabalhar = imoveisProgramados;

    // 4. Se o percentual de fechados for maior que zero, recalcula o total a trabalhar
    if (percentualFechados > 0) {
        const fechados = imoveisProgramados * (percentualFechados / 100);
        imoveisTrabalhar = imoveisProgramados - fechados;
    }

    // 5. Atualiza o campo 'Imóveis a Trabalhar' com o valor final, arredondado
    const campoImoveisTrabalhar = document.getElementById("imoveisATrabalhar");
    if (campoImoveisTrabalhar) {
        campoImoveisTrabalhar.value = Math.round(imoveisTrabalhar);
    }
}

// 12. CALCULAR TOTAIS DAS QUADRAS SELECIONADAS
function calcularTotaisQuadrasSelecionadas(dadosBairro) {
    const campos = [
        'R', 'C', 'TB', 'OU', 'PE', 'TOTAL', 'AP. ACIMA DO TÉRREO', 'HABITANTES',
        'TANQUE EXISTENTE', 'TAMBOR EXISTENTE', 'CISTERNA EXISTENTE', 'CACIMBA EXISTENTE',
        "CAIXAS D'ÁGUA EXISTENTE", 'CÃO', 'GATO'
    ];
    
    const totais = {};
    campos.forEach(campo => totais[campo] = 0);
    
    estado.quadrasSelecionadas.forEach(quadra => {
        const dadosQuadra = dadosBairro.find(b => b.QT === quadra);
        if (dadosQuadra) {
            campos.forEach(campo => {
                let valor = dadosQuadra[campo];

                if (typeof valor === "string") {
                    valor = valor.trim();
                    valor = valor === "" ? 0 : Number(valor);
                }

                if (isNaN(valor)) valor = 0;

                totais[campo] += valor;
            });
        }
    });
    
    return totais;
}
//13.
function atualizarQuadrasPositivas() {
    const textarea = document.getElementById("quadrasPositivas");
    textarea.value = Array.from(estado.quadrasPositivas).join(", ");
}
//14.
function limparTudo() {
    estado.bairroSelecionado = null;
    estado.quadrasSelecionadas.clear();
    estado.quadrasPositivas.clear(); // ✅ limpa positivas também

    // limpa campos da tela
    document.getElementById("quadrasEstratificadas").value = "";
    document.getElementById("quadrasPositivas").value = ""; // ✅ limpa textarea
    document.getElementById("dadosDetalhes").innerHTML = "";

    // atualiza telas
    montarListaQuadras();
    montarResumoGeral();
    atualizarProgramados();
}

// 15. MOSTRAR DETALHES DAS QUADRAS SELECIONADAS
function mostrarDetalhesQuadras() {
    if (!dadosDetalhesDiv) return;
    
    if (estado.quadrasSelecionadas.size === 0) {
        dadosDetalhesDiv.innerHTML = "";
        return;
    }
    
    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);
    let detalhes = "🟢 QUADRAS SELECIONADAS:\n\n";
    
    estado.quadrasSelecionadas.forEach(quadra => {
        const dados = dadosBairro.find(b => b.QT === quadra);
        if (dados) {
            detalhes += `📍 Quadra ${quadra}:\n`;
            detalhes += `   • Imóveis: ${dados.TOTAL}\n`;
            detalhes += `   • Habitantes: ${dados.HABITANTES}\n`;
            detalhes += `   • PE: ${dados.PE}\n`;
            detalhes += `   • Cães: ${dados.CÃO}, Gatos: ${dados.GATO}\n`;
            detalhes += `   • Depósitos água: ${dados["CAIXAS D'ÁGUA EXISTENTE"] + dados.TANQUE_EXISTENTE + dados.TAMBOR_EXISTENTE}\n\n`;
        }
    });
    
    dadosDetalhesDiv.innerHTML = detalhes;
}
//16.
function interpretarEntrada(texto) {
    const partes = texto.split(/[\s,;]+/).filter(Boolean);
    const selecionadas = new Set();

    partes.forEach(parte => {
        if (/^\d+-\d+$/.test(parte)) {
            // intervalo de quadras (ex: 1-10)
            const [inicio, fim] = parte.split("-").map(Number);
            if (!isNaN(inicio) && !isNaN(fim)) {
                for (let i = inicio; i <= fim; i++) {
                    selecionadas.add(String(i));
                    // também adiciona filhos se existirem
                    estado.quadrasDisponiveis.forEach(q => {
                        if (q.startsWith(i + "/")) {
                            selecionadas.add(q);
                        }
                    });
                }
            }
        } else {
            // quadra única
            selecionadas.add(parte);
            // também adiciona filhos se existirem
            estado.quadrasDisponiveis.forEach(q => {
                if (q.startsWith(parte + "/")) {
                    selecionadas.add(q);
                }
            });
        }
    });

    return selecionadas;
}
// 17. CALCULAR DIAS E DATA DE TÉRMINO PROGRAMADO
function calcularDiasETermino() {
    // 1. Obter os valores dos campos de entrada
    const imoveisATrabalhar = Number(document.getElementById("imoveisATrabalhar").value) || 0;
    const mediaPorServidor = Number(document.getElementById("media").value) || 0;
    const servidoresProgramados = Number(document.getElementById("servidores").value) || 0;
    const dataInicio = document.getElementById("dataInicio").value;

    // 2. Calcular os "Dias Programados"
    let diasProgramados = 0;
    if (imoveisATrabalhar > 0 && mediaPorServidor > 0 && servidoresProgramados > 0) {
        diasProgramados = imoveisATrabalhar / mediaPorServidor / servidoresProgramados;
    }
    
    // Atualiza o campo "Dias Programados" com o valor arredondado para cima
    document.getElementById("dias").value = Math.floor(diasProgramados);

    // 3. Calcular a "Data de Término Programado"
    const dataTerminoInput = document.getElementById("dataTermino");
    if (!dataInicio) {
        dataTerminoInput.value = "";
        return;
    }

    const dataAtual = new Date(dataInicio + "T00:00:00");
    
    let diasUteisAdicionados = 0;
    const diaInicioSemana = dataAtual.getDay();
    if (diaInicioSemana !== 0 && diaInicioSemana !== 6) {
        diasUteisAdicionados = 1; // O primeiro dia é útil
    }

    // CORREÇÃO: agora usa diasProgramados
    if (diasProgramados <= 1) {
        dataTerminoInput.value = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;
        return;
    }

   while (diasUteisAdicionados < (diasProgramados - 1)) {
    dataAtual.setDate(dataAtual.getDate() + 1);
    const diaDaSemana = dataAtual.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
        diasUteisAdicionados++;
    }
}

    
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    dataTerminoInput.value = `${ano}-${mes}-${dia}`;
}
//18.
function atualizarProgramados() {
    const resumoProgramados = document.getElementById("resumoProgramados");

    if (!estado.bairroSelecionado) {
        resumoProgramados.innerHTML = "<em>Selecione um bairro para ver os programados.</em>";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);

    // Quadras selecionadas ativas
    const quadrasSelecionadasAtivas = Array.from(estado.quadrasSelecionadas).filter(q => {
        const dadosQuadra = dadosBairro.find(b => b.QT === q);
        return dadosQuadra && Number(dadosQuadra.TOTAL) > 0;
    });

    const dadosQuadrasSelecionadas = dadosBairro.filter(b => quadrasSelecionadasAtivas.includes(b.QT));
    const totalQuadrasSelecionadas = quadrasSelecionadasAtivas.length;

    const getNumero = (valor) => {
        const num = Number(valor);
        return isNaN(num) ? 0 : num;
    };

    // Totais
    const totalImoveis = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TOTAL || 0), 0);
    const residencias = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.R || 0), 0);
    const comercios = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.C || 0), 0);
    const terrenos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TB || 0), 0);
    const outros = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.OU || 0), 0);
    const pontosEstrategicos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.PE || 0), 0);
    const apartamentos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur['AP. ACIMA DO TÉRREO'] || 0), 0);
    const habitantes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.HABITANTES || 0), 0);
    const caes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.CÃO || 0), 0);
    const gatos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.GATO || 0), 0);

    // Depósitos de água
    const depositos = dadosQuadrasSelecionadas.reduce((acc, cur) => {
        return acc
            + getNumero(cur['TANQUE EXISTENTE'])
            + getNumero(cur['TAMBOR EXISTENTE'])
            + getNumero(cur['CISTERNA EXISTENTE'])
            + getNumero(cur['CACIMBA EXISTENTE'])
            + getNumero(cur["CAIXAS D'ÁGUA EXISTENTE"])
            + getNumero(cur['FILTRO'])
            + getNumero(cur["VASO C/PLANTA"])
            + getNumero(cur['TINA'])
            + getNumero(cur['POTE']);
    }, 0);

    const imoveisProgramados = totalImoveis - apartamentos;

    // ✅ CORREÇÃO APLICADA AQUI: Contando os registros do bairro E quadra
    const totalOvitrampasSelecionadas = dadosOvitrampas
        .filter(o => o["BAIRRO "]?.trim() === estado.bairroSelecionado.trim() && quadrasSelecionadasAtivas.includes(o.QT))
        .length; // ✅ Aqui contamos o número de registros no array filtrado

    resumoProgramados.innerHTML = `
        <span><strong>Quadras Selecionadas:</strong> ${totalQuadrasSelecionadas}</span>
        <span><strong>Total de Imóveis:</strong> ${totalImoveis}</span>
        <span><strong>Residências (R):</strong> ${residencias}</span>
        <span><strong>Comércios (C):</strong> ${comercios}</span>
        <span><strong>Terrenos Baldios (TB):</strong> ${terrenos}</span>
        <span><strong>Outros (OU):</strong> ${outros}</span>
        <span><strong>Pontos Estratégicos (PE):</strong> ${pontosEstrategicos}</span>
        <span><strong>Apartamentos Acima Térreo:</strong> ${apartamentos}</span>
        <span><strong>Total de Habitantes:</strong> ${habitantes}</span>
        <span>🏠 <strong>Imóveis Programados:</strong> <span id="imoveisProgramadosValue">${imoveisProgramados}</span></span>
        <span>🐕 <strong>Cães:</strong> ${caes}</span>
        <span>🐈 <strong>Gatos:</strong> ${gatos}</span>
        <span>💧 <strong>Depósitos de Água:</strong> ${depositos}</span>
        <span>🧪 <strong>Ovitrampas (palhetas):</strong> ${totalOvitrampasSelecionadas}</span>
    `;

    calcularImoveisATrabalhar();
}

// 19.Sua função de cálculo de Imóveis a Trabalhar
function calcularImoveisATrabalhar() {
    const imoveisProgramados = Number(document.getElementById("imoveisProgramadosValue").textContent);
    const inputFechados = document.getElementById("percentualFechados");
    const percentualFechados = inputFechados ? Number(inputFechados.value) || 0 : 0;
    let imoveisTrabalhar = imoveisProgramados;

    if (percentualFechados > 0) {
        const fechados = imoveisProgramados * (percentualFechados / 100);
        imoveisTrabalhar = imoveisProgramados - fechados;
    }

    const campoImoveisTrabalhar = document.getElementById("imoveisATrabalhar");
    if (campoImoveisTrabalhar) {
        campoImoveisTrabalhar.value = Math.round(imoveisTrabalhar);
        calcularDiasETermino(); // Chama o cálculo de dias aqui
    }
}

//20. Função corrigida para abrir o Google Maps
function abrirMapsComEndereco() {
    // 1. Pega o valor do campo de endereço usando o ID
    const endereco = document.getElementById('inputEndereco').value;

    // 2. Validação básica: verifica se o campo está vazio
    if (endereco.trim() === "") {
        alert("Por favor, digite um endereço antes de buscar no mapa.");
        return; 
    }

    // 3. Formata o endereço (encodeURIComponent)
    const enderecoFormatado = encodeURIComponent(endereco);

    // 4. CORREÇÃO CRÍTICA: Constrói o URL usando o formato de busca /search/
    // Este formato é o mais simples e direto para pesquisar um endereço.
    const urlMaps = `https://www.google.com/maps/search/${enderecoFormatado}`;

    // 5. Abre a URL em uma nova aba
    window.open(urlMaps, '_blank');
}
//21.LIMPAR TUDO
// LIMPAR TUDO (APRIMORADA)
function limparTudo() {
    // Limpeza de Variáveis de Estado (Essencial)
    estado.bairroSelecionado = null;
    estado.quadrasSelecionadas.clear();
    estado.quadrasPositivas.clear();
    
    // --- 1. Limpa o bloco SELECIONE O BAIRRO / QUADRAS ---
    if (selectBairro) selectBairro.value = "";
    if (entradaQuadras) entradaQuadras.value = "";
    if (resumoGeralDiv) resumoGeralDiv.innerHTML = ""; // Assumindo ID 'resumoGeral'
    if (listaQuadrasDiv) listaQuadrasDiv.innerHTML = ""; // Assumindo ID 'listaQuadras'
    if (resumoProgramadosDiv) resumoProgramadosDiv.innerHTML = "<em>Selecione quadras para ver os programados.</em>"; // Assumindo ID 'resumoProgramados'
    
    // --- 2. Limpa o bloco ESTRATIFICAR (Programação) ---
    // Limpeza de inputs e textareas simples
    document.getElementById("dataInicio").value = "";
    document.getElementById("percentualFechados").value = "";
    document.getElementById("media").value = "";
    document.getElementById("servidores").value = "";
    document.getElementById("dias").value = "";
    
    // Inputs readonly (limpar valor, mas o JS os recalcula)
    document.getElementById("imoveisATrabalhar").value = "";
    document.getElementById("dataTermino").value = "";
    document.getElementById("quadrasEstratificadas").value = "";
    
    // Limpa divs de informação
    document.getElementById("contagemQuadrasEstratificadas").innerHTML = "";
    document.getElementById("dadosDetalhes").innerHTML = "";
    document.getElementById("obsDias").innerHTML = "";
    document.getElementById("obsTermino").innerHTML = "Adicione a data de início programado";

    // --- 3. Limpa o bloco RESULTADO (Execução) ---
    document.getElementById("quadrasPositivas").value = "";
    document.getElementById("contagemQuadrasPositivas").innerHTML = "";
    document.getElementById("quadrasTrabalhadasInput").value = "0"; // Volta para o valor inicial
    document.getElementById("obsQuadrasTrabalhadas").innerHTML = "";
    
    // Limpeza de campos de Resultado
    document.getElementById("hdpInput").value = "";
    document.getElementById("hdtInput").value = "";
    document.getElementById("imoveisTrabalhadosInput").value = "";
    document.getElementById("fechadosInput").value = "";
    document.getElementById("focosPorImovelInput").value = "";
    document.getElementById("depositosEliminadosInput").value = "";
    document.getElementById("dataInicioReal").value = "";
    document.getElementById("dataTerminoReal").value = "";
    
    // Limpeza de select fields
    document.getElementById("semanaInicial").value = "";
    document.getElementById("semanaFinal").value = "";
    document.getElementById("ciclo").value = "";
    
    // Limpa as divs de porcentagem
    document.getElementById("percImoveisTrabalhados").innerHTML = "";
    document.getElementById("percFechados").innerHTML = "";


    // --- 4. Limpeza dos Detalhes de Depósito, Tratamento e Observações ---
    
    // Limpeza de Depósitos Positivos (A1, A2, B, C, D1, D2, E)
    ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });
    document.getElementById("totalDepositos").value = ""; // Readonly, mas bom limpar
    
    // Limpeza de Tratamentos
    document.getElementById("imoveisBtiInput").value = "";
    document.getElementById("imoveisEspInput").value = "";
    document.getElementById("depositosBtiInput").value = "";
    document.getElementById("depositosEspInput").value = "";
    document.getElementById("larvicidaBtiInput").value = "";
    document.getElementById("larvicidaEspInput").value = "";

    // Limpeza de Informações Adicionais
    document.getElementById("observacoes").value = "";
    document.getElementById("responsavel").value = "";


    // --- 5. Limpa a Lógica de Estratificação/Mutirão (select tipo) ---
    
    // Define o select principal para o valor padrão ('estratificacaoDeArea')
    const selectTipo = document.getElementById("tipoSelect");
    if (selectTipo) {
        selectTipo.value = "estratificacaoDeArea";
        
        // Chamada à função que esconde/mostra os campos (Do código que você forneceu)
        // Isso garante que 'outrosContainer' e 'mutiraoContainer' fiquem ocultos
        // e limpa os campos inputOutros, inputEndereco, inputQuadra, inputUAPS (dentro de toggleFields)
        if (typeof toggleFields === 'function') {
            toggleFields(selectTipo.value);
        }
    }

    // Chama as funções de atualização para garantir que tudo seja resetado na tela
    // (Presumindo que estas funções estão definidas no seu escopo global/superior)
    montarListaQuadras();
    montarResumoGeral();
    atualizarProgramados();
    
    console.log("Sistema completamente limpo.");
}
document.addEventListener("DOMContentLoaded", () => {
    // ---21. Função para preencher semanas ---
    function preencherSemanas(selectId) {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Selecione</option>'; // reset
            for (let i = 1; i <= 52; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = `${i}ª Semana`;
                select.appendChild(option);
            }
        }
    }

    // 22.--- Função para preencher ciclos ---
    function preencherCiclos() {
        const select = document.getElementById("ciclo");
        if (select) {
            select.innerHTML = '<option value="">Selecione</option>'; // reset
            for (let i = 1; i <= 8; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = `${i}º Ciclo`;
                select.appendChild(option);
            }
        }
    }

    const semanaInicial = document.getElementById("semanaInicial");
    const semanaFinal = document.getElementById("semanaFinal");

    // Preenche listas na inicialização
    preencherSemanas("semanaInicial");
    preencherCiclos();

    // Só habilita Semana Final depois de escolher Inicial
    semanaInicial.addEventListener("change", () => {
        if (semanaInicial.value) {
            semanaFinal.disabled = false;
            preencherSemanas("semanaFinal"); // libera todas
        } else {
            semanaFinal.disabled = true;
            semanaFinal.innerHTML = '<option value="">Preencha a Semana Inicial primeiro</option>';
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // 23.Função que calcula a soma dos depósitos
    function atualizarTotalDepositos() {
        const ids = ["a1", "a2", "b", "c", "d1", "d2", "e"];
        let total = 0;

        ids.forEach(id => {
            const campo = document.getElementById(id);
            const valor = Number(campo.value) || 0; // se vazio vira 0
            total += valor;

            // sempre recalcula quando mudar
            campo.addEventListener("input", atualizarTotalDepositos);
        });

        const totalCampo = document.getElementById("totalDepositos");
        if (totalCampo) {
            totalCampo.value = total;
        }
    }

    // inicializa o cálculo na carga da página
    atualizarTotalDepositos();
});
document.addEventListener("DOMContentLoaded", () => {
//24.
    function atualizarPercentuais() {
        // Pega valor de imóveis programados no painel
        const resumo = document.querySelector("#resumoProgramados");
        const match = resumo.innerText.match(/Imóveis Programados:\s*(\d+)/);
        const imoveisProgramados = match ? parseInt(match[1], 10) : 0;

        // Pega campos
        const imoveisTrabalhados = Number(document.getElementById("imoveisTrabalhadosInput").value) || 0;
        const fechados = Number(document.getElementById("fechadosInput").value) || 0;

        // Calcula percentuais
        const percTrabalhados = imoveisProgramados > 0 ? ((imoveisTrabalhados / imoveisProgramados) * 100).toFixed(1) : 0;
        const percFechados = imoveisProgramados > 0 ? ((fechados / imoveisProgramados) * 100).toFixed(1) : 0;

        // Atualiza na tela
        document.getElementById("percImoveisTrabalhados").textContent = 
            `(${percTrabalhados}% de ${imoveisProgramados} programados)`;

        document.getElementById("percFechados").textContent = 
            `(${percFechados}% de ${imoveisProgramados} programados)`;
    }

    // Eventos para recalcular
    document.getElementById("imoveisTrabalhadosInput").addEventListener("input", atualizarPercentuais);
    document.getElementById("fechadosInput").addEventListener("input", atualizarPercentuais);

    // Atualiza ao carregar
    atualizarPercentuais();
});
//25.
document.addEventListener("DOMContentLoaded", () => {
    function verificarTratamentos() {
        const imoveisBti = Number(document.getElementById("imoveisBtiInput").value) || 0;
        const imoveisEsp = Number(document.getElementById("imoveisEspInput").value) || 0;

        const depositosBti = document.getElementById("depositosBtiInput");
        const depositosEsp = document.getElementById("depositosEspInput");
        const larvicidaBti = document.getElementById("larvicidaBtiInput");
        const larvicidaEsp = document.getElementById("larvicidaEspInput");

        // --- BTI ---
        if (imoveisBti > 0) {
            depositosBti.disabled = false;
            larvicidaBti.disabled = false;
            depositosBti.placeholder = "";
            larvicidaBti.placeholder = "";
        } else {
            depositosBti.disabled = true;
            larvicidaBti.disabled = true;
            depositosBti.value = "";
            larvicidaBti.value = "";
            depositosBti.placeholder = "Não é necessário preencher";
            larvicidaBti.placeholder = "Não é necessário preencher";
        }

        // --- ESP ---
        if (imoveisEsp > 0) {
            depositosEsp.disabled = false;
            larvicidaEsp.disabled = false;
            depositosEsp.placeholder = "";
            larvicidaEsp.placeholder = "";
        } else {
            depositosEsp.disabled = true;
            larvicidaEsp.disabled = true;
            depositosEsp.value = "";
            larvicidaEsp.value = "";
            depositosEsp.placeholder = "Não é necessário preencher";
            larvicidaEsp.placeholder = "Não é necessário preencher";
        }
    }

    // Observa mudanças nos campos principais
    ["imoveisBtiInput", "imoveisEspInput",
     "depositosBtiInput", "depositosEspInput",
     "larvicidaBtiInput", "larvicidaEspInput"]
    .forEach(id => {
        document.getElementById(id).addEventListener("input", verificarTratamentos);
    });

    // Executa logo ao carregar
    verificarTratamentos();
});
//26
function compartilharWhatsApp() {
    console.log("Iniciando compartilhamento via WhatsApp (Versão Final Otimizada)...");

    if (!estado || !estado.bairroSelecionado) {
        alert("Selecione um bairro e defina a estratificação primeiro!");
        return;
    }

    try {
        const bairro = estado.bairroSelecionado;
        
        // --- FUNÇÕES AUXILIARES DE BUSCA ROBUSTA ---
        const getValue = (id) => document.getElementById(id)?.value.trim() || 'N/A';
        const getText = (id) => document.getElementById(id)?.textContent.trim() || 'N/A';
        
        // Função de Formatação de Data
        const formatarData = (data) => {
            if (!data || data === 'N/A') return 'N/A';
            const dataObj = new Date(data + "T00:00:00"); 
            if (isNaN(dataObj)) return 'N/A'; 
            return dataObj.toLocaleDateString('pt-BR');
        };

        // --- FONTES DE DADOS ---
        const resumoGeral = document.getElementById('resumoGeral')?.textContent || '';
        const resumoProgramadosText = document.getElementById('resumoProgramados')?.textContent || '';
        const dadosDetalhes = document.getElementById('dadosDetalhes')?.textContent || '';


        // --- 1. EXTRAÇÃO DE DADOS ESTÁTICOS DO BAIRRO (resumoGeral) ---
        const totalQuadrasAtivas = resumoGeral.match(/Total de Quadras \(ativas\):\s*(\d+)/)?.[1] || 'N/A';
        const totalImoveisGeral = resumoGeral.match(/Total de Imóveis:\s*(\d+)/)?.[1] || 'N/A'; 
        const totalHabitantesGeral = resumoGeral.match(/Total de Habitantes:\s*(\d+)/)?.[1] || 'N/A'; 
        const cãesGeral = resumoGeral.match(/Cães:\s*(\d+)/)?.[1] || 'N/A'; 
        const gatosGeral = resumoGeral.match(/Gatos:\s*(\d+)/)?.[1] || 'N/A'; 
        const ovitrampasGeral = resumoGeral.match(/Ovitrampas \(palhetas\):\s*(\d+)/)?.[1] || 'N/A'; 
        const pontosEstrategicosGeral = resumoGeral.match(/Pontos Estratégicos \(PE\):\s*(\d+)/)?.[1] || 'N/A'; 
        
        // --- 2. EXTRAÇÃO DE DADOS DINÂMICOS (resumoProgramadosText) ---
        const totalHabitantesProg = resumoProgramadosText.match(/Total de Habitantes:\s*(\d+)/)?.[1] || 'N/A'; 
        const imoveisProgramados = resumoProgramadosText.match(/Imóveis Programados:\s*(\d+)/)?.[1] || 'N/A'; 
        const pontosEstrategicosProg = resumoProgramadosText.match(/Pontos Estratégicos \(PE\):\s*(\d+)/)?.[1] || pontosEstrategicosGeral; 
        
        // --- 3. MOTIVAÇÃO E CAMPOS DE ESTRATIFICAÇÃO (Inputs) ---
        const selectTipo = document.getElementById('tipoSelect');
        let motivo = "Não definido";
        let outrosTipo = "";
        
        if (selectTipo) {
            motivo = selectTipo.options[selectTipo.selectedIndex].textContent.trim();
            outrosTipo = getValue('inputOutros');
        }
        if (motivo.toLowerCase().includes("outros") && outrosTipo !== "N/A") {
            motivo += ` (${outrosTipo})`;
        }
        
        const endereço = getValue("inputEndereco");
        const quadraMutirao = getValue("inputQuadra");
        const uaps = getValue("inputUAPS");

        // --- 4. PROGRAMAÇÃO E ESFORÇO (CAMPOS INPUT) ---
        const quadrasSelecionadas = getValue("quadrasEstratificadas"); 
        const percentualFechados = getValue("percentualFechados");
        const imoveisTrabalhar = getValue("imoveisATrabalhar"); 
        const media = getValue("media");
        const servidores = getValue("servidores");
        const dias = getValue("dias");
        const dataInicioProg = getValue("dataInicio");
        const dataTerminoProg = getValue("dataTermino");
        
        // --- 5. RESULTADOS/EXECUÇÃO ---
        const quadrasPositivas = getValue("quadrasPositivas") || "Nenhuma";
        const quadrasTrabalhadas = getValue("quadrasTrabalhadasInput");
        const hdp = getValue("hdpInput");
        const hdt = getValue("hdtInput");
        const semanaInicial = getValue("semanaInicial");
        const semanaFinal = getValue("semanaFinal");
        const ciclo = getValue("ciclo");
        const dataInicioReal = getValue("dataInicioReal");
        const dataTerminoReal = getValue("dataTerminoReal");
        const responsavel = getValue("responsavel");
        const obs = getValue("observacoes");

        // Imóveis e Focos (Continuação)
        const imoveisTrabalhados = getValue("imoveisTrabalhadosInput");
        const fechados = getValue("fechadosInput");
        const percTrabalhadosText = getText("percImoveisTrabalhados");
        // Extrai o texto da porcentagem (ex: "(0% de 0 programados)")
        let percTrabalhados = percTrabalhadosText.match(/\((.*?)\)/)?.[1] || ''; 
        
        // CORREÇÃO: Limpa a string da porcentagem se for o texto indesejado.
        const percLimpo = percTrabalhados.includes('0% de 0') ? '' : ` (${percTrabalhados})`;


        const focosPorImovel = getValue("focosPorImovelInput");
        const btiTratados = getValue("imoveisBtiInput");
        const espTratados = getValue("imoveisEspInput");

        // Depósitos Positivos (IDs: a1, a2, b, c, d1, d2, e)
        const d_A1 = getValue("a1");
        const d_A2 = getValue("a2");
        const d_B = getValue("b");
        const d_C = getValue("c");
        const d_D1 = getValue("d1");
        const d_D2 = getValue("d2");
        const d_E = getValue("e");
        const totalDepositosPositivos = getValue("totalDepositos"); 

        // Larvicidas e Eliminação
        const depositosBti = getValue("depositosBtiInput");
        const depositosEsp = getValue("depositosEspInput");
        const larvicidaBti = getValue("larvicidaBtiInput");
        const larvicidaEsp = getValue("larvicidaEspInput");
        const depositosEliminados = getValue("depositosEliminadosInput");
        
        
        // --- MONTAGEM DA MENSAGEM ---
        let mensagem = `*🦟 RESUMO DA ESTRATIFICAÇÃO - ${bairro.toUpperCase()} 🗓️*\n`;
        mensagem += `*Responsável:* ${responsavel !== 'N/A' ? responsavel : 'Não Informado'}\n\n`;

        // 1. DADOS GERAIS DO BAIRRO (ESTÁTICOS)
        mensagem += `*--- DADOS GERAIS DO BAIRRO ---\n`;
        mensagem += `*Quadras (Ativas):* ${totalQuadrasAtivas}\n`;
        mensagem += `*Total Imóveis (Ativos):* ${totalImoveisGeral}\n`;
        mensagem += `*Total Habitantes:* ${totalHabitantesGeral}\n`; 
        mensagem += `*Cães/Gatos:* ${cãesGeral}/${gatosGeral}\n`;
        mensagem += `*Ovitrampas:* ${ovitrampasGeral} /(PE) ${pontosEstrategicosGeral}\n\n`;
        
        // 2. PROGRAMAÇÃO E ESFORÇO (DINÂMICOS)
        mensagem += `*--- PROGRAMAÇÃO ---\n`;
        mensagem += `*Tipo:* ${motivo}\n`;
        
        if (selectTipo?.value.includes("mutirao")) { 
            mensagem += `*Endereço:* ${endereço} (Quadra ${quadraMutirao}) - UAPS: ${uaps}\n`;
        }
        
        // Bloco de Quadras Programadas/Foco
        mensagem += `*🗺 Quadras Programadas (Meta):* ${quadrasSelecionadas.length > 0 ? quadrasSelecionadas : 'N/A'}\n`;
        if (quadrasPositivas !== 'Nenhuma' && quadrasPositivas !== 'N/A') {
            mensagem += `*🚨 Quadras Foco (Positivas):* ${quadrasPositivas}\n`;
        } 
        
        // Dados de esforço DINÂMICOS
        mensagem += `*Total Habitantes:* ${totalHabitantesProg}\n`; 
        mensagem += `*Pontos Estratégicos (PE):* ${pontosEstrategicosProg}\n`; 
        // REMOVIDA A LINHA DE REPETIÇÃO: *Imóveis Programados: ${imoveisProgramados}\n
        mensagem += `*Imóveis Programados:* ${imoveisProgramados} /Á trabalhar ${imoveisTrabalhar}\n`;
        mensagem += `*(% Fechados Previsto:* ${percentualFechados}%) \n`;

        mensagem += `*Período Programado:* ${formatarData(dataInicioProg)} á ${formatarData(dataTerminoProg)}\n`;
        // Separação solicitada:
        mensagem += `*Servidores:* ${servidores}\n`;
        mensagem += `*Média por Servidor:* ${media}\n`;
        mensagem += `*Dias Programados:* ${dias}\n\n`;
        
        // 3. RESULTADOS (EXECUÇÃO)
        
        if (quadrasTrabalhadas !== '0' && quadrasTrabalhadas !== 'N/A') {
            mensagem += `*--- RESULTADOS ---\n`;
            mensagem += `*Período Real:* ${formatarData(dataInicioReal)} á ${formatarData(dataTerminoReal)}\n`;
            mensagem += `*Semana:* ${semanaInicial} a ${semanaFinal} (Ciclo ${ciclo})\n`;
            mensagem += `*HDP:* ${hdp} /HDT ${hdt}\n`;
            mensagem += `*Quadras Trabalhadas:* ${quadrasTrabalhadas}\n`;
            
            // Imóveis e Focos (AGORA USANDO O percLimpo)
            mensagem += `*Imóveis Trabalhados:* ${imoveisTrabalhados}${percLimpo}\n`; 
            mensagem += `*Fechados:* ${fechados}\n`;
            mensagem += `*QTD Focos/Imóvel:* ${focosPorImovel}\n`;
            
            // Tratamentos (Imóveis)
            mensagem += `*Imóveis Tratados BTI:* ${btiTratados} /ESP ${espTratados}\n`;
            
            // Depósitos Positivos (FORMATO ESPECÍFICO SOLICITADO)
           mensagem += `*Total Dep. Positivos:* ${totalDepositosPositivos}\n`;
            
            // Formatação detalhada A1: 269 | A2: 270 | ...
            const depositosDetalhados = [
                `A1: ${d_A1}`, `A2: ${d_A2}`, `B: ${d_B}`, `C: ${d_C}`,
                `D1: ${d_D1}`, `D2: ${d_D2}`, `E: ${d_E}`
            ].join(' | ');
            mensagem += `*Detalhes:* ${depositosDetalhados}\n`;
            
            // Larvicidas e Eliminação
            mensagem += `*Depósitos Tratados BTI:* ${depositosBti}\n`;
            mensagem += `*Depósitos Tratados ESP:* ${depositosEsp}\n`;
            
            mensagem += `*Larvicida Gasto BTI:* ${larvicidaBti}\n`;
            mensagem += `*Larvicida Gasto ESP:* ${larvicidaEsp}\n`;
            
            mensagem += `*Depósitos Eliminados:* ${depositosEliminados}\n\n`;

            // Observações Finais
            if (obs !== 'N/A' && obs.length > 0) {
                 mensagem += `*--- OBSERVAÇÕES ---\n`;
                 mensagem += `${obs}\n\n`;
            }
        }
        
        mensagem += `_Dados exportados em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })}_`;


        // --- Finalização ---
        const textoFormatado = encodeURIComponent(mensagem);
        const urlWhatsApp = `https://api.whatsapp.com/send?text=${textoFormatado}`;

        window.open(urlWhatsApp, '_blank');

    } catch (error) {
        console.error("Erro fatal ao montar a mensagem do WhatsApp:", error);
        alert("Erro ao tentar compartilhar. Verifique o console para detalhes.");
    }
}
//27.
document.addEventListener("DOMContentLoaded", () => {
    const quadrasTrabalhadasInput = document.getElementById("quadrasTrabalhadasInput");
    const obsQuadrasTrabalhadas = document.getElementById("obsQuadrasTrabalhadas");

    function atualizarQuadrasTrabalhadas() {
        // Pega o total de quadras selecionadas em Programados
        const totalSelecionadasElem = document.querySelector("#resumoProgramados span strong");
        let totalSelecionadas = 0;

        // Busca no HTML o valor certo (pelo texto "Quadras Selecionadas:")
        document.querySelectorAll("#resumoProgramados span").forEach(span => {
            if (span.textContent.includes("Quadras Selecionadas:")) {
                totalSelecionadas = Number(span.textContent.replace(/\D/g, "")) || 0;
            }
        });

        // Se já existir campo de Programados preenchido
        if (totalSelecionadas > 0 && !quadrasTrabalhadasInput.dataset.editado) {
            quadrasTrabalhadasInput.value = totalSelecionadas;
        }

        // Comparar valores
        const trabalhadas = Number(quadrasTrabalhadasInput.value) || 0;
        if (trabalhadas === totalSelecionadas && totalSelecionadas > 0) {
            obsQuadrasTrabalhadas.innerHTML = "✔ Todas as quadras foram trabalhadas.";
            obsQuadrasTrabalhadas.style.color = "orange";
        } else if (trabalhadas < totalSelecionadas) {
            const diferenca = totalSelecionadas - trabalhadas;
            obsQuadrasTrabalhadas.innerHTML = `⚠ ${diferenca} quadra(s) não foram trabalhadas.`;
            obsQuadrasTrabalhadas.style.color = "orange";
        } else {
            obsQuadrasTrabalhadas.innerHTML = "";
        }
    }

    // Marca que o campo foi editado manualmente
    quadrasTrabalhadasInput.addEventListener("input", () => {
        quadrasTrabalhadasInput.dataset.editado = true;
        atualizarQuadrasTrabalhadas();
    });

    // Sempre que atualizar Programados, atualiza também esse campo
    const observer = new MutationObserver(atualizarQuadrasTrabalhadas);
    observer.observe(document.getElementById("resumoProgramados"), { childList: true, subtree: true });

    atualizarQuadrasTrabalhadas(); // rodar na inicialização
});
//28.
    document.addEventListener('DOMContentLoaded', (event) => {
    const selectEstratificacao = document.getElementById('tipoEstratificacao');
    const outrosCampoContainer = document.getElementById('outrosCampoContainer');
    const outrosCampoInput = document.getElementById('outrosTipoEstratificacao');
    const avisoOutros = document.getElementById('avisoOutros');

    if (selectEstratificacao) {
        selectEstratificacao.addEventListener('change', (event) => {
            if (event.target.value === 'outros') {
                outrosCampoContainer?.classList.remove('oculto');
                avisoOutros?.classList.remove('oculto');
                outrosCampoInput?.setAttribute('required', 'required');
            } else {
                outrosCampoContainer?.classList.add('oculto');
                avisoOutros?.classList.add('oculto');
                outrosCampoInput?.removeAttribute('required');
            }
        });
    }
});

//29.
document.addEventListener("DOMContentLoaded", function() {
   // 🛑 BLOCO DE VERIFICAÇÃO DE MANUTENÇÃO 🛑
    const maintenanceOverlay = document.getElementById('maintenanceOverlay');

    if (MODO_MANUTENCAO_ATIVO) {
        if (maintenanceOverlay) {
            // Remove a classe 'hidden' para mostrar a mensagem
            maintenanceOverlay.classList.remove('maintenance-hidden');
            
            // Opcional: Se houver um container principal, você pode esconder ele também
            // document.querySelector('.main-grid').style.display = 'none';

            console.log("Sistema bloqueado: MODO MANUTENÇÃO ATIVO.");
            return; // 🛑 MUITO IMPORTANTE: Sai da função e impede o resto do código de rodar!
        }
    } else {
        // Garante que o overlay esteja escondido se a chave for false
        if (maintenanceOverlay) {
            maintenanceOverlay.classList.add('maintenance-hidden');
        }
    }
    console.log("Sistema de estratificação inicializando...");

    // 1. Inicia o carregamento dos dados principais
    carregarDados();

    // 2. Event Listener para seleção do Bairro
    if (selectBairro) {
        selectBairro.addEventListener("change", function() {
            estado.bairroSelecionado = this.value;
            estado.quadrasSelecionadas.clear(); // Limpa as quadras selecionadas ao mudar o bairro
            estado.quadrasPositivas.clear();     // Limpa as quadras positivas
            
            montarResumoGeral();
            montarListaQuadras();
            atualizarProgramados();
            atualizarQuadrasSelecionadas();
            atualizarQuadrasPositivas(); // Garante que o campo de positivas seja limpo
        });
    }

    // 3. Event Listener para aplicar o texto da entrada de quadras (1-10, 25, 4/1)
    if (aplicarTextoBtn && entradaQuadras) {
        aplicarTextoBtn.addEventListener("click", function() {
            if (!estado.bairroSelecionado) {
                alert("Selecione um bairro primeiro!");
                return;
            }
            const texto = entradaQuadras.value;
            const quadrasSelecionadas = interpretarEntrada(texto);
            estado.quadrasSelecionadas = quadrasSelecionadas;
            
            // Re-renderiza a lista para atualizar os checkboxes
            montarListaQuadras();
            
            // Atualiza os painéis de resumo e texto
            atualizarProgramados();
            atualizarQuadrasSelecionadas();
            atualizarQuadrasPositivas(); 
        });
    }

    // 4. Event Listeners para o CÁLCULO DE PROGRAMAÇÃO (Esforço)
    const inputPercentual = document.getElementById("percentualFechados");
    const inputMedia = document.getElementById("media");
    const inputServidores = document.getElementById("servidores");
    const inputDataInicio = document.getElementById("dataInicio");
    
    // O percentual afeta Imóveis a Trabalhar, que chama calcularDiasETermino
    if (inputPercentual) inputPercentual.addEventListener("input", calcularImoveisATrabalhar);
    
    // Mídia, Servidores e Data Início afetam diretamente calcularDiasETermino
    if (inputMedia) inputMedia.addEventListener("input", calcularDiasETermino);
    if (inputServidores) inputServidores.addEventListener("input", calcularDiasETermino);
    if (inputDataInicio) inputDataInicio.addEventListener("input", calcularDiasETermino);

    // 5. Event Listener para o botão LIMPAR TUDO
    if (limparTudoBtn) {
        limparTudoBtn.addEventListener("click", limparTudo);
    }
    
    // 6. Event Listener para o botão COMPARTILHAR WHATSAPP
    const btnCompartilhar = document.getElementById("compartilharWhatsapp");
    if (btnCompartilhar) {
        // Assume que a função 'compartilharWhatsApp' foi definida no escopo
        btnCompartilhar.addEventListener("click", compartilharWhatsApp);
    }

    // 7. Lógica de validação do campo "Quadras Trabalhadas" (MutationObserver)
    const quadrasTrabalhadasInput = document.getElementById("quadrasTrabalhadasInput");
    const obsQuadrasTrabalhadas = document.getElementById("obsQuadrasTrabalhadas");
    
    if (quadrasTrabalhadasInput && obsQuadrasTrabalhadas) {
        // Função para atualizar a validação das quadras trabalhadas
        function atualizarQuadrasTrabalhadas() {
            // ... (implementação da função) ...
            // [A função 'atualizarQuadrasTrabalhadas' completa deve estar definida no seu script]
            
            // Pega o total de quadras selecionadas (a meta)
            let totalSelecionadas = 0;
            document.querySelectorAll("#resumoProgramados span").forEach(span => {
                if (span.textContent.includes("Quadras Selecionadas:")) {
                    totalSelecionadas = Number(span.textContent.replace(/\D/g, "")) || 0;
                }
            });

            // Se for a primeira vez, preenche automaticamente
            if (totalSelecionadas > 0 && !quadrasTrabalhadasInput.dataset.editado) {
                quadrasTrabalhadasInput.value = totalSelecionadas;
            }

            // Comparar valores e exibir observação
            const trabalhadas = Number(quadrasTrabalhadasInput.value) || 0;
            if (trabalhadas === totalSelecionadas && totalSelecionadas > 0) {
                obsQuadrasTrabalhadas.innerHTML = "✔ Todas as quadras foram trabalhadas.";
                obsQuadrasTrabalhadas.style.color = "green"; // Ajuste para verde ou cor de sucesso
            } else if (trabalhadas < totalSelecionadas) {
                const diferenca = totalSelecionadas - trabalhadas;
                obsQuadrasTrabalhadas.innerHTML = `⚠ ${diferenca} quadra(s) não foram trabalhadas.`;
                obsQuadrasTrabalhadas.style.color = "orange";
            } else {
                obsQuadrasTrabalhadas.innerHTML = "";
                obsQuadrasTrabalhadas.style.color = "";
            }
        }
        
        // Marca que o campo foi editado manualmente
        quadrasTrabalhadasInput.addEventListener("input", () => {
            quadrasTrabalhadasInput.dataset.editado = true;
            atualizarQuadrasTrabalhadas();
        });

        // Observa mudanças no resumo de programados para atualizar a meta
        const observer = new MutationObserver(atualizarQuadrasTrabalhadas);
        observer.observe(document.getElementById("resumoProgramados"), { childList: true, subtree: true });

        atualizarQuadrasTrabalhadas(); // Roda na inicialização
    }

  // 8. Lógica de controle do campo "Outros" na Estratificação
    const selectEstratificacao = document.getElementById('tipoEstratificacao');
    const outrosCampoContainer = document.getElementById('outrosCampoContainer');
    const outrosCampoInput = document.getElementById('outrosTipoEstratificacao');
    const avisoOutros = document.getElementById('avisoOutros');

    if (selectEstratificacao && outrosCampoContainer && outrosCampoInput && avisoOutros) {
        selectEstratificacao.addEventListener('change', (event) => {
            if (event.target.value === 'outros') {
                outrosCampoContainer.classList.remove('oculto');
                avisoOutros.classList.remove('oculto');
                outrosCampoInput.setAttribute('required', 'required');
            } else {
                outrosCampoContainer.classList.add('oculto');
                avisoOutros.classList.add('oculto');
                outrosCampoInput.removeAttribute('required');
            }
        });
    }

    // ==========================================================
    // !!! NOVO CÓDIGO DO RELATÓRIO INSERIDO AQUI !!! (Ponto 9)
    // ==========================================================
    // 30. Event Listener para o botão GERAR RELATÓRIO WORD
    const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
    if (gerarRelatorioBtn) {
        // Assume que a função 'gerarRelatorioWord' foi definida no escopo (no topo do script)
        gerarRelatorioBtn.addEventListener('click', gerarRelatorioWord);
    }
   // ... Código do ponto 9 (Gerar Relatório Word) ...

    // 31. Event Listener para o botão EXPORTAR TABELA TXT
    const exportarTabelaTxtBtn = document.getElementById('exportarTabelaTxtBtn');
    if (exportarTabelaTxtBtn) {
        exportarTabelaTxtBtn.addEventListener('click', exportarTabelaTXT);
    }
    
    console.log("Sistema inicializado com sucesso!");
});











































































































































