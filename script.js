// Pixel Runner - minimal endless runner
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

let gameSpeed = 3;
let gravity = 0.8;
let score = 0;
let running = true;

const player = {
  x: 60,
  y: H - 60,
  w: 28,
  h: 28,
  vy: 0,
  jumpPower: -14,
  grounded: false,
  color: '#7cf2b3'
};

const obstacles = [];
let spawnTimer = 0;
let spawnInterval = 90; // frames

function resetGame() {
  obstacles.length = 0;
  gameSpeed = 3;
  score = 0;
  spawnTimer = 0;
  player.y = H - 60;
  player.vy = 0;
  running = true;
  document.getElementById('score').innerText = 'Score: 0';
  loop();
}

function spawnObstacle() {
  const h = 20 + Math.random()*40;
  const w = 12 + Math.random()*28;
  obstacles.push({
    x: W + 10,
    y: H - h - 30,
    w, h,
    color: '#ff6b6b'
  });
}

function update() {
  // player physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y + player.h >= H - 30) {
    player.y = H - 30 - player.h;
    player.vy = 0;
    player.grounded = true;
  } else player.grounded = false;

  // spawn obstacles
  spawnTimer++;
  if (spawnTimer > spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
    // slowly increase difficulty
    if (spawnInterval > 45) spawnInterval -= 1;
    gameSpeed += 0.08;
  }

  // update obstacles
  for (let i = obstacles.length-1; i>=0; i--) {
    const ob = obstacles[i];
    ob.x -= gameSpeed;
    if (ob.x + ob.w < -50) obstacles.splice(i,1);
    // collision
    if (player.x < ob.x + ob.w &&
        player.x + player.w > ob.x &&
        player.y < ob.y + ob.h &&
        player.y + player.h > ob.y) {
      running = false;
    }
  }

  // score (distance based)
  score += 0.05 * gameSpeed;
  document.getElementById('score').innerText = 'Score: ' + Math.floor(score);
}

function drawGrid() {
  ctx.fillStyle = '#071423';
  ctx.fillRect(0,0,W,H);
  // ground
  ctx.fillStyle = '#091a2a';
  ctx.fillRect(0,H-30,W,30);
}

function draw() {
  drawGrid();
  // draw player (pixel style with small shadow)
  ctx.fillStyle = '#052022';
  ctx.fillRect(player.x+2, player.y+6, player.w, player.h);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // obstacles
  for (const ob of obstacles) {
    ctx.fillStyle = '#052022';
    ctx.fillRect(ob.x+2, ob.y+4, ob.w, ob.h);
    ctx.fillStyle = ob.color;
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // simple floating HUD on canvas (optional)
}

function loop() {
  if (!running) {
    draw();
    showGameOver();
    return;
  }
  update();
  draw();
  requestAnimationFrame(loop);
}

function showGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '28px monospace';
  ctx.fillText('GAME OVER', W/2, H/2 - 10);
  ctx.font = '16px monospace';
  ctx.fillText('Presiona R para reiniciar', W/2, H/2 + 20);
}

// controls
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (player.grounded) {
      player.vy = player.jumpPower;
      player.grounded = false;
    }
  } else if (e.key.toLowerCase() === 'r') {
    resetGame();
  }
});

// touch support
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (player.grounded) player.vy = player.jumpPower;
}, {passive:false});

// start
loop();
