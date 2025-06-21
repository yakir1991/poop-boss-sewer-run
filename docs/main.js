// main.js
import DebugHudPlugin from './debugHud.js';

// Ensure the game runs inside Telegram WebApp
const tg = window.Telegram && window.Telegram.WebApp;
if (!tg || !tg.initData) {
  alert('Please open this game in Telegram.');
  throw new Error('Not in Telegram WebApp environment');
}
tg.ready();

/* ───────── CONFIG ───────── */
const GAME_W = 720,
  GAME_H = 1280;

/* global tweakables */
const WORLD_GRAVITY = 400;
const COIN_GRAVITY = 0;
const PLAYER_SPEED = 400;
const WORLD_FLOOR_PAD = 100;
const MAX_LIVES = 3;
const FLASH_PAUSE_MS = 1000;

const TAUNTS = [
"POS? You’re not even worthy of being called a shitcoin.",
"I linted your contract and the tool rage-quit.",
"Looks like ChatGPT wrote it... and then disowned it.",
"Your liquidity pool? Shallower than your IQ.",
"Launched on testnet. Still managed to embarrass yourself.",
"Your chart flatlined harder than your hopes.",
"Tried debugging POS… turns out the bug is you.",
"Only bullish thing here is your delusion.",
"My Tamagotchi had more holders than your project.",
"Zoomed into your volume… still saw nothing.",
"You forked a rug and made it worse. Impressive failure.",
"Your roadmap loops like your thought process: nowhere.",
"Simulated your launch… even Excel tapped out.",
"Nice coin. Jenga’s more stable.",
"Your price action looks like post-mortem data.",
"Even my mom rugged faster than you.",
"Your whitepaper reads like fanfic for delusion.",
"Your tokenomics made me physically ill.",
"I’d airdrop your coin just so I could delete it.",
"Layer-1? Bro, you’re Layer-0 of disappointment.",
"You’re the Pluto of crypto—used to matter, now a meme.",
"Your chart looks like my WiFi in a bunker.",
"Your dev team ghosted harder than my ex-WoW guild.",
"MySpace gets more engagement than your Telegram.",
"Ran a regression on POS—output: total bankruptcy.",
"I wouldn’t stake this if it was extra credit.",
"Your project is proof the simulation hates us.",
"Market cap? Imaginary. Like your fanbase.",
"Congrats, you’re everyone’s exit liquidity.",
"Not financial advice, but... uninstall Metamask immediately.",
];

/* global variables */
let player, cursors;
let coins;
let dropTimer;
let posScore = 0,
  scoreText;
let lifeIcons = [];
let lives = MAX_LIVES;
let level = 1;
let coinsPerDrop = 1;
let coinExtraGravity = 0;

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
    this.load.spritesheet('poopHurt', 'assets/poop_hurt.png', {
      frameWidth: 96,
      frameHeight: 192,
    });
    this.load.spritesheet('poopBossJump', 'assets/poop_boss_jump.png', {
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
    this.load.image('levelUp', 'assets/levelup_banner.png');

    /* Audio */
    this.load.audio('bgMusic', 'assets/arcade-beat.ogg');
    this.load.audio('startSound', 'assets/Upper01.ogg');
    this.load.audio('levelUpSound', 'assets/arcade-level-completed.ogg');
    this.load.audio('gameOverSound', 'assets/game_over_1.mp3');
    this.load.audio('penaltySound', 'assets/Downer.ogg');
    this.load.audio('coinSound', 'assets/Coin.ogg');

    /* HUD Icons */
    this.load.image('speakerIcon', 'assets/Speaker_Icons.png');

    /* Screens */
    this.load.image('tapStart', 'assets/Tap_to_Start.png');
    this.load.image('flushed', 'assets/You’ve_Been_Flushed.png');
    this.load.spritesheet('pepeTaunt', 'assets/pepe_taunt.png', {
      frameWidth: 128,
      frameHeight: 384,
    });
    this.load.image('speechBubble', 'assets/speech_bubble.png');
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
    const startGame = () => {
      this.sound.play('startSound');
      this.scene.start('game');
    };
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
    level = 1;
    coinsPerDrop = 1;
    coinExtraGravity = 0;

    /* background music */
    this.bgMusic = this.sound.add('bgMusic', { loop: true });
    this.bgMusic.play();

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
    this.anims.create({
      key: 'hurt',
      frames: this.anims.generateFrameNumbers('poopHurt', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: 'bossJump',
      frames: this.anims.generateFrameNumbers('poopBossJump', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: 'taunt',
      frames: this.anims.generateFrameNumbers('pepeTaunt', { start: 0, end: 2 }),
      frameRate: 6,
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
      callback: () => dropCoins.call(this, god.x, god.y + 30),
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

    /* HUD – speaker icon */
    this.speaker = this.add
      .image(width - 20, 80, 'speakerIcon')
      .setOrigin(1, 0)
      .setScale(0.6)
      .setInteractive();
    this.speaker.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
    });
  }
    update() {
      if (this.physics.world.isPaused) return;

      const pointer = this.input.activePointer;
      const pointerLeft = pointer.isDown && pointer.x < this.scale.width / 2;
      const pointerRight = pointer.isDown && pointer.x >= this.scale.width / 2;

      if (cursors.left.isDown || pointerLeft) {
        player.setVelocityX(-PLAYER_SPEED);
        if (player.anims.currentAnim.key !== 'left') player.play('left', true);
      } else if (cursors.right.isDown || pointerRight) {
        player.setVelocityX(PLAYER_SPEED);
        if (player.anims.currentAnim.key !== 'right') player.play('right', true);
      } else {
        player.setVelocityX(0);
        if (player.anims.currentAnim.key !== 'idle') player.play('idle', true);
      }

    if (lives <= 0) {
      if (this.bgMusic) this.bgMusic.stop();
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
    this.sound.play('gameOverSound');
    sendScoreToServer(posScore);
    this.time.delayedCall(1000, () => this.scene.start('leaderboard'));
  }
}

class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('leaderboard');
  }
  async create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 100, 'Leaderboard', {
      font: '48px Impact',
      fill: '#ffffff',
    }).setOrigin(0.5);

    try {
      const scores = await fetchHighScores();
      scores.slice(0, 10).forEach((entry, i) => {
        const name = entry.user.username || entry.user.first_name;
        this.add
          .text(width / 2, 200 + i * 40, `${entry.position}. ${name}: ${entry.score}`, {
            font: '32px Impact',
            fill: '#ffffff',
          })
          .setOrigin(0.5);
      });
    } catch (e) {
      this.add
        .text(width / 2, height / 2, 'Failed to load leaderboard', {
          font: '24px Impact',
          fill: '#ff0000',
        })
        .setOrigin(0.5);
    }

    const toStart = () => this.scene.start('start');
    this.input.keyboard.once('keydown', toStart);
    this.input.once('pointerdown', toStart);
  }
}

/* send score to the bot server using initData */
function sendScoreToServer(score) {
  try {
    const webApp = window.Telegram && window.Telegram.WebApp;
    if (!webApp?.initData) return;
    fetch('/setscore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, initData: webApp.initData }),
    });
  } catch (e) {
    // ignore network errors
  }
}

async function fetchHighScores() {
  const webApp = window.Telegram && window.Telegram.WebApp;
  if (!webApp?.initData) return [];
  const params = new URLSearchParams({ initData: webApp.initData });
  const res = await fetch('/highscores?' + params.toString());
  const data = await res.json();
  return data.result || [];
}

/* drop multiple coins based on current level */
function dropCoins(x, y) {
  const full = Math.floor(coinsPerDrop);
  const extra = coinsPerDrop - full;
  for (let i = 0; i < full; i++) dropCoin(x, y);
  if (Math.random() < extra) dropCoin(x, y);
}

/* display level up banner */
function showLevelUp(scene) {
  const { width, height } = scene.scale;
  const banner = scene.add
    .image(width / 2, height / 2, 'levelUp')
    .setDepth(10);
  scene.time.addEvent({ delay: 1000, callback: () => banner.destroy() });
  if (scene.bgMusic && scene.bgMusic.isPlaying) scene.bgMusic.pause();
  const lvlSound = scene.sound.add('levelUpSound');
  lvlSound.once('complete', () => {
    if (scene.bgMusic) scene.bgMusic.resume();
  });
  lvlSound.play();
  flashPlayer(scene, 'bossJump', FLASH_PAUSE_MS);
  scene.time.delayedCall(FLASH_PAUSE_MS, () => showTaunt(scene));
}

function showTaunt(scene) {
  const { width, height } = scene.scale;
  const msg = Phaser.Utils.Array.GetRandom(TAUNTS).replace('$POS', posScore);

  scene.physics.pause();
  if (dropTimer) dropTimer.paused = true;

  const pepe = scene.add
    .sprite(20, height - WORLD_FLOOR_PAD, 'pepeTaunt')
    .setOrigin(0, 1)
    .setDepth(11);

  const showBubble = () => {
      const bubble = scene.add
        .image(
          pepe.x + pepe.displayWidth -100,
          pepe.y - pepe.displayHeight +150,
          'speechBubble',
        )
      .setOrigin(0, 1)
      .setDepth(11);

    const text = scene.add
      .text(bubble.x + bubble.displayWidth / 2, bubble.y - bubble.displayHeight / 2, '', {
        font: '20px Impact',
        fill: '#ffffff',
        wordWrap: { width: bubble.displayWidth - 20 },
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(12);

    const words = msg.split(' ');
    let index = 0;
    const typeNext = () => {
      text.setText(words.slice(0, index + 1).join(' '));
      index += 1;
      if (index < words.length) {
        scene.time.delayedCall(600, typeNext);
      } else {
        scene.time.delayedCall(2000, () => {
          pepe.destroy();
          bubble.destroy();
          text.destroy();
          scene.physics.resume();
          if (dropTimer) dropTimer.paused = false;
        });
      }
    };

    typeNext();
  };

  pepe.play({ key: 'taunt', repeat: 0 });
  pepe.once(Phaser.Animations.Events.ANIMATION_COMPLETE, showBubble);
}

/* briefly play a temporary player animation */
function flashPlayer(scene, key, minPause = FLASH_PAUSE_MS) {
  const current = player.anims.currentAnim
    ? player.anims.currentAnim.key
    : 'idle';

  let animDone = false;
  let timerDone = false;
  const resume = () => {
    if (!animDone || !timerDone) return;
    player.play(current, true);
    scene.physics.resume();
    if (dropTimer) dropTimer.paused = false;
  };

  player.play(key, true);
  scene.physics.pause();
  if (dropTimer) dropTimer.paused = true;

  player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    animDone = true;
    resume();
  });

  scene.time.delayedCall(minPause, () => {
    timerDone = true;
    resume();
  });
}

/* spawn a single coin */
function dropCoin(x, y) {
  const key = Math.random() < 0.5 ? 'coinPepe' : 'coinPos';
  const coin = coins
    .create(x, y, key)
    .setGravityY(COIN_GRAVITY + coinExtraGravity)
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
    this.sound.play('coinSound');
    if (posScore % 10 === 0) {
      level += 1;
      coinsPerDrop *= 1.1;
      coinExtraGravity += 100;
      showLevelUp(this);
    }
  } else if (coin.texture.key === 'coinPepe') {
    if (lives > 0) {
      lifeIcons[MAX_LIVES - lives].setVisible(false);
      lives -= 1;
    }
    this.sound.play('penaltySound');
    flashPlayer(this, 'hurt', FLASH_PAUSE_MS);
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
  plugins: {
    scene: [
      { key: 'debugHud', plugin: DebugHudPlugin, mapping: 'debugHud' },
    ],
  },
  scene: [BootScene, StartScene, GameScene, GameOverScene, LeaderboardScene],
};

new Phaser.Game(config);
