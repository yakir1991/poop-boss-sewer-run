export default class DebugHudPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(scene, pluginManager) {
    super(scene, pluginManager);
    this.lines = [];
    this.text = null;
    this.enabled = true;
  }

  boot() {
    this.text = this.scene.add
      .text(10, 10, '', {
        font: '14px monospace',
        fill: '#00ff00',
        align: 'left',
      })
      .setDepth(1000)
      .setScrollFactor(0);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  shutdown() {
    if (this.text) {
      this.text.destroy();
      this.text = null;
    }
    this.lines = [];
  }

  print(msg) {
    if (!this.enabled || !this.text) return;
    this.lines.push(msg);
    if (this.lines.length > 5) this.lines.shift();
    this.text.setText(this.lines);
  }
}
