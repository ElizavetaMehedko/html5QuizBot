class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.add.text(100, 50, 'Выберите лишний кадр:', { fontSize: '32px', color: '#000' });

        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        const correctAnswer = 2;

        options.forEach((text, index) => {
            const button = this.add.text(100, 150 + index * 60, text, { fontSize: '24px', color: '#00f' })
                .setInteractive()
                .on('pointerdown', () => {
                    let resultText, points = 0;
                    if (index === correctAnswer) {
                        resultText = 'Правильно! +3 балла';
                        points = 3;
                        this.add.text(100, 450, resultText, { fontSize: '24px', color: '#0f0' });
                    } else {
                        resultText = 'Неправильно!';
                        this.add.text(100, 450, resultText, { fontSize: '24px', color: '#f00' });
                    }

                    if (window.Telegram && window.Telegram.WebApp) {
                        window.Telegram.WebApp.sendData(JSON.stringify({
                            user: window.Telegram.WebApp.initDataUnsafe.user,
                            points: points
                        }));
                        window.Telegram.WebApp.close();
                    }
                });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#a0a0a0',
    scene: GameScene
};

new Phaser.Game(config);

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
}