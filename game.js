class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.add.text(width * 0.1, height * 0.1, 'Выберите лишний кадр:', { fontSize: '32px', color: '#000' });

        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        const correctAnswer = 2;

        options.forEach((text, index) => {
            const button = this.add.text(width * 0.1, height * 0.2 + index * 60, text, { fontSize: '24px', color: '#00f' })
                .setInteractive()
                .on('pointerdown', () => {
                    let resultText, points = 0;
                    if (index === correctAnswer) {
                        resultText = 'Правильно! +3 балла';
                        points = 3;
                        this.add.text(width * 0.1, height * 0.7, resultText, { fontSize: '24px', color: '#0f0' });
                    } else {
                        resultText = 'Неправильно!';
                        this.add.text(width * 0.1, height * 0.7, resultText, { fontSize: '24px', color: '#f00' });
                    }

                    if (window.Telegram && window.Telegram.WebApp) {
                        window.Telegram.WebApp.sendData(JSON.stringify({
                            user: window.Telegram.WebApp.initDataUnsafe.user,
                            points: points
                        }));
                        // window.Telegram.WebApp.close(); // Закомментировано
                    }
                });
        });
    }
}

let width = 360;
let height = 640;
if (window.Telegram && window.Telegram.WebApp) {
    const viewport = window.Telegram.WebApp.viewportStableHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    width = Math.min(viewportWidth, 800);
    height = Math.min(viewport, 600);
}

const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game-container',
    backgroundColor: '#a0a0a0',
    scene: GameScene,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

console.log("Phaser loaded:", typeof Phaser);
console.log("Phaser version:", Phaser.VERSION);
console.log("Game dimensions:", width, height);

new Phaser.Game(config);

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
}