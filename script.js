// =============================================
// SISTEMA DE ESTRATIFICAÇÃO - VERSÃO COMPLETA
// =============================================

// --- VARIÁVEIS GLOBAIS ---
let bairros = [];
let estado = {
    bairroSelecionado: null,
    quadrasDisponiveis: [],
    quadrasSelecionadas: new Set(),
  quadrasPositivas: new Set(), // ✅ novo
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

// --- FUNÇÕES PRINCIPAIS ---

// 1. CARREGAR DADOS E PREENCHER BAIRROS
function carregarDados() {
    fetch('bairros_4ciclo_2025.json')
        .then(response => {
            if (!response.ok) throw new Error('Erro ao carregar dados');
            return response.json();
        })
        .then(data => {
            bairros = data;
            preencherListaBairros();
            console.log('Dados carregados:', bairros.length, 'registros');
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar dados. Verifique o console para detalhes.');
        });
}

// 2. PREENCHER LISTA DE BAIRROS
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

// 3. MONTAR RESUMO GERAL DO BAIRRO (COM TODOS OS DADOS)
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

    // 1) quadras únicas (string trimmed)
    const quadrasUnicas = [...new Set(dadosBairro.map(item => String(item.QT).trim()))];

    // 2) quadras ativas = existem e TOTAL > 0
    const quadrasAtivas = quadrasUnicas.filter(qt => {
        const row = dadosBairro.find(b => String(b.QT).trim() === qt);
        const total = Number(row?.TOTAL);
        return !isNaN(total) && total > 0;
    });

    // 3) totais (mantém sua função existente)
    const totais = calcularTotaisBairro(dadosBairro);
    const totalProgramados = (totais.TOTAL || 0) - (totais["AP. ACIMA DO TÉRREO"] || 0);

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
        <span><strong>🏠 Imóveis Programados:</strong> ${totalProgramados}</span>
        <span><strong>🐕 Cães:</strong> ${totais.CÃO}</span>
        <span><strong>🐈 Gatos:</strong> ${totais.GATO}</span>
    `;
}
// 4. CALCULAR TOTAIS COMPLETOS DO BAIRRO
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
// 5. MONTAR LISTA DE QUADRAS COM DETALHES
// === FUNÇÃO: MONTAR LISTA DE QUADRAS ===
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

        // -------------------------------------------------------------
        // NOVO: Adicionar a verificação 'isExtinta' aqui
        // O checkbox Positiva só é habilitado se NÃO for extinta
        // E se o checkbox principal estiver selecionado
        // -------------------------------------------------------------
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

        // -------------------------------------------------------------
        // NOVO: Adicionar a verificação 'isExtinta' ao listener
        // Para evitar que o checkbox seja habilitado em quadras extintas
        // -------------------------------------------------------------
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


// === FUNÇÃO: MOSTRAR APENAS QUADRAS SELECIONADAS ===
// === FUNÇÃO: MOSTRAR APENAS QUADRAS SELECIONADAS ===
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

// Função para calcular e atualizar o campo 'Imóveis a Trabalhar'
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


// 6. ATUALIZAR RESUMO DE PROGRAMADOS COMPLETO
// 6. ATUALIZAR RESUMO DE PROGRAMADOS COMPLETO
function atualizarProgramados() {
    const resumoProgramados = document.getElementById("resumoProgramados");

    if (!estado.bairroSelecionado) {
        resumoProgramados.innerHTML = "<em>Selecione um bairro para ver os programados.</em>";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);

    // Quadras selecionadas ativas (sem extintas)
    const quadrasSelecionadasAtivas = Array.from(estado.quadrasSelecionadas).filter(q => {
        const dadosQuadra = dadosBairro.find(b => b.QT === q);
        return dadosQuadra && Number(dadosQuadra.TOTAL) > 0;
    });

    const dadosQuadrasSelecionadas = dadosBairro.filter(b => quadrasSelecionadasAtivas.includes(b.QT));

    const totalQuadrasSelecionadas = quadrasSelecionadasAtivas.length;

    // Função auxiliar para converter para número de forma segura
    const getNumero = (valor) => {
        const num = Number(valor);
        return isNaN(num) ? 0 : num;
    };

    // **CORREÇÃO: As variáveis de cálculo devem ser declaradas aqui.**
    const totalImoveis = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TOTAL || 0), 0);
    const residencias = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.R || 0), 0);
    const comercios = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.C || 0), 0);
    const terrenos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TB || 0), 0);
    const outros = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.OU || 0), 0);
    const pontosEstrategicos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.PE || 0), 0);
    
    // Nomes de propriedades corrigidos
    const apartamentos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur['AP. ACIMA DO TÉRREO'] || 0), 0);
    const habitantes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.HABITANTES || 0), 0);
    const caes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.CÃO || 0), 0);
    const gatos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.GATO || 0), 0);
    
    // Depósitos de água
    const depositos = dadosQuadrasSelecionadas.reduce((acc, cur) => {
        return acc + getNumero(cur['TANQUE EXISTENTE']) + getNumero(cur['TAMBOR EXISTENTE']) + getNumero(cur['CISTERNA EXISTENTE']) + getNumero(cur['CACIMBA EXISTENTE']) + getNumero(cur["CAIXAS D'ÁGUA EXISTENTE"]);
    }, 0);

    const imoveisProgramados = totalImoveis - apartamentos;

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
    `;
    
    // Agora que o elemento existe no DOM, você pode chamá-lo
    calcularImoveisATrabalhar();
}
// 7. CALCULAR TOTAIS DAS QUADRAS SELECIONADAS
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
function atualizarQuadrasPositivas() {
    const textarea = document.getElementById("quadrasPositivas");
    textarea.value = Array.from(estado.quadrasPositivas).join(", ");
}

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

// 8. MOSTRAR DETALHES DAS QUADRAS SELECIONADAS
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

// 9. INTERPRETAR ENTRADA DE TEXTO PARA QUADRAS
// === FUNÇÃO: INTERPRETAR ENTRADA DE TEXTO PARA QUADRAS ===
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
// 1. CALCULAR DIAS E DATA DE TÉRMINO PROGRAMADO
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


// Sua função atualizarProgramados (aqui com a chamada para o novo cálculo)
// 6. ATUALIZAR RESUMO DE PROGRAMADOS COMPLETO
function atualizarProgramados() {
    const resumoProgramados = document.getElementById("resumoProgramados");

    if (!estado.bairroSelecionado) {
        resumoProgramados.innerHTML = "<em>Selecione um bairro para ver os programados.</em>";
        return;
    }

    const dadosBairro = bairros.filter(b => b.BAIRRO === estado.bairroSelecionado);

    // Quadras selecionadas ativas (sem extintas)
    const quadrasSelecionadasAtivas = Array.from(estado.quadrasSelecionadas).filter(q => {
        const dadosQuadra = dadosBairro.find(b => b.QT === q);
        return dadosQuadra && Number(dadosQuadra.TOTAL) > 0;
    });

    const dadosQuadrasSelecionadas = dadosBairro.filter(b => quadrasSelecionadasAtivas.includes(b.QT));

    const totalQuadrasSelecionadas = quadrasSelecionadasAtivas.length;

    // Função auxiliar para converter para número de forma segura
    const getNumero = (valor) => {
        const num = Number(valor);
        return isNaN(num) ? 0 : num;
    };

    // ❌ CORREÇÃO: As variáveis de cálculo estavam faltando aqui.
    // Elas precisam ser declaradas e calculadas antes de serem usadas no HTML.
    const totalImoveis = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TOTAL || 0), 0);
    const residencias = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.R || 0), 0);
    const comercios = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.C || 0), 0);
    const terrenos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.TB || 0), 0);
    const outros = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.OU || 0), 0);
    const pontosEstrategicos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.PE || 0), 0);
    
    // Nomes de propriedades corrigidos
    const apartamentos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur['AP. ACIMA DO TÉRREO'] || 0), 0);
    const habitantes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.HABITANTES || 0), 0);
    const caes = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.CÃO || 0), 0);
    const gatos = dadosQuadrasSelecionadas.reduce((acc, cur) => acc + getNumero(cur.GATO || 0), 0);
    
    // Depósitos de água
    const depositos = dadosQuadrasSelecionadas.reduce((acc, cur) => {
        return acc + getNumero(cur['TANQUE EXISTENTE']) + getNumero(cur['TAMBOR EXISTENTE']) + getNumero(cur['CISTERNA EXISTENTE']) + getNumero(cur['CACIMBA EXISTENTE']) + getNumero(cur["CAIXAS D'ÁGUA EXISTENTE"]);
    }, 0);

    const imoveisProgramados = totalImoveis - apartamentos;

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
    `;
    
    // Agora que o elemento existe no DOM, você pode chamá-lo
    calcularImoveisATrabalhar();
}

// Sua função de cálculo de Imóveis a Trabalhar
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


// NOVO: Função de limpeza completa
function limparTudo() {
    estado.bairroSelecionado = null;
    estado.quadrasSelecionadas.clear();
    estado.quadrasPositivas.clear();
    
    // Limpa campos da tela
    if (selectBairro) selectBairro.value = "";
    if (entradaQuadras) entradaQuadras.value = "";
    if (resumoGeralDiv) resumoGeralDiv.innerHTML = "";
    if (listaQuadrasDiv) listaQuadrasDiv.innerHTML = "";
    if (resumoProgramadosDiv) resumoProgramadosDiv.innerHTML = "<em>Selecione quadras para ver os programados.</em>";
    if (dadosDetalhesDiv) dadosDetalhesDiv.innerHTML = "";
    
    // ✅ NOVO: Limpeza dos campos de cálculo
    document.getElementById("dataInicio").value = "";
    document.getElementById("media").value = "";
    document.getElementById("servidores").value = "";
    document.getElementById("imoveisATrabalhar").value = "";
    document.getElementById("percentualFechados").value = "";
    document.getElementById("dias").value = "";
    document.getElementById("dataTermino").value = "";
    
    // Chama as funções de atualização para garantir que tudo seja resetado
    montarListaQuadras();
    montarResumoGeral();
    atualizarProgramados();
}
document.addEventListener("DOMContentLoaded", () => {
    // --- Função para preencher semanas ---
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

    // --- Função para preencher ciclos ---
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
    // Função que calcula a soma dos depósitos
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
document.addEventListener("DOMContentLoaded", () => {
    const servidoresInput = document.getElementById("servidores");
    const diasInput = document.getElementById("dias");
    const hdpInput = document.getElementById("hdpInput");

    function atualizarHDP() {
        // só recalcula se o usuário não editou manualmente
        if (hdpInput.dataset.editado === "true") return;

        const servidores = parseInt(servidoresInput.value) || 0;
        const dias = parseInt(diasInput.value) || 0;

        if (servidores > 0 && dias > 0) {
            hdpInput.value = servidores * dias; // 👈 cálculo simples e direto
        } else {
            hdpInput.value = "";
        }
    }

    // Atualiza sempre que mudar servidores ou dias
    servidoresInput.addEventListener("input", atualizarHDP);
    diasInput.addEventListener("input", atualizarHDP);

    // Se o usuário editar o HDP manualmente, para de atualizar automático
    hdpInput.addEventListener("input", () => {
        hdpInput.dataset.editado = "true";
    });

    // Primeira atualização ao carregar a página
    atualizarHDP();
});





// --- INICIALIZAÇÃO ÚNICA ---
document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema de estratificação inicializando...");

    carregarDados();

    if (selectBairro) {
        selectBairro.addEventListener("change", function() {
            estado.bairroSelecionado = this.value;
            estado.quadrasSelecionadas.clear();
            montarResumoGeral();
            montarListaQuadras();
            atualizarProgramados();
            atualizarQuadrasSelecionadas();
        });
    }

    if (aplicarTextoBtn && entradaQuadras) {
        aplicarTextoBtn.addEventListener("click", function() {
            if (!estado.bairroSelecionado) {
                alert("Selecione um bairro primeiro!");
                return;
            }
            const texto = entradaQuadras.value;
            const quadrasSelecionadas = interpretarEntrada(texto);
            estado.quadrasSelecionadas = quadrasSelecionadas;
            montarListaQuadras();
            atualizarProgramados();
            atualizarQuadrasSelecionadas();
        });
    }
    
    // Adiciona ouvintes de eventos para os campos de cálculo
    const inputPercentual = document.getElementById("percentualFechados");
    const inputMedia = document.getElementById("media");
    const inputServidores = document.getElementById("servidores");
    const inputDataInicio = document.getElementById("dataInicio");
    
    if (inputPercentual) inputPercentual.addEventListener("input", calcularImoveisATrabalhar);
    if (inputMedia) inputMedia.addEventListener("input", calcularDiasETermino);
    if (inputServidores) inputServidores.addEventListener("input", calcularDiasETermino);
    if (inputDataInicio) inputDataInicio.addEventListener("input", calcularDiasETermino);

    if (limparTudoBtn) {
        limparTudoBtn.addEventListener("click", limparTudo);
    }
    
    console.log("Sistema inicializado com sucesso!");
});


























































