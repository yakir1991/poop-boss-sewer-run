// main.js  (docs/main.js)

/* ───────── CONFIG ───────── */
const GAME_W = 720, GAME_H = 1280;

/* global tweakables */
const WORLD_GRAVITY   = 600;   // כללי – משפיע על כולם
const COIN_GRAVITY    = 900;   // תאוצת נפילה למטבעות בלבד (px/s²)
const PLAYER_SPEED    = 250;   // אופקי (px/s)
const WORLD_FLOOR_PAD = 100;   // כמה פיקסלים מעל תחתית הקנבס הרצפה הווירטואלית

const config = {
  type   : Phaser.AUTO,
  parent : 'game',
  backgroundColor : '#000000',

  scale : {
    mode       : Phaser.Scale.FIT,
    autoCenter : Phaser.Scale.CENTER_BOTH,
    width      : GAME_W,
    height     : GAME_H
  },

  physics : {
    default : 'arcade',
    arcade  : { gravity:{ y: WORLD_GRAVITY }, debug:false }
  },

  scene : { preload, create, update }
};

/* global variables */
let player, cursors;
let coins;
let dropTimer;
let posScore = 0, scoreText;

/* -------- PRELOAD -------- */
function preload () {
  /* Background image 720×1280 */
  this.load.image('bg', 'assets/bg_sewer.png');

  /* Player sprite‑sheets: each frame 96×192, sheet size 192×192 */
  this.load.spritesheet('poopIdle',  'assets/poop_idle.png',    { frameWidth:96, frameHeight:192 });
  this.load.spritesheet('poopLeft',  'assets/poop_run_left.png', { frameWidth:96, frameHeight:192 });
  this.load.spritesheet('poopRight', 'assets/poop_run_right.png',{ frameWidth:96, frameHeight:192 });

  /* Airdrop God: 128×128 ×4 frames */
  this.load.spritesheet('airdrop', 'assets/airdrop_god.png',
                        { frameWidth:128, frameHeight:128 });

  /* Coins */
  this.load.image('coinPepe', 'assets/coin_pepe.png');
  this.load.image('coinPos',  'assets/coin_pos.png');
}

/* ───────── CREATE ───────── */
function create () {
  const { width, height } = this.scale;

  /* world bounds – הרצפה 100px מעל תחתית, קירות מכל הצדדים */
  this.physics.world.setBounds(0, 0, width, height - WORLD_FLOOR_PAD);
  this.physics.world.setBoundsCollision(true, true, true, true);

  /* full‑screen background */
  this.add.image(width / 2, height / 2, 'bg')
      .setDisplaySize(width, height);

  /* player animations */
  this.anims.create({ key:'idle',  frames:this.anims.generateFrameNumbers('poopIdle',{ start:0,end:1 }), frameRate:4,  repeat:-1 });
  this.anims.create({ key:'left',  frames:this.anims.generateFrameNumbers('poopLeft',{ start:0,end:1 }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'right', frames:this.anims.generateFrameNumbers('poopRight',{ start:0,end:1 }), frameRate:10, repeat:-1 });

  /* player – 300px מעל הרצפה */
  player = this.physics.add.sprite(width / 2, height - WORLD_FLOOR_PAD - 300, 'poopIdle')
                        .play('idle')
                        .setCollideWorldBounds(true);

  cursors = this.input.keyboard.createCursorKeys();

  /* airdrop‑god animation & tween */
  this.anims.create({ key:'godFly', frames:this.anims.generateFrameNumbers('airdrop',{ start:0,end:3 }), frameRate:6, repeat:-1 });

  const god = this.add.sprite(width + 100, 150, 'airdrop')
                   .play('godFly')
                   .setScale(0.8);

  this.tweens.add({ targets:god, x:-100, duration:6000, ease:'Sine.easeInOut', yoyo:true, repeat:-1 });

  /* coins group */
  coins = this.physics.add.group({ defaultKey:'coinPepe', bounceY:0.2 });

  dropTimer = this.time.addEvent({ delay:1000, loop:true, callback:() => dropCoin.call(this, god.x, god.y + 30) });

  /* destroy coins leaving world bounds */
  this.physics.world.on('worldbounds', body => body.gameObject && body.gameObject.destroy());

  /* overlap for coin collection */
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  /* HUD – POS count */
  scoreText = this.add.text(20, 20, 'POS: 0', { font:'40px Impact', fill:'#ffffff' });
}

/* spawn a single coin */
function dropCoin (x, y) {
  const key  = (Math.random() < 0.5) ? 'coinPepe' : 'coinPos';
  const coin = coins.create(x, y, key)
                    .setGravityY(COIN_GRAVITY)           // תאוצה ייחודית למטבעות
                    .setVelocity(Phaser.Math.Between(-80, 80), 0)
                    .setBounce(0.3)
                    .setCollideWorldBounds(false);

  coin.body
      .setSize(64, 64)
      .setOffset(0, 0)
      .setAllowGravity(true)
      .onWorldBounds = true;
}

/* collect coin callback */
function collectCoin (player, coin) {
  if (coin.texture.key === 'coinPos') {
    posScore += 1;
    scoreText.setText('POS: ' + posScore);
  }
  coin.destroy();
}

/* ───────── UPDATE ───────── */
function update () {
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
}

/* ───────── BOOT ───────── */
new Phaser.Game(config);
