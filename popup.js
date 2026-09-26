// Captura de elementos
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const formatSelect = document.getElementById('formatSelect');
const highlightToggle = document.getElementById('highlightToggle');
const highlightColor = document.getElementById('highlightColor');
const previewBox = document.getElementById('preview');
const statusText = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');

// --- 1. CARREGAR PREFERÊNCIAS AO ABRIR ---

// Modo Escuro Inteligente
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
  document.body.classList.add('dark-mode');
  themeToggle.innerText = '☀️ Claro';
} else {
  document.body.classList.remove('dark-mode');
  themeToggle.innerText = '🌙 Escuro';
}

// Formato 
if (localStorage.getItem('savedFormat')) {
  formatSelect.value = localStorage.getItem('savedFormat');
}

// Botão do Highlight
if (localStorage.getItem('savedToggle') !== null) {
  highlightToggle.checked = localStorage.getItem('savedToggle') === 'true';
}

// Cor do Highlight
if (localStorage.getItem('savedColor')) {
  highlightColor.value = localStorage.getItem('savedColor');
}


// --- 2. SALVAR PREFERÊNCIAS QUANDO O USUÁRIO ALTERAR ---

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    themeToggle.innerText = '☀️ Claro';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.innerText = '🌙 Escuro';
    localStorage.setItem('theme', 'light');
  }
});

formatSelect.addEventListener('change', () => {
  localStorage.setItem('savedFormat', formatSelect.value);
});

highlightToggle.addEventListener('change', () => {
  localStorage.setItem('savedToggle', highlightToggle.checked);
});

highlightColor.addEventListener('input', () => {
  localStorage.setItem('savedColor', highlightColor.value);
});


// --- 3. AÇÃO DO BOTÃO "EXTRAIR E COPIAR" ---
copyBtn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const userSettings = {
    format: formatSelect.value,
    useHighlight: highlightToggle.checked,
    highlightColorHex: highlightColor.value + '66' 
  };

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractAndHighlightLinks,
    args: [userSettings]
  }, async (results) => {
    if (results && results[0] && results[0].result) {
      const extractedText = results[0].result;
      
      previewBox.value = extractedText;
      
      try {
        await navigator.clipboard.writeText(extractedText);
        statusText.style.color = "#10b981"; // Verde
        statusText.innerText = "Extraído e Copiado!";
        setTimeout(() => { statusText.innerText = ""; }, 3000);
      } catch (err) {
        statusText.style.color = "red";
        statusText.innerText = "Erro ao copiar.";
      }
    } else {
      statusText.style.color = "var(--text-muted)";
      statusText.innerText = "Nenhum link útil encontrado.";
      previewBox.value = "";
    }
  });
});


// --- 4. AÇÃO DO BOTÃO "LIMPAR" ---
clearBtn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: clearAllHighlights
  });

  previewBox.value = "";
  statusText.style.color = "var(--text-muted)";
  statusText.innerText = "Tela e Preview limpos.";
  setTimeout(() => { 
    statusText.innerText = ""; 
    statusText.style.color = "#10b981";
  }, 2000);
});


// --- 5. FUNÇÕES QUE RODAM DENTRO DA PÁGINA WEB ---

// Função de Limpeza da Tela
function clearAllHighlights() {
  const allLinks = document.querySelectorAll('a');
  allLinks.forEach(link => link.style.backgroundColor = '');
}

// Função de Extração e Realce
function extractAndHighlightLinks(settings) {
  const contentArea = document.querySelector('article') || 
                      document.querySelector('main') || 
                      document.querySelector('#bodyContent') || 
                      document.body;

  const links = contentArea.querySelectorAll('a');
  let finalList = "";

  // Limpa realces anteriores antes de aplicar novos
  links.forEach(link => link.style.backgroundColor = '');

  links.forEach(link => {
    const taNoLugarErrado = link.closest('nav, footer, header, aside, .menu, #footer, .sidebar, .ambox, .mw-editsection, .navbox, .infobox, .metadata');
    if (taNoLugarErrado) return; 

    let text = link.innerText.trim();
    const url = link.href;

    // Máquina de lavar texto (Remove lixos invisíveis)
    if (text.startsWith('!')) return;
    text = text.replace(/!.*/g, ""); 
    text = text.replace(/fontes em língua.*/gi, "");
    text = text.replace(/artigos em.*/gi, "");
    text = text.trim();

    if (!text || text === "" || text === "[]") return;

    // Filtro de palavras irrelevantes
    const palavrasProibidas = ['termos', 'privacidade', 'sobre', 'contato', 'entrar', 'login', 'política'];
    const temPalavraProibida = palavrasProibidas.some(palavra => {
      return text.toLowerCase().includes(palavra) && text.length < 15;
    });
    if (temPalavraProibida) return;

    // Regra Final: Se é um link válido, formata de acordo com o usuário
    if (text.length > 1 && url.startsWith('http')) {
      
      if (settings.format === "markdown") {
        finalList += `- [${text}](${url})\n`;
      } else if (settings.format === "urls") {
        finalList += `${url}\n`;
      } else if (settings.format === "text") {
        finalList += `${text} - ${url}\n`;
      }
      
      // Aplica o realce de cor se estiver ativado
      if (settings.useHighlight) {
        link.style.backgroundColor = settings.highlightColorHex;
        link.style.transition = 'background-color 0.3s';
      }
    }
  });

  return finalList;
}