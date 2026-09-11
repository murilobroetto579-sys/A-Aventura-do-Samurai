class PlatformScene extends Phaser.Scene {
    constructor() {
        super("PlatformScene");
    }

    create() {
        // ==============================
        // CONFIGURAÇÕES
        // ==============================

        this.worldWidth = 8000;
        this.worldHeight = 900;

        this.playerSpeed = 280;
        this.jumpPower = 600;

        this.playerHP = 100;
        this.coins = 0;
        this.score = 0;

        this.gameOver = false;
        this.attackCooldown = 0;

        // ==============================
        // MUNDO
        // ==============================

        this.physics.world.setBounds(
            0,
            0,
            this.worldWidth,
            this.worldHeight
        );

        // Fundo
        this.add.rectangle(
            this.worldWidth / 2,
            this.worldHeight / 2,
            this.worldWidth,
            this.worldHeight,
            0x87ceeb
        );

        // Montanhas no fundo
        this.createBackground();

        // ==============================
        // PLATAFORMAS
        // ==============================

        this.platforms = this.physics.add.staticGroup();

        this.createPlatform(4000, 850, 8000, 100);

        this.createPlatform(600, 650, 400, 40);
        this.createPlatform(1200, 520, 350, 40);
        this.createPlatform(1750, 680, 450, 40);
        this.createPlatform(2400, 550, 350, 40);
        this.createPlatform(3000, 420, 400, 40);

        this.createPlatform(3650, 620, 400, 40);
        this.createPlatform(4300, 500, 400, 40);
        this.createPlatform(4950, 650, 500, 40);

        this.createPlatform(5700, 500, 400, 40);
        this.createPlatform(6300, 600, 450, 40);
        this.createPlatform(7000, 450, 400, 40);
        this.createPlatform(7550, 600, 400, 40);

        // ==============================
        // PLAYER
        // ==============================

        this.player = this.physics.add.sprite(250, 550, null);

        this.player.setDisplaySize(50, 75);
        this.player.body.setSize(40, 70);

        // Desenho do samurai
        this.playerGraphics = this.add.graphics();

        this.drawSamurai();

        this.player.setCollideWorldBounds(true);

        this.player.body.setGravityY(1000);

        // ==============================
        // CONTROLES
        // ==============================

        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            W: Phaser.Input.Keyboard.KeyCodes.W,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // ==============================
        // COLISÕES
        // ==============================

        this.physics.add.collider(
            this.player,
            this.platforms
        );

        // ==============================
        // INIMIGOS
        // ==============================

        this.enemies = this.physics.add.group();

        this.createEnemy(900, 580);
        this.createEnemy(1500, 580);
        this.createEnemy(2100, 580);
        this.createEnemy(2700, 580);
        this.createEnemy(3400, 580);
        this.createEnemy(4000, 580);
        this.createEnemy(4700, 580);
        this.createEnemy(5400, 580);
        this.createEnemy(6100, 530);
        this.createEnemy(6800, 380);
        this.createEnemy(7400, 530);

        this.physics.add.collider(
            this.enemies,
            this.platforms
        );

        this.physics.add.collider(
            this.player,
            this.enemies,
            this.playerEnemyCollision,
            null,
            this
        );

        // ==============================
        // MOEDAS
        // ==============================

        this.coinsGroup = this.physics.add.group();

        const coinPositions = [
            [650, 590],
            [750, 590],
            [1250, 460],
            [1350, 460],
            [1800, 620],
            [1900, 620],
            [2450, 490],
            [3050, 360],
            [3700, 560],
            [4400, 440],
            [5000, 590],
            [5750, 440],
            [6400, 540],
            [7050, 390],
            [7600, 540]
        ];

        coinPositions.forEach(pos => {
            this.createCoin(pos[0], pos[1]);
        });

        this.physics.add.overlap(
            this.player,
            this.coinsGroup,
            this.collectCoin,
            null,
            this
        );

        // ==============================
        // CÂMERA
        // ==============================

        this.cameras.main.setBounds(
            0,
            0,
            this.worldWidth,
            this.worldHeight
        );

        this.cameras.main.startFollow(
            this.player,
            true,
            0.08,
            0.08
        );

        this.cameras.main.setZoom(1.2);

        // ==============================
        // FINAL DA FASE
        // ==============================

        this.createGoal();

        // ==============================
        // HUD
        // ==============================

        this.createHUD();

        // ==============================
        // TEXTO DE INSTRUÇÕES
        // ==============================

        this.instruction = this.add.text(
            20,
            100,
            "A/D ou ←/→ = andar\nESPACO = pular / atacar",
            {
                fontSize: "18px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4
            }
        );

        this.instruction.setScrollFactor(0);

        this.time.delayedCall(5000, () => {
            this.instruction.setVisible(false);
        });
    }

    // ============================================================
    // FUNDO
    // ============================================================

    createBackground() {

        // Montanhas
        for (let x = 0; x < this.worldWidth; x += 500) {

            const mountain = this.add.triangle(
                x,
                650,
                0,
                300,
                250,
                0,
                500,
                300,
                0x668866
            );

            mountain.setDepth(-2);
        }

        // Árvores
        for (let x = 100; x < this.worldWidth; x += 350) {

            const tree = this.add.graphics();

            tree.fillStyle(0x654321);
            tree.fillRect(x, 650, 35, 150);

            tree.fillStyle(0x176b2c);
            tree.fillCircle(x + 18, 630, 70);
            tree.fillCircle(x - 20, 670, 55);
            tree.fillCircle(x + 55, 670, 55);

            tree.setDepth(-1);
        }

        // Sol
        this.add.circle(
            700,
            150,
            70,
            0xffdf70
        ).setScrollFactor(0.2);
    }

    // ============================================================
    // PLATAFORMAS
    // ============================================================

    createPlatform(x, y, width, height) {

        const platform = this.add.rectangle(
            x,
            y,
            width,
            height,
            0x6b4226
        );

        this.physics.add.existing(
            platform,
            true
        );

        this.platforms.add(platform);

        // Grama
        const grass = this.add.rectangle(
            x,
            y - height / 2 + 4,
            width,
            8,
            0x3b8c32
        );

        grass.setDepth(1);
    }

    // ============================================================
    // SAMURAI
    // ============================================================

    drawSamurai() {

        this.playerGraphics.clear();

        const x = this.player.x;
        const y = this.player.y;

        // Corpo
        this.playerGraphics.fillStyle(0x202020);
        this.playerGraphics.fillRect(
            x - 20,
            y - 5,
            40,
            45
        );

        // Armadura
        this.playerGraphics.fillStyle(0x8b0000);
        this.playerGraphics.fillRect(
            x - 18,
            y,
            36,
            25
        );

        // Cabeça
        this.playerGraphics.fillStyle(0xffc79c);
        this.playerGraphics.fillCircle(
            x,
            y - 25,
            15
        );

        // Capacete
        this.playerGraphics.fillStyle(0x181818);
        this.playerGraphics.fillEllipse(
            x,
            y - 35,
            40,
            18
        );

        // Chifres do capacete
        this.playerGraphics.lineStyle(
            5,
            0xc9a227
        );

        this.playerGraphics.beginPath();

        this.playerGraphics.moveTo(
            x - 12,
            y - 40
        );

        this.playerGraphics.lineTo(
            x - 25,
            y - 55
        );

        this.playerGraphics.moveTo(
            x + 12,
            y - 40
        );

        this.playerGraphics.lineTo(
            x + 25,
            y - 55
        );

        this.playerGraphics.strokePath();

        // Pernas
        this.playerGraphics.fillStyle(0x202020);

        this.playerGraphics.fillRect(
            x - 17,
            y + 38,
            12,
            25
        );

        this.playerGraphics.fillRect(
            x + 5,
            y + 38,
            12,
            25
        );

        // Espada
        this.playerGraphics.lineStyle(
            5,
            0xffffff
        );

        this.playerGraphics.beginPath();

        this.playerGraphics.moveTo(
            x + 15,
            y + 10
        );

        this.playerGraphics.lineTo(
            x + 50,
            y - 15
        );

        this.playerGraphics.strokePath();
    }

    // ============================================================
    // INIMIGOS
    // ============================================================

    createEnemy(x, y) {

        const enemy = this.physics.add.sprite(
            x,
            y,
            null
        );

        enemy.setDisplaySize(
            55,
            55
        );

        enemy.body.setSize(
            45,
            50
        );

        enemy.body.setGravityY(1000);

        enemy.setCollideWorldBounds(true);

        enemy.hp = 30;
        enemy.speed = 60;
        enemy.direction = -1;

        const graphics = this.add.graphics();

        graphics.fillStyle(0x8b0000);

        graphics.fillCircle(
            x,
            y - 10,
            22
        );

        graphics.fillStyle(0xffcc99);

        graphics.fillCircle(
            x,
            y - 20,
            12
        );

        graphics.fillStyle(0x000000);

        graphics.fillCircle(
            x - 5,
            y - 22,
            2
        );

        graphics.fillCircle(
            x + 5,
            y - 22,
            2
        );

        enemy.graphics = graphics;

        this.enemies.add(enemy);
    }

    // ============================================================
    // MOEDAS
    // ============================================================

    createCoin(x, y) {

        const coin = this.add.circle(
            x,
            y,
            13,
            0xffd700
        );

        this.physics.add.existing(
            coin
        );

        coin.body.setAllowGravity(false);

        coin.body.setImmovable(true);

        coin.collected = false;

        this.coinsGroup.add(coin);

        this.tweens.add({
            targets: coin,
            scaleX: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    collectCoin(player, coin) {

        if (coin.collected) return;

        coin.collected = true;

        this.coins++;

        this.score += 100;

        coin.destroy();

        this.updateHUD();
    }

    // ============================================================
    // COLISÃO COM INIMIGO
    // ============================================================

    playerEnemyCollision(player, enemy) {

        if (!enemy.active) return;

        // Se estiver caindo sobre o inimigo
        if (
            player.body.velocity.y > 0 &&
            player.y < enemy.y - 15
        ) {

            this.killEnemy(enemy);

            player.setVelocityY(
                -350
            );

            this.score += 200;

            this.updateHUD();

        } else {

            // Dano
            if (
                !player.lastDamage ||
                this.time.now - player.lastDamage > 1000
            ) {

                player.lastDamage =
                    this.time.now;

                this.playerHP -= 20;

                this.updateHUD();

                player.setTint(
                    0xff0000
                );

                this.time.delayedCall(
                    200,
                    () => {
                        if (player.active) {
                            player.clearTint();
                        }
                    }
                );

                if (this.playerHP <= 0) {
                    this.endGame(false);
                }
            }
        }
    }

    // ============================================================
    // MATAR INIMIGO
    // ============================================================

    killEnemy(enemy) {

        enemy.setVelocityX(0);

        enemy.body.enable = false;

        if (enemy.graphics) {
            enemy.graphics.destroy();
        }

        this.tweens.add({

            targets: enemy,

            scaleY: 0,

            duration: 250,

            onComplete: () => {
                enemy.destroy();
            }
        });
    }

    // ============================================================
    // ATAQUE
    // ============================================================

    attack() {

        if (
            this.time.now <
            this.attackCooldown
        ) {
            return;
        }

        this.attackCooldown =
            this.time.now + 400;

        const attackRange = 90;

        this.enemies.children.iterate(
            enemy => {

                if (!enemy || !enemy.active)
                    return;

                const distance =
                    Phaser.Math.Distance.Between(
                        this.player.x,
                        this.player.y,
                        enemy.x,
                        enemy.y
                    );

                if (
                    distance <
                    attackRange
                ) {

                    enemy.hp -= 20;

                    enemy.setTint(
                        0xffffff
                    );

                    this.time.delayedCall(
                        100,
                        () => {
                            if (enemy.active) {
                                enemy.clearTint();
                            }
                        }
                    );

                    if (enemy.hp <= 0) {

                        this.killEnemy(enemy);

                        this.score += 200;

                        this.updateHUD();
                    }
                }
            }
        );
    }

    // ============================================================
    // OBJETIVO FINAL
    // ============================================================

    createGoal() {

        this.goal = this.add.rectangle(
            7900,
            700,
            80,
            200,
            0x663399
        );

        this.physics.add.existing(
            this.goal,
            true
        );

        const flag = this.add.text(
            7900,
            570,
            "🏯",
            {
                fontSize: "80px"
            }
        );

        flag.setOrigin(0.5);

        this.physics.add.overlap(
            this.player,
            this.goal,
            () => {
                this.endGame(true);
            }
        );
    }

    // ============================================================
    // HUD
    // ============================================================

    createHUD() {

        this.hud = this.add.text(
            20,
            20,
            "",
            {
                fontSize: "22px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        this.hud.setScrollFactor(0);

        this.updateHUD();
    }

    updateHUD() {

        if (!this.hud) return;

        this.hud.setText(
            "❤️ Vida: " +
            this.playerHP +
            "\n🪙 Moedas: " +
            this.coins +
            "\n⭐ Pontos: " +
            this.score
        );
    }

    // ============================================================
    // GAME OVER / VITÓRIA
    // ============================================================

    endGame(victory) {

        if (this.gameOver) return;

        this.gameOver = true;

        this.physics.pause();

        const message =
            victory
                ? "🏆 VITÓRIA!"
                : "💀 GAME OVER";

        const sub =
            victory
                ? "O Samurai chegou ao templo!"
                : "O Samurai foi derrotado.";

        this.add.rectangle(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y,
            600,
            300,
            0x000000,
            0.85
        ).setScrollFactor(0);

        this.add.text(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y - 50,
            message,
            {
                fontSize: "52px",
                fill: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);

        this.add.text(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y + 30,
            sub +
            "\n\nRecarregue a página para jogar novamente.",
            {
                fontSize: "20px",
                fill: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
    }

    // ============================================================
    // UPDATE
    // ============================================================

    update() {

        if (
            this.gameOver ||
            !this.player.active
        ) {
            return;
        }

        let movingLeft = false;
        let movingRight = false;

        if (
            this.cursors.left.isDown ||
            this.keys.A.isDown
        ) {
            movingLeft = true;
        }

        if (
            this.cursors.right.isDown ||
            this.keys.D.isDown
        ) {
            movingRight = true;
        }

        let speed =
            this.playerSpeed;

        // Corrida
        if (
            this.keys.SHIFT.isDown
        ) {
            speed = 420;
        }

        if (movingLeft) {

            this.player.setVelocityX(
                -speed
            );

            this.playerGraphics.scaleX =
                -1;

        } else if (movingRight) {

            this.player.setVelocityX(
                speed
            );

            this.playerGraphics.scaleX =
                1;

        } else {

            this.player.setVelocityX(
                0
            );
        }

        // Pulo
        const jump =
            this.cursors.up.isDown ||
            this.keys.W.isDown ||
            this.keys.SPACE.isDown;

        if (
            jump &&
            this.player.body.blocked.down
        ) {

            this.player.setVelocityY(
                -this.jumpPower
            );
        }

        // Ataque com espaço
        if (
            Phaser.Input.Keyboard.JustDown(
                this.keys.SPACE
            )
        ) {

            this.attack();
        }

        // Inimigos
        this.enemies.children.iterate(
            enemy => {

                if (
                    !enemy ||
                    !enemy.active
                ) {
                    return;
                }

                const distance =
                    enemy.x -
                    this.player.x;

                if (
                    Math.abs(distance) <
                    450
                ) {

                    if (
                        distance < 0
                    ) {

                        enemy.setVelocityX(
                            enemy.speed
                        );

                    } else {

                        enemy.setVelocityX(
                            -enemy.speed
                        );
                    }

                } else {

                    enemy.setVelocityX(0);
                }

                // Atualiza desenho do inimigo
                if (enemy.graphics) {

                    enemy.graphics.x =
                        enemy.x -
                        enemy.graphics.x;

                }
            }
        );

        // Mantém desenho do Samurai
        this.playerGraphics.clear();

        this.drawSamurai();
    }
}

// ============================================================
// CONFIGURAÇÃO PHASER
// ============================================================

const config = {

    type: Phaser.AUTO,

    width: 1280,

    height: 720,

    backgroundColor: "#87ceeb",

    physics: {

        default: "arcade",

        arcade: {

            gravity: {
                y: 0
            },

            debug: false
        }
    },

    scale: {

        mode: Phaser.Scale.FIT,

        autoCenter:
            Phaser.Scale.CENTER_BOTH
    },

    scene: [
        PlatformScene
    ]
};

const game =
    new Phaser.Game(config);