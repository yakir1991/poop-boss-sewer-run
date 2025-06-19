/* global Telegram, Phaser */

/* ----- Game config ----- */
const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,   // Fit to mini-app window
    width: 800,
    height: 600,
    parent: null,
  },
  backgroundColor: "#000000",
  scene: {
    preload,
    create,
    update
  }
};

let player;
let cursors;
let score = 0;

/* ----- Preload assets ----- */
function preload() {
  this.load.image("bg", "assets/bg_sewer.png");
  this.load.spritesheet("poopIdle", "assets/poop_idle.png", { frameWidth: 96, frameHeight: 96 });
}

/* ----- Create once ----- */
function create() {
  /* Background */
  this.add.image(0, 0, "bg").setOrigin(0);

  /* Player sprite & animation */
  this.anims.create({
    key: "idle",
    frames: this.anims.generateFrameNumbers("poopIdle", { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1
  });
  player = this.add.sprite(400, 520, "poopIdle").play("idle");

  /* Input */
  cursors = this.input.keyboard.createCursorKeys();
}

/* ----- Game loop ----- */
function update() {
  if (cursors.left.isDown) { player.x -= 4; }
  else if (cursors.right.isDown) { player.x += 4; }
}

/* ----- Boot the game ----- */
new Phaser.Game(config);

/* ----- Telegram score posting (stub) ----- */
function sendScore(finalScore) {
  // TelegramGameProxy works only inside the mini-app iframe
  if (window.Telegram && Telegram.WebApp && Telegram.WebApp.postEvent) {
    Telegram.WebApp.postEvent("score:" + finalScore);
  }
}
