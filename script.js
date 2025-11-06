const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('playBtn');
const exitBtn = document.getElementById('exitBtn');
const backBtn = document.getElementById('backBtn');
const menu = document.getElementById('menu');
const goodbye = document.getElementById('goodbye');
const bgMusic = document.getElementById('bgMusic');

// Game state
let player, obstacles, score, running, spawnTimer, speed;
let jumpSfx = null;

// Optionally create a small jump sound using WebAudio (retro beep) for instant effect
try {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playJumpBeep(){
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 800;
    o.connect(g);
    g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    o.stop(audioCtx.currentTime + 0.13);
  }
  jumpSfx = playJumpBeep;
} catch(e){ console.log('WebAudio no disponible', e) }

// Initialize sizes (optional responsive)
canvas.width = 900;
canvas.height = 380;

// Menu button behaviors
playBtn.addEventListener('click', ()=>{
  // fade out menu, show canvas and start music (without restarting music if already playing)
  menu.classList.add('hidden');
  goodbye.classList.add('hidden');
  canvas.style.display = 'block';
  if (bgMusic.paused) {
    // some browsers require interaction: play after click
    bgMusic.play().catch(()=>{ /* autoplay blocked until user interacts */ });
  }
  startGame();
});

exitBtn.addEventListener('click', ()=>{
  // stop music and show goodbye panel
  if (!bgMusic.paused) bgMusic.pause();
  menu.classList.add('hidden');
  canvas.style.display = 'none';
  goodbye.classList.remove('hidden');
});

backBtn && backBtn.addEventListener('click', ()=>{
  goodbye.classList.add('hidden');
  menu.classList.remove('hidden');
});

// Key controls
document.addEventListener('keydown', (e)=>{
  if (e.code === 'Space') {
    if (running && player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
      if (jumpSfx) jumpSfx();
    }
  }
  if (e.code === 'KeyM') {
    // toggle music
    if (bgMusic.paused) bgMusic.play(); else bgMusic.pause();
  }
  if (e.code === 'KeyQ') {
    // quick exit to menu
    running = false;
    canvas.style.display = 'none';
    menu.classList.remove('hidden');
  }
  if (e.code === 'Enter' && !running) {
    // restart from game over
    startGame();
  }
});

function startGame(){
  // reset state
  player = { x:70, y:300, w:28, h:28, vy:0, gravity:0.9, jumpPower:-14, onGround:true };
  obstacles = [];
  score = 0;
  speed = 4;
  spawnTimer = 0;
  running = true;
  requestAnimationFrame(loop);
}

// spawn obstacles with progressive difficulty
function spawnObstacle(){
  const h = 18 + Math.random()*40;
  const w = 12 + Math.random()*30;
  obstacles.push({ x: canvas.width + 20, y: canvas.height - 30 - h, w, h, color:'#ff4d6d' });
}

// main loop
function loop(){
  if (!running) { showGameOver(); return; }
  update();
  draw();
  requestAnimationFrame(loop);
}

function update(){
  // physics
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y + player.h >= canvas.height - 30){
    player.y = canvas.height - 30 - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // spawn logic
  spawnTimer++;
  if (spawnTimer > Math.max(30, 90 - Math.floor(score/100))){
    spawnObstacle();
    spawnTimer = 0;
    speed += 0.06;
  }

  // move obstacles and check collisions
  for (let i = obstacles.length-1; i>=0; i--){
    obstacles[i].x -= speed;
    // collision
    if (player.x < obstacles[i].x + obstacles[i].w &&
        player.x + player.w > obstacles[i].x &&
        player.y < obstacles[i].y + obstacles[i].h &&
        player.y + player.h > obstacles[i].y){
      running = false;
      if (!bgMusic.paused) bgMusic.pause();
    }
    if (obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
  }

  // score increments by time and speed
  score += 0.2 * (speed/3);
}

function draw(){
  // background
  // draw gradient sky
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,'#08121a');
  g.addColorStop(1,'#021018');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // fake distant skyline (pixel blocks)
  for (let x=0;x<canvas.width;x+=18){
    const h = 20 + Math.abs(Math.sin((x + Date.now()/80)/60))*60;
    ctx.fillStyle = '#03151a';
    ctx.fillRect(x, canvas.height - (h/6) - 80, 12, h/6);
  }

  // ground
  ctx.fillStyle = '#050d10';
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

  // player shadow and block
  ctx.fillStyle = '#001012';
  ctx.fillRect(player.x + 3, player.y + 6, player.w, player.h);
  ctx.fillStyle = '#00ffd5';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // obstacles
  for (let ob of obstacles){
    ctx.fillStyle = '#22020a';
    ctx.fillRect(ob.x + 3, ob.y + 4, ob.w, ob.h);
    ctx.fillStyle = ob.color;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // UI - score
  ctx.fillStyle = '#c9fff2';
  ctx.font = '18px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 12, 24);
  ctx.fillText('M = Música  Q = Salir', canvas.width - 260, 24);
}

function showGameOver(){
  // dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#ff4d6d';
  ctx.font = '28px monospace';
  ctx.fillText('GAME OVER', canvas.width/2 - 110, canvas.height/2 - 10);
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText('ENTER = Reiniciar   Q = Salir al menú', canvas.width/2 - 190, canvas.height/2 + 20);
}
