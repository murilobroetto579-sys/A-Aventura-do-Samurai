from PIL import Image
from pathlib import Path
import zipfile, textwrap, os

src = Path("/mnt/data/r6Y3tq.gif")
out = Path("/mnt/data/samurai_github_game")
(out / "assets").mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")

# Crop only the samurai from the supplied image, removing the title and gray UI/background.
crop = img.crop((180, 165, 295, 355))

# Chroma-key the gray background/floor while preserving the dark samurai pixels.
px = crop.load()
for y in range(crop.height):
    for x in range(crop.width):
        r, g, b, a = px[x, y]
        # Background is neutral gray; floor is darker neutral gray.
        if abs(r-g) < 7 and abs(g-b) < 7 and 70 <= r <= 150:
            px[x, y] = (r, g, b, 0)

# Trim transparent border.
bbox = crop.getbbox()
if bbox:
    crop = crop.crop(bbox)

# Keep crisp pixel art.
crop.save(out / "assets" / "samurai.png", optimize=True)

index_html = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Samurai - A Lenda do Arco-Íris</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game"></div>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
  <script src="game.js"></script>
</body>
</html>
"""

style_css = """html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: #101820;
  overflow: hidden;
  font-family: monospace;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
#game {
  width: 100%;
  height: 100%;
}
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
"""

game_js = r"""const GAME_W = 1280;
const GAME_H = 720;
const WORLD_W = 9000;

class SamuraiWorld extends Phaser.Scene {
  constructor() {
    super("SamuraiWorld");
    this.hp = 3;
    this.maxHp = 3;
    this.coins = 0;
    this.score = 0;
    this.invincibleUntil = 0;
    this.gameWon = false;
  }

  preload() {
    this.load.image("samurai", "assets/samurai.png");
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);

    this.createBackground();
    this.createLevel();
    this.createPlayer();
    this.createCoins();
    this.createEnemies();
    this.createGoal();
    this.createHUD();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,Z,SHIFT");

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.coins, this.platforms);

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, null, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(360, 180);

    this.attackCooldown = 0;
    this.timeLeft = 286;
    this.timerText.setText("⏱ 286");

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.gameWon && this.timeLeft > 0) {
          this.timeLeft--;
          this.timerText.setText("⏱ " + this.timeLeft);
        }
      }
    });

    this.events.on("update", this.updatePlayer, this);
  }

  createBackground() {
    // Sky
    this.add.rectangle(WORLD_W / 2, GAME_H / 2, WORLD_W, GAME_H, 0x1596d6)
      .setScrollFactor(0);

    // Sun
    this.add.circle(1080, 110, 52, 0xffe27a).setScrollFactor(0);

    // Clouds
    const clouds = [
      [180, 120, 1.0], [520, 75, 1.25], [860, 145, 0.9], [1180, 85, 1.1]
    ];
    clouds.forEach(([x, y, s]) => {
      const g = this.add.graphics().setScrollFactor(0);
      g.fillStyle(0xffffff, 0.92);
      g.fillCircle(x, y, 26 * s);
      g.fillCircle(x + 35*s, y + 6*s, 32*s);
      g.fillCircle(x + 70*s, y + 2*s, 24*s);
      g.fillRect(x - 5*s, y + 12*s, 82*s, 22*s);
    });

    // Distant mountains
    const m = this.add.graphics().setScrollFactor(0.18);
    m.fillStyle(0x5e93bd, 1);
    for (let x = 0; x < WORLD_W + 600; x += 420) {
      m.beginPath();
      m.moveTo(x, 540);
      m.lineTo(x + 210, 260);
      m.lineTo(x + 420, 540);
      m.closePath();
      m.fillPath();
    }

    // Near mountains
    const m2 = this.add.graphics().setScrollFactor(0.32);
    m2.fillStyle(0x39779e, 1);
    for (let x = -100; x < WORLD_W + 500; x += 520) {
      m2.beginPath();
      m2.moveTo(x, 590);
      m2.lineTo(x + 250, 340);
      m2.lineTo(x + 520, 590);
      m2.closePath();
      m2.fillPath();
    }

    // Forest strip
    const forest = this.add.graphics().setScrollFactor(0.45);
    for (let x = 0; x < WORLD_W + 200; x += 85) {
      forest.fillStyle(0x23734f, 1);
      forest.fillCircle(x + 25, 600, 55);
      forest.fillStyle(0x2e8c52, 1);
      forest.fillCircle(x + 50, 585, 45);
    }

    // Water at bottom
    const water = this.add.rectangle(WORLD_W / 2, 695, WORLD_W, 50, 0x147db4)
      .setScrollFactor(0);
    this.tweens.add({
      targets: water,
      alpha: { from: 0.75, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  createLevel() {
    this.platforms = this.physics.add.staticGroup();

    const groundSegments = [
      [0, 820], [970, 1900], [2070, 3100], [3270, 4450],
      [4600, 5750], [5900, 7200], [7350, 9000]
    ];

    groundSegments.forEach(([x, w]) => this.makeGround(x, w));

    const floating = [
      [430, 510, 170], [760, 420, 190], [1220, 500, 180],
      [1540, 360, 210], [1900, 470, 180], [2350, 410, 190],
      [2750, 330, 200], [3480, 430, 200], [3860, 320, 180],
      [4300, 470, 220], [4850, 350, 200], [5250, 430, 190],
      [6150, 380, 200], [6600, 300, 210], [7050, 420, 180],
      [7600, 360, 190], [8120, 300, 230]
    ];
    floating.forEach(([x, y, w]) => this.makeFloating(x, y, w));

    // Decorative Japanese lanterns
    [300, 1500, 3500, 5300, 7000].forEach(x => this.makeLantern(x, 500));

    // Cherry trees / regular trees
    [120, 1120, 2450, 3350, 4750, 6050, 7500, 8450].forEach((x, i) => {
      this.makeTree(x, i % 2 === 0 ? 585 : 560, i % 3 === 0);
    });
  }

  makeGround(x, width) {
    const y = 655;
    const g = this.add.graphics();
    g.fillStyle(0x6b3f20, 1);
    g.fillRect(x, y, width, 65);
    g.fillStyle(0x8a5528, 1);
    for (let bx = x; bx < x + width; bx += 32) {
      for (let by = y + 8; by < y + 65; by += 22) {
        g.fillRect(bx + 3, by + 2, 20, 13);
        g.fillStyle(0x5c351d, 1);
        g.fillRect(bx + 14, by + 11, 13, 7);
        g.fillStyle(0x8a5528, 1);
      }
    }
    g.fillStyle(0x4f9c2c, 1);
    g.fillRect(x, y - 9, width, 12);
    g.fillStyle(0x8fd343, 1);
    g.fillRect(x, y - 9, width, 4);

    const body = this.add.rectangle(x + width/2, y + 28, width, 56, 0x6b3f20);
    body.setVisible(false);
    this.physics.add.existing(body, true);
    this.platforms.add(body);
  }

  makeFloating(x, y, width) {
    const g = this.add.graphics();
    g.fillStyle(0x6b3f20, 1);
    g.fillRect(x, y, width, 42);
    g.fillStyle(0x4f9c2c, 1);
    g.fillRect(x, y - 9, width, 11);
    g.fillStyle(0x8fd343, 1);
    g.fillRect(x, y - 9, width, 4);

    for (let bx = x; bx < x + width; bx += 30) {
      g.fillStyle(0x8a5528, 1);
      g.fillRect(bx + 3, y + 10, 20, 13);
    }

    const body = this.add.rectangle(x + width/2, y + 18, width, 36, 0x6b3f20);
    body.setVisible(false);
    this.physics.add.existing(body, true);
    this.platforms.add(body);
  }

  makeLantern(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0x4c2c19, 1);
    g.fillRect(x, y - 110, 7, 110);
    g.fillStyle(0x222222, 1);
    g.fillRect(x - 18, y - 110, 43, 8);
    g.fillStyle(0xd8492e, 1);
    g.fillRect(x - 13, y - 98, 33, 55);
    g.fillStyle(0xffd05a, 1);
    g.fillRect(x - 4, y - 90, 15, 38);
    g.fillStyle(0x222222, 1);
    g.fillRect(x - 18, y - 43, 43, 8);
  }

  makeTree(x, y, cherry) {
    const g = this.add.graphics();
    g.fillStyle(0x633719, 1);
    g.fillRect(x - 13, y - 125, 26, 125);
    g.fillStyle(cherry ? 0xff8fb0 : 0x3b9b43, 1);
    g.fillCircle(x - 45, y - 120, 42);
    g.fillCircle(x + 5, y - 150, 52);
    g.fillCircle(x + 48, y - 115, 40);
    g.fillStyle(cherry ? 0xffb0c7 : 0x62b74c, 1);
    g.fillCircle(x - 20, y - 145, 28);
    g.fillCircle(x + 25, y - 165, 31);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(260, 570, "samurai");
    this.player.setOrigin(0.5, 1);
    this.player.setScale(1.35);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(42, 92, true);
    this.player.setDepth(20);
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();
    const positions = [
      [520, 500], [570, 500], [620, 500],
      [840, 370], [1270, 450], [1320, 450],
      [1590, 310], [1640, 310], [1950, 420],
      [2410, 360], [2800, 280], [3510, 380],
      [3900, 270], [4350, 420], [4900, 300],
      [5300, 380], [6200, 330], [6650, 250],
      [7100, 370], [7680, 310], [8180, 250]
    ];
    positions.forEach(([x,y]) => {
      const coin = this.add.circle(x, y, 13, 0xffc21c);
      coin.setStrokeStyle(4, 0xfff18a);
      coin.setDepth(15);
      this.physics.add.existing(coin, true);
      this.coins.add(coin);
      this.tweens.add({
        targets: coin,
        scaleX: 0.25,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    const xs = [690, 1430, 2200, 3000, 3650, 4550, 5100, 6000, 6900, 7800, 8400];
    xs.forEach((x, i) => {
      const enemy = this.add.container(x, 610);
      const g = this.add.graphics();
      g.fillStyle(0x7a3f1e, 1);
      g.fillRoundedRect(-22, -34, 44, 34, 10);
      g.fillStyle(0xffe2a1, 1);
      g.fillCircle(-9, -18, 4);
      g.fillCircle(9, -18, 4);
      g.fillStyle(0x2a1b15, 1);
      g.fillRect(-13, -3, 26, 5);
      enemy.add(g);
      enemy.setSize(44, 36);
      enemy.setDepth(18);

      this.physics.world.enable(enemy);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setSize(42, 34);
      enemy.body.setVelocityX(i % 2 ? -55 : 55);
      enemy.body.setBounce(0);
      enemy.hp = 1;
      enemy.startX = x;
      enemy.range = 120;
      this.enemies.add(enemy);
    });
  }

  createGoal() {
    const x = 8740;
    const pole = this.add.graphics();
    pole.fillStyle(0x51351f, 1);
    pole.fillRect(x, 410, 10, 245);
    pole.fillStyle(0xd6463c, 1);
    pole.fillTriangle(x + 10, 420, x + 115, 455, x + 10, 490);
    pole.fillStyle(0xffd05a, 1);
    pole.fillCircle(x + 12, 405, 10);

    this.goal = this.add.rectangle(x + 15, 630, 40, 50, 0x000000, 0);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, this.win, null, this);
  }

  createHUD() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    const panel = this.add.graphics();
    panel.fillStyle(0x07121c, 0.86);
    panel.fillRoundedRect(18, 18, 365, 105, 12);
    panel.lineStyle(3, 0xffffff, 0.7);
    panel.strokeRoundedRect(18, 18, 365, 105, 12);

    this.lifeText = this.add.text(34, 30, "❤ ❤ ❤", {
      fontFamily: "monospace", fontSize: "28px", color: "#ff4b4b",
      fontStyle: "bold"
    });

    this.coinText = this.add.text(35, 70, "🪙 x 0", {
      fontFamily: "monospace", fontSize: "22px", color: "#ffd54a",
      fontStyle: "bold"
    });

    this.scoreText = this.add.text(175, 73, "PONTOS: 000000", {
      fontFamily: "monospace", fontSize: "17px", color: "#ffffff",
      fontStyle: "bold"
    });

    this.stageText = this.add.text(1030, 28, "FASE 1-1", {
      fontFamily: "monospace", fontSize: "27px", color: "#ffffff",
      fontStyle: "bold", stroke: "#111111", strokeThickness: 6
    });

    this.timerText = this.add.text(1050, 68, "⏱ 286", {
      fontFamily: "monospace", fontSize: "21px", color: "#ffffff",
      fontStyle: "bold", stroke: "#111111", strokeThickness: 5
    });

    const controls = this.add.graphics();
    controls.fillStyle(0x07121c, 0.9);
    controls.fillRoundedRect(18, 590, 420, 112, 12);
    controls.lineStyle(2, 0xffffff, 0.65);
    controls.strokeRoundedRect(18, 590, 420, 112, 12);

    const controlsText = this.add.text(40, 607,
      "CONTROLES\n\n← → / A D   MOVER     ↑ / W   PULAR     Z / ESPAÇO   ATACAR",
      {
        fontFamily: "monospace", fontSize: "14px", color: "#ffffff",
        fontStyle: "bold", lineSpacing: 5
      }
    );

    this.hud.add([panel, this.lifeText, this.coinText, this.scoreText,
                  this.stageText, this.timerText, controls, controlsText]);
  }

  updatePlayer() {
    if (!this.player || this.gameWon) return;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.keys.W);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.Z) ||
                   Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    const sprint = this.keys.SHIFT.isDown;

    const speed = sprint ? 280 : 210;

    if (left) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-530);
    }

    if (attack && this.time.now > this.attackCooldown) {
      this.attackCooldown = this.time.now + 330;
      this.doAttack();
    }

    // Small squash/stretch movement to give the sprite life.
    if (this.player.body.blocked.down && Math.abs(this.player.body.velocity.x) > 20) {
      this.player.setAngle(Math.sin(this.time.now / 70) * 2);
    } else {
      this.player.setAngle(0);
    }

    // Enemy patrol
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      if (enemy.x > enemy.startX + enemy.range) enemy.body.setVelocityX(-55);
      if (enemy.x < enemy.startX - enemy.range) enemy.body.setVelocityX(55);
    });
  }

  doAttack() {
    const dir = this.player.flipX ? -1 : 1;
    const slash = this.add.arc(
      this.player.x + dir * 42,
      this.player.y - 48,
      48,
      dir === 1 ? 210 : 30,
      dir === 1 ? 20 : 160,
      false,
      0xffffff,
      0
    ).setStrokeStyle(8, 0xe8e8e8, 1).setDepth(30);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 170,
      onComplete: () => slash.destroy()
    });

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dx = enemy.x - this.player.x;
      const close = Math.abs(dx) < 85 && Math.sign(dx || 1) === dir;
      const sameHeight = Math.abs(enemy.y - this.player.y) < 75;
      if (close && sameHeight) this.killEnemy(enemy);
    });
  }

  killEnemy(enemy) {
    this.score += 100;
    this.add.text(enemy.x, enemy.y - 55, "+100", {
      fontFamily: "monospace", fontSize: "18px", color: "#ffe066",
      fontStyle: "bold", stroke: "#000000", strokeThickness: 4
    }).setDepth(40);

    this.tweens.add({
      targets: enemy,
      y: enemy.y - 45,
      alpha: 0,
      angle: 360,
      duration: 350,
      onComplete: () => enemy.destroy()
    });
    this.updateHUD();
  }

  collectCoin(player, coin) {
    if (!coin.active) return;
    this.coins.remove(coin, true, true);
    this.coins.remove(coin);
    coin.destroy();

    this.coinsCount = (this.coinsCount || 0) + 1;
    this.score += 50;

    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(player.x, player.y - 50, 4, 0xffdf55).setDepth(40);
      this.tweens.add({
        targets: p,
        x: player.x + Phaser.Math.Between(-30, 30),
        y: player.y - Phaser.Math.Between(50, 100),
        alpha: 0,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
    this.updateHUD();
  }

  touchEnemy(player, enemy) {
    if (!enemy.active || this.time.now < this.invincibleUntil) return;

    // Stomp
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      player.setVelocityY(-340);
      this.killEnemy(enemy);
      return;
    }

    this.hp--;
    this.invincibleUntil = this.time.now + 1200;
    this.updateHUD();

    player.setVelocityX(player.x < enemy.x ? -300 : 300);
    player.setVelocityY(-280);
    player.setTint(0xffffff);

    this.time.delayedCall(180, () => {
      if (player.active) player.clearTint();
    });

    if (this.hp <= 0) this.gameOver();
  }

  updateHUD() {
    this.lifeText.setText("❤ ".repeat(this.hp) + "♡ ".repeat(this.maxHp - this.hp));
    this.coinText.setText("🪙 x " + (this.coinsCount || 0));
    this.scoreText.setText("PONTOS: " + String(this.score).padStart(6, "0"));
  }

  gameOver() {
    this.physics.pause();
    this.player.setTint(0x777777);

    const box = this.add.graphics().setScrollFactor(0).setDepth(200);
    box.fillStyle(0x05080d, 0.92);
    box.fillRoundedRect(380, 245, 520, 230, 18);

    this.add.text(640, 295, "FIM DE JOGO", {
      fontFamily: "monospace", fontSize: "46px", color: "#ff5757",
      fontStyle: "bold", stroke: "#000000", strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const retry = this.add.text(640, 385, "PRESSIONE ENTER PARA TENTAR NOVAMENTE", {
      fontFamily: "monospace", fontSize: "17px", color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this.input.keyboard.once("keydown-ENTER", () => this.scene.restart());
  }

  win