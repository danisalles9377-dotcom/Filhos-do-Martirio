const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

// ===== Navegação e modais =====
const menu = $('.menu-toggle');
const nav = $('#nav');
menu?.addEventListener('click', () => nav.classList.toggle('open'));

const modal = $('#modal');
const modalContent = $('#modal-content');
const close = $('.close');
const docs = {
  arquivo1: {title:'RELATÓRIO 001', body:`<p><b>STATUS:</b> parcialmente recuperado</p><p>Um símbolo vermelho foi encontrado em diferentes pontos relacionados aos desaparecimentos. Nenhum registro oficial associa o desenho a uma organização conhecida.</p><p>Há uma palavra que aparece em três documentos: <span class="redacted">MARTÍRIO</span>.</p>`},
  arquivo2: {title:'TESTEMUNHA 07', body:`<p>O depoimento foi registrado após a testemunha abandonar o local.</p><p>“Eles diziam que não era uma religião. Diziam que era uma família. E que a família precisava provar o quanto estava disposta a sofrer.”</p><p><b>Observação:</b> demais informações removidas.</p>`},
  arquivo3: {title:'CAIO // ACESSO RESTRITO', body:`<p><b>ARQUIVO CLASSIFICADO</b></p><p>Nome: Caio</p><p>Relação com o culto: <span class="redacted">FUNDADOR</span></p><p>Os registros encontrados sugerem que determinados rituais dependem de pessoas que possuem um vínculo profundo com o fundador.</p><p>O restante deste arquivo permanece bloqueado.</p>`}
};
$$('.archive-card').forEach(card => card.addEventListener('click',()=>{const d=docs[card.dataset.modal]; modalContent.innerHTML=`<h2>${d.title}</h2>${d.body}`; modal.classList.add('open');}));
close?.addEventListener('click',()=>modal.classList.remove('open'));
modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open')});

// ===== Sessão online (PeerJS) =====
const PEERJS_URL='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
let peer=null, hostConn=null, playerConnections=[], isMaster=false, roomCode='', online=false;
let sessionState={reveals:{clue1:false,clue2:false,clue3:false},timer:{remaining:1800000,running:false,endAt:null}};

function loadPeerJS(){return new Promise((resolve,reject)=>{if(window.Peer)return resolve();const s=document.createElement('script');s.src=PEERJS_URL;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
function codeFromPeer(id){return id.replace(/^FM-/,'').slice(0,8).toUpperCase();}
function setConnectionStatus(text,kind=''){$('#connection-status')?.replaceChildren(document.createTextNode(text)); const el=$('#connection-status'); if(el)el.dataset.state=kind;}
function showRoom(code,role){$$('.room-code').forEach(e=>e.textContent=code||'—'); $$('.session-role').forEach(e=>e.textContent=role||'—');}
function playerCount(){const el=$('#player-count'); if(el)el.textContent=String(playerConnections.filter(c=>c.open).length);}
function broadcast(msg){playerConnections=playerConnections.filter(c=>c && c.open); playerConnections.forEach(c=>{try{c.send({type:'state',state:sessionState});}catch(e){}}); playerCount();}
function currentRemaining(){const t=sessionState.timer; if(!t.running)return Math.max(0,t.remaining); return Math.max(0,t.endAt-Date.now());}
function stateSnapshot(){return JSON.parse(JSON.stringify({...sessionState,timer:{...sessionState.timer,remaining:currentRemaining(),endAt:sessionState.timer.running?sessionState.timer.endAt:null}}));}
function applyState(state){if(!state)return; sessionState=state; renderState();}
function renderTimer(){const ms=currentRemaining(); const total=Math.ceil(ms/1000); const h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60; ['hours','minutes','seconds'].forEach((id,i)=>{const el=$('#'+id); if(el)el.textContent=String([h,m,s][i]).padStart(2,'0')}); const mt=$('#master-timer'); if(mt){const tm=Math.ceil(ms/1000);mt.textContent=`${String(Math.floor(tm/60)).padStart(2,'0')}:${String(tm%60).padStart(2,'0')}`;}}
function renderReveals(){let any=false; ['clue1','clue2','clue3'].forEach(id=>{const on=!!sessionState.reveals[id]; const card=$('#'+id); const check=$(`[data-clue="${id}"]`); if(check)check.checked=on; if(card)card.classList.toggle('revealed',on); any ||= on;}); $('#pistas-mestre')?.classList.toggle('visible',any); $('#player-empty-clues')?.classList.toggle('hidden',any); $$('.reveal-badge').forEach(b=>b.classList.toggle('hidden',!sessionState.reveals[b.dataset.clue]));}
function renderState(){renderTimer();renderReveals();}
function broadcastState(){sessionState=stateSnapshot();broadcast();renderState();}

async function createSession(){
  try{await loadPeerJS();}catch(e){setConnectionStatus('Não foi possível carregar a conexão online.','error');return;}
  if(peer)peer.destroy();
  roomCode=Math.random().toString(36).slice(2,8).toUpperCase();
  peer=new Peer(`FM-${roomCode}`,{debug:0});
  peer.on('open',id=>{online=true;showRoom(roomCode,'MESTRE');setConnectionStatus('Sessão online — compartilhe o código com os jogadores.','ok');$('#master-session')?.classList.add('active');});
  peer.on('connection',conn=>{playerConnections.push(conn); conn.on('open',()=>{conn.send({type:'state',state:stateSnapshot()});playerCount();});conn.on('close',playerCount);conn.on('error',playerCount);});
  peer.on('error',err=>{console.warn(err);setConnectionStatus('Erro na sessão online. Tente criar outra sessão.','error');});
}
async function joinSession(code){
  try{await loadPeerJS();}catch(e){setConnectionStatus('Não foi possível carregar a conexão online.','error');return;}
  roomCode=String(code||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(roomCode.length<4){setConnectionStatus('Digite um código de sessão válido.','error');return;}
  if(peer)peer.destroy();
  peer=new Peer();
  peer.on('open',()=>{hostConn=peer.connect(`FM-${roomCode}`,{reliable:true});hostConn.on('open',()=>{online=true;showRoom(roomCode,'JOGADOR');setConnectionStatus('Conectado à sessão do Mestre.','ok');$('#player-session')?.classList.add('active');});hostConn.on('data',msg=>{if(msg?.type==='state')applyState(msg.state)});hostConn.on('close',()=>{online=false;setConnectionStatus('Conexão com o Mestre perdida.','error');});hostConn.on('error',()=>setConnectionStatus('Não foi possível entrar na sessão.','error'));});
  peer.on('error',()=>setConnectionStatus('Não foi possível encontrar essa sessão. Confira o código.','error'));
}
function leaveOnline(){try{peer?.destroy()}catch(e){} peer=null;hostConn=null;playerConnections=[];online=false;roomCode='';showRoom('—','—');setConnectionStatus('Nenhuma sessão conectada.');playerCount();}

// ===== Cronômetro =====
function startTimer(){if(!isMaster)return;let rem=currentRemaining();sessionState.timer={remaining:rem,running:true,endAt:Date.now()+rem};broadcastState();}
function pauseTimer(){if(!isMaster)return;sessionState.timer={remaining:currentRemaining(),running:false,endAt:null};broadcastState();}
function resetTimer(){if(!isMaster)return;const min=Math.max(0,Number($('#timer-minutes')?.value||30));const sec=Math.min(59,Math.max(0,Number($('#timer-seconds')?.value||0)));sessionState.timer={remaining:(min*60+sec)*1000,running:false,endAt:null};broadcastState();}

// ===== Acesso =====
const roleGate=$('#role-gate'), masterPanel=$('#master-panel');
$$('.role-button').forEach(btn=>btn.addEventListener('click',async()=>{
  const role=btn.dataset.role; isMaster=role==='master'; roleGate.classList.add('hidden');
  if(isMaster){masterPanel.classList.add('open');masterPanel.setAttribute('aria-hidden','false');await createSession();}
  else{masterPanel.classList.remove('open');masterPanel.setAttribute('aria-hidden','true');$('#player-online-entry')?.classList.add('open');}
}));
$('#exit-master')?.addEventListener('click',()=>{masterPanel.classList.remove('open');masterPanel.setAttribute('aria-hidden','true');leaveOnline();});
$('#exit-player')?.addEventListener('click',()=>{leaveOnline();$('#player-online-entry')?.classList.remove('open');roleGate.classList.remove('hidden');});
$('#create-session')?.addEventListener('click',createSession);
$('#join-session')?.addEventListener('click',()=>joinSession($('#join-code')?.value));
$('#copy-room')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomCode);setConnectionStatus('Código copiado!','ok')}catch(e){setConnectionStatus('Código: '+roomCode)}});
$('#timer-start')?.addEventListener('click',startTimer);$('#timer-pause')?.addEventListener('click',pauseTimer);$('#timer-reset')?.addEventListener('click',resetTimer);

$$('[data-clue]').forEach(box=>box.addEventListener('change',()=>{if(!isMaster)return;sessionState.reveals[box.dataset.clue]=box.checked;const p=$('#clue-preview');const card=$('#'+box.dataset.clue);if(p)p.textContent=box.checked?(card?.querySelector('p')?.textContent||'Pista revelada.'):'Selecione uma pista para visualizar sua informação.';broadcastState();if(box.checked)showDiscovery(box.dataset.clue);}));
function showDiscovery(id){const n=$('#discovery');if(!n)return;const names={clue1:'ORIGEM DO SÍMBOLO',clue2:'CAIO E O CULTO',clue3:'CONDIÇÃO DO RITUAL'};$('#discovery-title').textContent='NOVO ARQUIVO DESCOBERTO';$('#discovery-text').textContent=names[id]||'NOVA PISTA';n.classList.add('show');setTimeout(()=>n.classList.remove('show'),4200);}

// Loop online/local
setInterval(()=>{if(sessionState.timer.running && currentRemaining()<=0){sessionState.timer={remaining:0,running:false,endAt:null};if(isMaster)broadcastState();}renderTimer();},250);

// Seção de mapa e conteúdo desbloqueável
$$('[data-map]').forEach(btn=>btn.addEventListener('click',()=>{$$('.map-view').forEach(m=>m.classList.remove('active'));$('#map-'+btn.dataset.map)?.classList.add('active');}));

// Fallback da imagem do símbolo
$$('img[src="simbolo-culto.jpg"]').forEach(img=>img.addEventListener('error',()=>{img.src='assets/simbolo-culto.jpg'},{once:true}));
renderState();
