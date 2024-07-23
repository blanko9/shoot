const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let points = 0;
let bulletDamage = 1;
let bulletSpeed = 7;
let playerSpeed = 5;
let maxBullets = 1;
let health = 3;
let gameOver = false;

class Player {
  constructor() {
    this.width = 50;
    this.height = 50;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2 - this.height / 2;
    this.speed = playerSpeed;
    this.dx = 0;
    this.dy = 0;
  }

  draw() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;

    if (this.x < 0) {
      this.x = 0;
    }

    if (this.x + this.width > canvas.width) {
      this.x = canvas.width - this.width;
    }

    if (this.y < 0) {
      this.y = 0;
    }

    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
    }
  }

  setDirection(dx, dy) {
    this.dx = dx * this.speed;
    this.dy = dy * this.speed;
  }

  shoot(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    for (let i = 0; i < maxBullets; i++) {
      const bullet = new Bullet(this.x + this.width / 2, this.y + this.height / 2, angle + (i * 0.1 - (maxBullets - 1) * 0.05), bulletSpeed);
      bullets.push(bullet);
    }
  }
}

class Bullet {
  constructor(x, y, angle, speed) {
    this.width = 5;
    this.height = 10;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
  }

  draw() {
    ctx.fillStyle = 'red';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  outOfBounds() {
    return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
  }
}

class Enemy {
  constructor(x, y, health = 1, speed = 2) {
    this.width = 30;
    this.height = 30;
    this.x = x;
    this.y = y;
    this.health = health;
    this.speed = speed;
  }

  draw() {
    ctx.fillStyle = this.health > 1 ? 'darkgreen' : 'green';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update(playerX, playerY) {
    const angle = Math.atan2(playerY - this.y, playerX - this.x);
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
  }
}

class Boss extends Enemy {
  constructor(x, y) {
    super(x, y, 20, 1); // Increased health and reduced speed
    this.width = 60;
    this.height = 60;
    this.shootInterval = setInterval(() => this.shoot(player.x, player.y), 2000); // Boss shoots every 2 seconds
  }

  draw() {
    ctx.fillStyle = 'purple';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  shoot(targetX, targetY) {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const bullet = new Bullet(this.x + this.width / 2, this.y + this.height / 2, angle, 5); // Boss bullet speed is 5
    bossBullets.push(bullet);
  }

  destroy() {
    clearInterval(this.shootInterval);
  }
}

const player = new Player();
const bullets = [];
const bossBullets = [];
const enemies = [];
let bossSpawned = false;

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = 0;
    y = Math.random() * canvas.height;
  } else if (edge === 1) {
    x = canvas.width;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = 0;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height;
  }
  const enemy = new Enemy(x, y, Math.random() > 0.8 ? 3 : 1);
  enemies.push(enemy);
}

function spawnBoss() {
  if (!bossSpawned) {
    const x = Math.random() > 0.5 ? 0 : canvas.width;
    const y = Math.random() * canvas.height;
    const boss = new Boss(x, y);
    enemies.push(boss);
    bossSpawned = true;
  }
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function update() {
  if (gameOver) return;

  clear();
  player.move();
  player.draw();
  bullets.forEach((bullet, bulletIndex) => {
    bullet.update();
    bullet.draw();
    if (bullet.outOfBounds()) {
      bullets.splice(bulletIndex, 1);
    } else {
      enemies.forEach((enemy, enemyIndex) => {
        if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
          enemy.health -= bulletDamage;
          if (enemy.health <= 0) {
            enemies.splice(enemyIndex, 1);
            points += enemy instanceof Boss ? 100 : 10;
            if (enemy instanceof Boss) {
              bossSpawned = false;
              enemy.destroy();
            }
          }
          bullets.splice(bulletIndex, 1);
        }
      });
    }
  });

  bossBullets.forEach((bullet, bulletIndex) => {
    bullet.update();
    bullet.draw();
    if (bullet.outOfBounds()) {
      bossBullets.splice(bulletIndex, 1);
    } else {
      if (bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y) {
        health -= 1;
        bossBullets.splice(bulletIndex, 1);
        if (health <= 0) {
          gameOver = true;
          alert(`Game Over! You scored ${points} points.`);
        }
      }
    }
  });

  enemies.forEach((enemy) => {
    enemy.update(player.x + player.width / 2, player.y + player.height / 2);
    enemy.draw();
    if (enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y) {
      health -= 1;
      enemies.splice(enemies.indexOf(enemy), 1);
      if (health <= 0) {
        gameOver = true;
        alert(`Game Over! You scored ${points} points.`);
      }
    }
  });

  drawHealth();
  drawPoints();

  requestAnimationFrame(update);
}

function drawHealth() {
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Health: ${health}`, 10, 30);
}

function drawPoints() {
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Points: ${points}`, 10, 50);
}

function keyDown(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.setDirection(1, player.dy / player.speed);
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.setDirection(-1, player.dy / player.speed);
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    player.setDirection(player.dx / player.speed, -1);
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    player.setDirection(player.dx / player.speed, 1);
  } else if (e.key === 'b') {
    openShop();
  }
}

function keyUp(e) {
  if (e.key === 'ArrowRight' || e.key === 'd') {
    player.setDirection(0, player.dy / player.speed);
  } else if (e.key === 'ArrowLeft' || e.key === 'a') {
    player.setDirection(0, player.dy / player.speed);
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    player.setDirection(player.dx / player.speed, 0);
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    player.setDirection(player.dx / player.speed, 0);
  }
}

function mouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const targetX = e.clientX - rect.left;
  const targetY = e.clientY - rect.top;
  player.shoot(targetX, targetY);
}

function openShop() {
  const shopOptions = `
1. Increase Bullet Damage (50 points)
2. Increase Bullet Speed (50 points)
3. Increase Player Speed (50 points)
4. Increase Max Bullets (50 points)
5. Increase Health (50 points)
6. Multi-Directional Shooting (100 points)
Please enter the number of your choice: `;
  const choice = prompt(shopOptions);

  if (choice === '1' && points >= 50) {
    bulletDamage += 1;
    points -= 50;
    alert('Bullet damage increased!');
  } else if (choice === '2' && points >= 50) {
    bulletSpeed += 2;
    points -= 50;
    alert('Bullet speed increased!');
  } else if (choice === '3' && points >= 50) {
    playerSpeed += 1;
    player.speed = playerSpeed;
    points -= 50;
    alert('Player speed increased!');
  } else if (choice === '4' && points >= 50) {
    maxBullets += 1;
    points -= 50;
    alert('Max bullets increased!');
  } else if (choice === '5' && points >= 50) {
    health += 1;
    points -= 50;
    alert('Health increased!');
  } else if (choice === '6' && points >= 100) {
    maxBullets += 4;
    points -= 100;
    alert('Multi-directional shooting unlocked!');
  } else {
    alert('Not enough points or invalid choice!');
  }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
canvas.addEventListener('mousedown', mouseDown);

let spawnInterval = 2000;
setInterval(() => {
  spawnEnemy();
  if (spawnInterval > 500) {
    spawnInterval -= 100;
  }
  if (Math.random() > 0.9) {
    spawnBoss();
  }
}, spawnInterval);

update();
