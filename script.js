const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
menu?.addEventListener("click", () => nav.classList.toggle("open"));

const modal = document.querySelector("#modal");
const modalContent = document.querySelector("#modal-content");
const close = document.querySelector(".close");

const docs = {
  arquivo1: {
    title: "RELATÓRIO 001",
    body: `<p><b>STATUS:</b> parcialmente recuperado</p>
    <p>Um símbolo vermelho foi encontrado em diferentes pontos relacionados aos desaparecimentos. Nenhum registro oficial associa o desenho a uma organização conhecida.</p>
    <p>Há uma palavra que aparece em três documentos: <span class="redacted">MARTÍRIO</span>.</p>`
  },
  arquivo2: {
    title: "TESTEMUNHA 07",
    body: `<p>O depoimento foi registrado após a testemunha abandonar o local.</p>
    <p>“Eles diziam que não era uma religião. Diziam que era uma família. E que a família precisava provar o quanto estava disposta a sofrer.”</p>
    <p><b>Observação:</b> demais informações removidas.</p>`
  },
  arquivo3: {
    title: "CAIO // ACESSO RESTRITO",
    body: `<p><b>ARQUIVO CLASSIFICADO</b></p>
    <p>Nome: Caio</p>
    <p>Relação com o culto: <span class="redacted">FUNDADOR</span></p>
    <p>Os registros encontrados sugerem que determinados rituais dependem de pessoas que possuem um vínculo profundo com o fundador.</p>
    <p>O restante deste arquivo permanece bloqueado.</p>`
  }
};

document.querySelectorAll(".archive-card").forEach(card => {
  card.addEventListener("click", () => {
    const doc = docs[card.dataset.modal];
    modalContent.innerHTML = `<h2>${doc.title}</h2>${doc.body}`;
    modal.classList.add("open");
  });
});
close?.addEventListener("click", () => modal.classList.remove("open"));
modal?.addEventListener("click", e => {
  if (e.target === modal) modal.classList.remove("open");
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.classList.remove("open");
});

// Contagem regressiva de ambientação: 30 minutos a partir do primeiro carregamento.
// Para usar em uma sessão real, substitua o valor abaixo por uma data/hora definida pelo mestre.
const end = Date.now() + 30 * 60 * 1000;
function tick(){
  const left = Math.max(0, end - Date.now());
  const s = Math.floor(left/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  document.querySelector("#hours").textContent = String(h).padStart(2,"0");
  document.querySelector("#minutes").textContent = String(m).padStart(2,"0");
  document.querySelector("#seconds").textContent = String(sec).padStart(2,"0");
}
tick(); setInterval(tick,1000);

// Acesso jogador / mestre
const roleGate = document.querySelector('#role-gate');
const masterPanel = document.querySelector('#master-panel');
const exitMaster = document.querySelector('#exit-master');
const playerOnly = document.querySelector('#pistas-mestre');
const REVEAL_PREFIX = 'filhos_martirio_reveal_';
const roleButtons = document.querySelectorAll('.role-button');

// Estado do cronômetro é local ao navegador. Isso mantém o painel do mestre fora da tela do jogador.
const TIMER_KEY = 'filhos_martirio_timer_end';
const TIMER_PAUSED_KEY = 'filhos_martirio_timer_paused';
let timerEnd = Number(localStorage.getItem(TIMER_KEY)) || (Date.now() + 30 * 60 * 1000);
let timerPaused = localStorage.getItem(TIMER_PAUSED_KEY) === 'true';

function formatTimer(ms){
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function getRemaining(){
  return timerPaused ? Math.max(0, Number(localStorage.getItem('filhos_martirio_timer_remaining')) || 0) : Math.max(0, timerEnd - Date.now());
}
function updatePlayerTimer(){
  const left = getRemaining();
  const total = Math.floor(left / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const hours = document.querySelector('#hours');
  const minutes = document.querySelector('#minutes');
  const seconds = document.querySelector('#seconds');
  if(hours) hours.textContent = String(h).padStart(2,'0');
  if(minutes) minutes.textContent = String(m).padStart(2,'0');
  if(seconds) seconds.textContent = String(sec).padStart(2,'0');
}
function updateMasterTimer(){
  const el = document.querySelector('#master-timer');
  if(el) el.textContent = formatTimer(getRemaining());
}
function saveTimerRemaining(ms){
  localStorage.setItem('filhos_martirio_timer_remaining', String(Math.max(0, ms)));
}

function startTimer(){
  const remaining = timerPaused ? (Number(localStorage.getItem('filhos_martirio_timer_remaining')) || 0) : getRemaining();
  timerPaused = false;
  timerEnd = Date.now() + remaining;
  localStorage.setItem(TIMER_KEY, String(timerEnd));
  localStorage.setItem(TIMER_PAUSED_KEY, 'false');
  localStorage.removeItem('filhos_martirio_timer_remaining');
}
function pauseTimer(){
  const remaining = getRemaining();
  saveTimerRemaining(remaining);
  timerPaused = true;
  localStorage.setItem(TIMER_PAUSED_KEY, 'true');
}
function resetTimer(){
  const min = Math.max(0, Number(document.querySelector('#timer-minutes')?.value || 30));
  const sec = Math.min(59, Math.max(0, Number(document.querySelector('#timer-seconds')?.value || 0)));
  const remaining = (min * 60 + sec) * 1000;
  timerPaused = true;
  saveTimerRemaining(remaining);
  localStorage.setItem(TIMER_PAUSED_KEY, 'true');
  timerEnd = Date.now() + remaining;
  localStorage.setItem(TIMER_KEY, String(timerEnd));
}

roleButtons.forEach(btn => btn.addEventListener('click', () => {
  const role = btn.dataset.role;
  roleGate.classList.add('hidden');
  if(role === 'master'){
    masterPanel.classList.add('open');
    masterPanel.setAttribute('aria-hidden','false');
    updateMasterTimer();
  } else {
    masterPanel.classList.remove('open');
    updateRevealedClues();
  }
}));
exitMaster?.addEventListener('click', () => {
  masterPanel.classList.remove('open');
  masterPanel.setAttribute('aria-hidden','true');
  playerOnly?.classList.remove('visible');
});

document.querySelector('#timer-start')?.addEventListener('click', startTimer);
document.querySelector('#timer-pause')?.addEventListener('click', pauseTimer);
document.querySelector('#timer-reset')?.addEventListener('click', resetTimer);

function updateRevealedClues(){
  let any = false;
  document.querySelectorAll('[data-clue]').forEach(box => {
    const id = box.dataset.clue;
    const revealed = localStorage.getItem(REVEAL_PREFIX + id) === 'true';
    box.checked = revealed;
    const card = document.getElementById(id);
    if(card) card.style.display = revealed ? '' : 'none';
    any = any || revealed;
  });
  if(playerOnly) playerOnly.classList.toggle('visible', any);
}

document.querySelectorAll('[data-clue]').forEach(box => {
  box.addEventListener('change', () => {
    const id = box.dataset.clue;
    localStorage.setItem(REVEAL_PREFIX + id, String(box.checked));
    const card = document.getElementById(id);
    const preview = document.querySelector('#clue-preview');
    if(card && box.checked){
      if(preview) preview.textContent = card.querySelector('p')?.textContent || 'Pista revelada.';
    } else if(preview){
      preview.textContent = 'Selecione uma pista para visualizar sua informação.';
    }
    updateRevealedClues();
  });
});
updateRevealedClues();

// Atualiza o cronômetro continuamente e sincroniza entre abas do mesmo navegador.
setInterval(() => {
  if(!timerPaused && getRemaining() <= 0){
    timerPaused = true;
    saveTimerRemaining(0);
    localStorage.setItem(TIMER_PAUSED_KEY, 'true');
  }
  updatePlayerTimer();
  updateMasterTimer();
}, 250);
window.addEventListener('storage', () => {
  timerEnd = Number(localStorage.getItem(TIMER_KEY)) || timerEnd;
  timerPaused = localStorage.getItem(TIMER_PAUSED_KEY) === 'true';
  updatePlayerTimer();
  updateMasterTimer();
});

// Faz o símbolo funcionar mesmo se ele tiver sido enviado à raiz do GitHub em vez de /assets.
document.querySelectorAll('img[src="simbolo-culto.jpg"]').forEach(img => {
  img.addEventListener('error', () => { img.src = 'assets/simbolo-culto.jpg'; }, { once:true });
});
