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
function atualizarQuadrasSelecionadas() {
    const textarea = document.getElementById("quadrasEstratificadas");
    const detalhesDiv = document.getElementById("dadosDetalhes");

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
    detalhesDiv.innerHTML = "";
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

    // CORREÇÃO: As variáveis de cálculo devem ser declaradas aqui.
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
// A função de cálculo de dias e término está correta. Mantenha-a como está.
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
    
    // Atualiza o campo "Dias Programados"
    document.getElementById("dias").value = Math.ceil(diasProgramados);

    // 3. Calcular a "Data de Término Programado"
    const dataTerminoInput = document.getElementById("dataTermino");
    if (!dataInicio) {
        dataTerminoInput.value = "";
        return;
    }

    const dataAtual = new Date(dataInicio + "T00:00:00"); // Adiciona o horário para evitar problemas de fuso horário
    
    let diasUteisAdicionados = 0;
    while (diasUteisAdicionados < Math.ceil(diasProgramados)) {
        dataAtual.setDate(dataAtual.getDate() + 1);
        const diaDaSemana = dataAtual.getDay();
        if (diaDaSemana !== 0 && diaDaSemana !== 6) {
            diasUteisAdicionados++;
        }
    }
    
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    dataTerminoInput.value = `${dia}/${mes}/${ano}`;
}

// Sua função atualizarProgramados (aqui com a chamada para o novo cálculo)
function atualizarProgramados() {
    const resumoProgramados = document.getElementById("resumoProgramados");

    if (!estado.bairroSelecionado) {
        resumoProgramados.innerHTML = "<em>Selecione um bairro para ver os programados.</em>";
        return;
    }

    // ... (o restante do seu código para calcular totais) ...
    
    const imoveisProgramados = totalImoveis - apartamentos;
    
    resumoProgramados.innerHTML = `
        <span>🏠 <strong>Imóveis Programados:</strong> <span id="imoveisProgramadosValue">${imoveisProgramados}</span></span>
        `;
    
    // Chama o cálculo de imóveis a trabalhar, que por sua vez, chama o cálculo de dias
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



































