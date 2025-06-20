// main.js

/* ───────── CONFIG ───────── */
const GAME_W = 720,
  GAME_H = 1280;

/* global tweakables */
const WORLD_GRAVITY = 400;
const COIN_GRAVITY = 0;
const PLAYER_SPEED = 400;
const WORLD_FLOOR_PAD = 100;
const MAX_LIVES = 3;

/* global variables */
let player, cursors;
let coins;
let dropTimer;
let posScore = 0,
  scoreText;
let lifeIcons = [];
let lives = MAX_LIVES;

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }
  preload() {
    /* Background image 720×1280 */
    this.load.image('bg', 'assets/bg_sewer.png');

    /* Player sprite‑sheets */
    this.load.spritesheet('poopIdle', 'assets/poop_idle.png', {
      frameWidth: 96,
      frameHeight: 192,
    });
    this.load.spritesheet('poopLeft', 'assets/poop_run_left.png', {
      frameWidth: 96,
      frameHeight: 192,
    });
    this.load.spritesheet('poopRight', 'assets/poop_run_right.png', {
      frameWidth: 96,
      frameHeight: 192,
    });

    /* Airdrop God */
    this.load.spritesheet('airdrop', 'assets/airdrop_god.png', {
      frameWidth: 128,
      frameHeight: 128,
    });

    /* Coins */
    this.load.image('coinPepe', 'assets/coin_pepe.png');
    this.load.image('coinPos', 'assets/coin_pos.png');
    this.load.image('life_icon', 'assets/life_icon.png');

    /* Screens */
    this.load.image('tapStart', 'assets/Tap_to_Start.png');
    this.load.image('flushed', 'assets/You’ve_Been_Flushed.png');
  }
  create() {
    this.scene.start('start');
  }
}

class StartScene extends Phaser.Scene {
  constructor() {
    super('start');
  }
  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'tapStart');
    const startGame = () => this.scene.start('game');
    this.input.keyboard.once('keydown', startGame);
    this.input.once('pointerdown', startGame);
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }
  create() {
    const { width, height } = this.scale;

    // reset HUD state on scene start
    lifeIcons = [];
    lives = MAX_LIVES;
    posScore = 0;

    /* world bounds – floor 100px above bottom */
    this.physics.world.setBounds(0, 0, width, height - WORLD_FLOOR_PAD);
    this.physics.world.setBoundsCollision(true, true, true, true);

    /* full‑screen background */
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    /* player animations */
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('poopIdle', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('poopLeft', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('poopRight', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1,
    });

    /* player – 300px above floor */
    player = this.physics.add
      .sprite(width / 2, height - WORLD_FLOOR_PAD - 300, 'poopIdle')
      .play('idle')
      .setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();

    /* airdrop‑god animation & tween */
    this.anims.create({
      key: 'godFly',
      frames: this.anims.generateFrameNumbers('airdrop', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    const god = this.add
      .sprite(width + 100, 150, 'airdrop')
      .play('godFly')
      .setScale(0.8);

    this.tweens.add({
      targets: god,
      x: -100,
      duration: 6000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    /* coins group */
    coins = this.physics.add.group({ defaultKey: 'coinPepe', bounceY: 0.2 });

    dropTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => dropCoin.call(this, god.x, god.y + 30),
    });

    /* destroy coins leaving world bounds */
    this.physics.world.on(
      'worldbounds',
      (body) => body.gameObject && body.gameObject.destroy(),
    );

    /* overlap for coin collection */
    this.physics.add.overlap(player, coins, collectCoin, null, this);

    /* HUD – POS count */
    scoreText = this.add.text(20, 20, 'POS: 0', {
      font: '40px Impact',
      fill: '#ffffff',
    });

    /* HUD – life icons */
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = this.add
        .image(width - 20 - i * 50, 20, 'life_icon')
        .setOrigin(1, 0)
        .setScale(0.6);
      lifeIcons.push(icon);
    }
  }
  update() {
    if (cursors.left.isDown) {
      player.setVelocityX(-PLAYER_SPEED);
      if (player.anims.currentAnim.key !== 'left') player.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(PLAYER_SPEED);
      if (player.anims.currentAnim.key !== 'right') player.play('right', true);
    } else {
      player.setVelocityX(0);
      if (player.anims.currentAnim.key !== 'idle') player.play('idle', true);
    }

    if (lives <= 0) {
      this.scene.start('gameOver');
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('gameOver');
  }
  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'flushed');
    const toStart = () => this.scene.start('start');
    this.input.keyboard.once('keydown', toStart);
    this.input.once('pointerdown', toStart);
  }
}

/* spawn a single coin */
function dropCoin(x, y) {
  const key = Math.random() < 0.5 ? 'coinPepe' : 'coinPos';
  const coin = coins
    .create(x, y, key)
    .setGravityY(COIN_GRAVITY)
    .setVelocity(Phaser.Math.Between(-80, 80), 0)
    .setBounce(0.3)
    .setCollideWorldBounds(false);

  coin.body
    .setSize(64, 64)
    .setOffset(0, 0)
    .setAllowGravity(true).onWorldBounds = true;
}

/* collect coin callback */
function collectCoin(player, coin) {
  if (coin.texture.key === 'coinPos') {
    posScore += 1;
    scoreText.setText('POS: ' + posScore);
  } else if (coin.texture.key === 'coinPepe') {
    if (lives > 0) {
      lifeIcons[MAX_LIVES - lives].setVisible(false);
      lives -= 1;
    }
  }
  coin.destroy();
}

/* ───────── GAME INIT ───────── */
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: WORLD_GRAVITY }, debug: false },
  },
  scene: [BootScene, StartScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
