/* global Telegram, Phaser */

/* ---------- Game configuration ---------- */
const config = {
  type: Phaser.AUTO,
  parent: 'gameCanvas',         // attach to <canvas id="gameCanvas">
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } }
  },
  scene: { preload, create, update }
};

let player;
let cursors;
let coins;
let score  = 0;
let lives  = 3;
let level  = 1;
let scoreText, livesText;

/* ---------- Pre-load assets ---------- */
function preload () {
  this.load.image('bg',          'assets/bg_sewer.png');
  this.load.spritesheet('poopIdle', 'assets/poop_idle.png', { frameWidth: 96, frameHeight: 96 });
  this.load.spritesheet('poopRunL','assets/poop_run_left.png',  { frameWidth: 96, frameHeight: 96 });
  this.load.spritesheet('poopRunR','assets/poop_run_right.png', { frameWidth: 96, frameHeight: 96 });
  this.load.image('coinPos',  'assets/coin_pos.png');
  this.load.image('coinPepe', 'assets/coin_pepe.png');
}

/* ---------- Create once ---------- */
function create () {
  /* Background */
  this.add.image(0, 0, 'bg').setOrigin(0);

  /* Animations */
  this.anims.create({ key: 'idle',  frames: this.anims.generateFrameNumbers('poopIdle', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });
  this.anims.create({ key: 'runL',  frames: this.anims.generateFrameNumbers('poopRunL', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
  this.anims.create({ key: 'runR',  frames: this.anims.generateFrameNumbers('poopRunR', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });

  /* Player sprite */
  player = this.physics.add.sprite(400, 520, 'poopIdle').play('idle');
  player.setCollideWorldBounds(true);

  /* Groups */
  coins = this.physics.add.group();

  /* UI text */
  scoreText = this.add.text(10, 10, 'Score: 0', { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });
  livesText = this.add.text(10, 40, 'Lives: 3', { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });

  /* Input */
  cursors = this.input.keyboard.createCursorKeys();

  /* Spawn coins timer */
  this.time.addEvent({
    delay: 900,
    loop: true,
    callback: dropCoin,
    callbackScope: this
  });

  /* Collect overlap */
  this.physics.add.overlap(player, coins, collectCoin, null, this);
}

/* ---------- Update loop ---------- */
function update () {
  if (cursors.left.isDown) {
    player.x -= 4;
    player.play('runL', true);
  } else if (cursors.right.isDown) {
    player.x += 4;
    player.play('runR', true);
  } else {
    player.play('idle', true);
  }

  /* Increase difficulty each 500 pts */
  level = Math.floor(score / 500) + 1;
}

/* ---------- Spawn a coin ---------- */
function dropCoin () {
  const key = Phaser.Math.RND.pick(['coinPos', 'coinPepe']);
  const x   = Phaser.Math.Between(32, 768);
  const coin = coins.create(x, -32, key);
  coin.body.setVelocityY(150 + level * 25);
}

/* ---------- Collect coin callback ---------- */
function collectCoin (_player, coin) {
  if (coin.texture.key === 'coinPos') {
    score += 10;
    scoreText.setText('Score: ' + score);
  } else {
    lives -= 1;
    livesText.setText('Lives: ' + lives);
    if (lives <= 0) return endGame.call(this);
  }
  coin.destroy();
}

/* ---------- End / Game-Over ---------- */
function endGame () {
  this.scene.pause();
  sendScore(score);
  this.add.text(300, 300, 'GAME OVER', { fontFamily:'Arial', fontSize:48, color:'#ff0000' }).setOrigin(0.5);
}

/* ---------- Send score to Telegram ---------- */
function sendScore (finalScore) {
  if (window.Telegram && Telegram.WebApp && Telegram.WebApp.postEvent) {
    Telegram.WebApp.postEvent('score:' + finalScore);
  }
}

/* ---------- Boot the game ---------- */
new Phaser.Game(config);
