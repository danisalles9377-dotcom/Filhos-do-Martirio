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
