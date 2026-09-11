const config = {
    type: Phaser.AUTO,

    width: 1280,
    height: 720,

    parent: "game",

    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },

    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

let player;
let enemies;
let cursors;
let keys;

let playerHP = 100;
let playerXP = 0;
let playerLevel = 1;

let hpText;
let xpText;
let levelText;

let lastAttack = 0;

function preload() {
    // Por enquanto utilizamos formas geométricas.
}

function create() {

    const worldWidth = 5000;
    const worldHeight = 5000;

    this.physics.world.setBounds(
        0,
        0,
        worldWidth,
        worldHeight
    );

    // =====================================
    // FUNDO
    // =====================================

    this.add.rectangle(
        worldWidth / 2,
        worldHeight / 2,
        worldWidth,
        worldHeight,
        0xdce8ed
    );

    // =====================================
    // RIO
    // =====================================

    this.add.rectangle(
        2500,
        2500,
        350,
        worldHeight,
        0x5794bd
    );

    // =====================================
    // MONTANHAS
    // =====================================

    for (let i = 0; i < 40; i++) {

        const x = Phaser.Math.Between(150, worldWidth - 150);
        const y = Phaser.Math.Between(150, worldHeight - 150);

        const tamanho = Phaser.Math.Between(100, 300);

        this.add.triangle(
            x,
            y,
            0,
            tamanho,
            tamanho / 2,
            0,
            tamanho,
            tamanho
        )
        .setFillStyle(0x879ba8)
        .setDepth(1);
    }

    // =====================================
    // FLORESTA
    // =====================================

    for (let i = 0; i < 180; i++) {

        const x = Phaser.Math.Between(100, worldWidth - 100);
        const y = Phaser.Math.Between(100, worldHeight - 100);

        this.add.circle(
            x,
            y,
            Phaser.Math.Between(15, 30),
            0x31583c
        )
        .setDepth(2);
    }

    // =====================================
    // LUA
    // =====================================

    this.add.circle(
        4200,
        700,
        110,
        0xffffdd
    )
    .setDepth(3);

    // =====================================
    // JOGADOR
    // =====================================

    player = this.add.container(
        2500,
        2300
    );

    const corpo = this.add.rectangle(
        0,
        0,
        35,
        50,
        0x202020
    );

    const cabeca = this.add.circle(
        0,
        -35,
        15,
        0xe6bd98
    );

    const espada = this.add.rectangle(
        28,
        0,
        8,
        55,
        0xd5dce0
    );

    player.add([
        corpo,
        cabeca,
        espada
    ]);

    this.physics.world.enable(player);

    player.body.setCollideWorldBounds(true);

    player.body.setSize(
        35,
        50
    );

    player.setDepth(10);

    // =====================================
    // INIMIGOS
    // =====================================

    enemies = this.physics.add.group();

    for (let i = 0; i < 12; i++) {

        let enemyX = Phaser.Math.Between(300, worldWidth - 300);
        let enemyY = Phaser.Math.Between(300, worldHeight - 300);

        // Evita nascer exatamente em cima do jogador
        if (
            Phaser.Math.Distance.Between(
                enemyX,
                enemyY,
                player.x,
                player.y
            ) < 500
        ) {
            enemyX += 600;
        }

        const enemy = this.add.circle(
            enemyX,
            enemyY,
            22,
            0x7d2020
        );

        this.physics.world.enable(enemy);

        enemy.body.setCircle(22);

        enemy.body.setCollideWorldBounds(true);

        enemy.hp = 30;
        enemy.damage = 10;

        enemy.setDepth(8);

        enemies.add(enemy);
    }

    // =====================================
    // CÂMERA
    // =====================================

    this.cameras.main.setBounds(
        0,
        0,
        worldWidth,
        worldHeight
    );

    this.cameras.main.startFollow(
        player,
        true,
        0.08,
        0.08
    );

    this.cameras.main.setZoom(1.2);

    // =====================================
    // CONTROLES
    // =====================================

    cursors = this.input.keyboard.createCursorKeys();

    keys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // =====================================
    // HUD
    // =====================================

    hpText = this.add.text(
        20,
        20,
        "",
        {
            fontFamily: "Arial",
            fontSize: "20px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: {
                x: 10,
                y: 8
            }
        }
    );

    hpText.setScrollFactor(0);
    hpText.setDepth(100);

    xpText = this.add.text(
        20,
        65,
        "",
        {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: {
                x: 10,
                y: 8
            }
        }
    );

    xpText.setScrollFactor(0);
    xpText.setDepth(100);

    levelText = this.add.text(
        20,
        105,
        "",
        {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: {
                x: 10,
                y: 8
            }
        }
    );

    levelText.setScrollFactor(0);
    levelText.setDepth(100);

    updateHUD();

    // =====================================
    // COLISÃO
    // =====================================

    this.physics.add.overlap(
        player,
        enemies,
        playerHitEnemy,
        null,
        this
    );
}

function update(time) {

    if (!player) return;

    let speed = 200;

    if (keys.SHIFT.isDown) {
        speed = 350;
    }

    let vx = 0;
    let vy = 0;

    if (keys.A.isDown || cursors.left.isDown) {
        vx = -speed;
    }

    if (keys.D.isDown || cursors.right.isDown) {
        vx = speed;
    }

    if (keys.W.isDown || cursors.up.isDown) {
        vy = -speed;
    }

    if (keys.S.isDown || cursors.down.isDown) {
        vy = speed;
    }

    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }

    player.body.setVelocity(
        vx,
        vy
    );

    // =====================================
    // ATAQUE
    // =====================================

    if (
        keys.SPACE.isDown &&
        time > lastAttack + 400
    ) {

        attack(this);

        lastAttack = time;
    }

    // =====================================
    // IA DOS INIMIGOS
    // =====================================

    enemies.children.iterate(enemy => {

        if (!enemy || !enemy.active) return;

        const distance = Phaser.Math.Distance.Between(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

        if (distance < 500) {

            this.physics.moveToObject(
                enemy,
                player,
                80
            );

        } else {

            enemy.body.setVelocity(
                0,
                0
            );
        }
    });

    updateHUD();
}

function attack(scene) {

    // Área de ataque
    const attackRange = 100;

    enemies.children.iterate(enemy => {

        if (!enemy || !enemy.active) return;

        const distance = Phaser.Math.Distance.Between(
            player.x,
            player.y,
            enemy.x,
            enemy.y
        );

        if (distance <= attackRange) {

            enemy.hp -= 15;

            // Efeito visual
            enemy.setScale(1.3);

            scene.time.delayedCall(
                100,
                () => {
                    if (enemy.active) {
                        enemy.setScale(1);
                    }
                }
            );

            // Inimigo morreu
            if (enemy.hp <= 0) {

                enemy.disableBody(
                    true,
                    true
                );

                playerXP += 25;

                checkLevelUp();
            }
        }
    });
}

function playerHitEnemy(playerObject, enemy) {

    // Evita dano contínuo exagerado
    if (!enemy.lastHit) {
        enemy.lastHit = 0;
    }

    const now = Date.now();

    if (now < enemy.lastHit + 1000) {
        return;
    }

    enemy.lastHit = now;

    playerHP -= enemy.damage;

    if (playerHP <= 0) {

        playerHP = 0;

        // Futuramente teremos uma tela de Game Over
        player.body.setVelocity(
            0,
            0
        );

        console.log("O samurai foi derrotado!");
    }

    updateHUD();
}

function checkLevelUp() {

    const requiredXP = playerLevel * 100;

    if (playerXP >= requiredXP) {

        playerXP -= requiredXP;

        playerLevel++;

        playerHP = 100;

        console.log(
            "Novo nível:",
            playerLevel
        );
    }
}

function updateHUD() {

    if (!hpText) return;

    hpText.setText(
        `❤️ Vida: ${playerHP}/100`
    );

    xpText.setText(
        `⭐ XP: ${playerXP}`
    );

    levelText.setText(
        `⚔️ Nível: ${playerLevel}`
    );
}