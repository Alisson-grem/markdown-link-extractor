// === OS DADOS DA SIPAH ===
const listaHabitosDiv = document.getElementById('habits-list');
const barraProgresso = document.getElementById('progressBar');
const botaoReset = document.getElementById('reset-btn');
const botaoNotificacao = document.getElementById('notify-btn');
const settingsHabitsListDiv = document.getElementById('settings-habits-list');

// Carrega os hábitos salvos ou cria os 3 padrões se tiver vazio
let listaHabitos = JSON.parse(localStorage.getItem('listaHabitosConfig')) || [
    { id: 'agua', icon: '💧', text: 'Beber Água' },
    { id: 'leitura', icon: '📚', text: 'Ler 10 pág.' },
    { id: 'alongar', icon: '🧘‍♂️', text: 'Alongar' }
];

let habitos = JSON.parse(localStorage.getItem('meusHabitos')) || {};
let notificouHoje = localStorage.getItem('notificouHoje') === 'true';

// === RENDERIZAR HÁBITOS NA TELA PRINCIPAL ===
function renderizarHabitos() {
    listaHabitosDiv.innerHTML = ''; 
    
    listaHabitos.forEach(habito => {
        const btn = document.createElement('button');
        btn.className = 'habit-btn';
        btn.setAttribute('data-habit', habito.id);
        
        if (habitos[habito.id]) {
            btn.classList.add('completed');
        }

        btn.innerHTML = `
            <span class="icon">${habito.icon}</span>
            <span class="text">${habito.text}</span>
        `;

        btn.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(50);
            
            btn.classList.toggle('completed');
            habitos[habito.id] = btn.classList.contains('completed');
            localStorage.setItem('meusHabitos', JSON.stringify(habitos));
            atualizarProgresso();
        });

        listaHabitosDiv.appendChild(btn);
    });
    atualizarProgresso();
    renderizarListaExcluir(); // Magia nova da Sipah!
}

// === RENDERIZAR LISTA DE EXCLUIR (Nas Configurações) ===
function renderizarListaExcluir() {
    settingsHabitsListDiv.innerHTML = '';
    
    if (listaHabitos.length === 0) {
        settingsHabitsListDiv.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Você não tem nenhum hábito para apagar.</p>';
        return;
    }

    listaHabitos.forEach(habito => {
        const div = document.createElement('div');
        div.className = 'delete-habit-item';
        div.innerHTML = `
            <span>${habito.icon} ${habito.text}</span>
            <button class="delete-btn" title="Apagar hábito">🗑️</button>
        `;

        // O botão da lixeirinha!
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if(confirm(`Tem certeza que quer jogar '${habito.text}' no lixo, humano?`)) {
                excluirHabito(habito.id);
            }
        });

        settingsHabitsListDiv.appendChild(div);
    });
}

// === EXCLUIR HÁBITO ===
function excluirHabito(idParaApagar) {
    // Tira da lista principal
    listaHabitos = listaHabitos.filter(habito => habito.id !== idParaApagar);
    localStorage.setItem('listaHabitosConfig', JSON.stringify(listaHabitos));

    // Apaga o registro dele de "concluído" também
    if (habitos[idParaApagar] !== undefined) {
        delete habitos[idParaApagar];
        localStorage.setItem('meusHabitos', JSON.stringify(habitos));
    }

    renderizarHabitos();
}

// === PROGRESSO E NOTIFICAÇÕES ===
function atualizarProgresso() {
    const total = listaHabitos.length;
    if(total === 0) {
        barraProgresso.style.width = `0%`;
        return;
    }

    const concluidos = Object.values(habitos).filter(status => status === true).length;
    const porcentagem = (concluidos / total) * 100;
    barraProgresso.style.width = `${porcentagem}%`;

    if (porcentagem === 100) {
        enviarNotificacaoParabens();
    }
}

function enviarNotificacaoParabens() {
    if ("Notification" in window && Notification.permission === "granted" && !notificouHoje) {
        new Notification("✨ Uhuu! Trabalho feito!", {
            body: "Você completou todos os mini-hábitos de hoje. Sipah tá orgulhosa!",
            icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
        });
        notificouHoje = true;
        localStorage.setItem('notificouHoje', 'true');
    }
}

if (!("Notification" in window) || Notification.permission === 'granted' || Notification.permission === 'denied') {
    botaoNotificacao.style.display = 'none';
}

botaoNotificacao.addEventListener('click', () => {
    Notification.requestPermission().then(permissao => {
        if (permissao === 'granted') {
            botaoNotificacao.style.display = 'none';
            new Notification("Hmph!", { body: "Sipah tá de olho nos seus hábitos agora!" });
        }
    });
});

// === MODAIS (JANELINHAS) ===
const modalSettings = document.getElementById('settings-modal');
const modalAddHabit = document.getElementById('add-habit-modal');

document.getElementById('settings-btn-pc').addEventListener('click', () => modalSettings.classList.add('show'));
document.getElementById('settings-btn-mobile').addEventListener('click', () => modalSettings.classList.add('show'));
document.getElementById('close-settings-btn').addEventListener('click', () => modalSettings.classList.remove('show'));

document.getElementById('add-btn-mobile').addEventListener('click', () => modalAddHabit.classList.add('show'));
document.getElementById('add-btn-pc').addEventListener('click', () => modalAddHabit.classList.add('show'));
document.getElementById('cancel-habit-btn').addEventListener('click', () => modalAddHabit.classList.remove('show'));

document.getElementById('save-habit-btn').addEventListener('click', () => {
    const icon = document.getElementById('habit-emoji-input').value || '⭐';
    const text = document.getElementById('habit-name-input').value;

    if (text.trim() === '') {
        alert("Hmph! Escreve o nome do hábito, humano preguiçoso!");
        return;
    }

    const id = 'hab_' + Date.now(); 
    listaHabitos.push({ id, icon, text });
    localStorage.setItem('listaHabitosConfig', JSON.stringify(listaHabitos));
    
    document.getElementById('habit-name-input').value = '';
    modalAddHabit.classList.remove('show');
    
    renderizarHabitos();
});


// === MAGIA DO MODO ESCURO E TEMAS ===
let isDark = localStorage.getItem('darkMode') === 'true';
let corTema = localStorage.getItem('corTema') || 'emerald';

function aplicarTema() {
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-btn-pc').innerText = '☀️';
        document.getElementById('theme-btn-mobile').querySelector('.icon').innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('theme-btn-pc').innerText = '🌙';
        document.getElementById('theme-btn-mobile').querySelector('.icon').innerText = '🌙';
    }
    document.body.setAttribute('data-color', corTema);
}

aplicarTema();

function alternarDark() {
    isDark = !isDark;
    localStorage.setItem('darkMode', isDark);
    aplicarTema();
}
document.getElementById('theme-btn-pc').addEventListener('click', alternarDark);
document.getElementById('theme-btn-mobile').addEventListener('click', alternarDark);

document.querySelectorAll('.theme-color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        corTema = e.target.getAttribute('data-setcolor');
        localStorage.setItem('corTema', corTema);
        aplicarTema();
    });
});


// === ZERAR E TEMPO ===
function zerarHabitos() {
    habitos = {};
    localStorage.removeItem('meusHabitos');
    notificouHoje = false;
    localStorage.removeItem('notificouHoje');
    renderizarHabitos();
}

botaoReset.addEventListener('click', () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    zerarHabitos();
    localStorage.setItem('ultimoReset', Date.now());
});

function checarResetAutomatico() {
    const ultimoReset = localStorage.getItem('ultimoReset');
    if (ultimoReset) {
        const agora = Date.now();
        if ((agora - parseInt(ultimoReset)) >= (24 * 60 * 60 * 1000)) {
            zerarHabitos();
            localStorage.setItem('ultimoReset', agora);
        }
    }
}
checarResetAutomatico();


// === LÓGICA DO BOTÃO INVISÍVEL DE INSTALAÇÃO (PWA) ===
let eventoInstalacao;
const botaoInstalarIcone = document.getElementById('install-icon-btn');

window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    eventoInstalacao = evento;
    botaoInstalarIcone.style.display = 'inline-block';
});

botaoInstalarIcone.addEventListener('click', async () => {
    if (!eventoInstalacao) return;
    eventoInstalacao.prompt();
    const resultado = await eventoInstalacao.userChoice;
    if (resultado.outcome === 'accepted') {
        botaoInstalarIcone.style.display = 'none';
    }
    eventoInstalacao = null;
});

window.addEventListener('appinstalled', () => {
    botaoInstalarIcone.style.display = 'none';
});

const alertaSipah = () => alert("Hmph! Sipah ainda vai fazer as estatísticas! Calma!");
document.getElementById('stats-btn-pc').addEventListener('click', alertaSipah);
document.getElementById('stats-btn-mobile').addEventListener('click', alertaSipah);

renderizarHabitos();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(erro => console.log('Falha no ajudante', erro));
    });
}