class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.state = { mode: null, correctAnswer: null, participants: {} };
    }

    preload() {
        // Подключение к базе данных через Web API (будет реализована позже)
    }

    create() {
        this.cameras.main.setBackgroundColor('#333333');

        const fontSizeTitle = Math.min(28, height * 0.05);
        const titleText = this.add.text(width * 0.05, height * 0.05, 'Выберите лишний кадр:', { 
            fontSize: fontSizeTitle + 'px', 
            color: '#ffffff',
            wordWrap: { width: width * 0.9, useAdvancedWrap: true }
        });

        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        const buttonFontSize = Math.min(20, height * 0.04);

        options.forEach((text, index) => {
            const button = this.add.text(width * 0.05, height * 0.15 + index * (height * 0.1), text, { 
                fontSize: buttonFontSize + 'px', 
                color: '#ffffff', 
                backgroundColor: '#666666'
            })
            .setPadding(10)
            .setInteractive()
            .on('pointerdown', () => this.handleClick(index, text));
        });

        if (window.Telegram && window.Telegram.WebApp) {
            this.updateGameState();
        }
    }

    handleClick(index, text) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (!user || !this.state.mode) return;

        this.state.participants[user.id] = { name: user.first_name, answer: index + 1 };
        let resultText, points = 0;
        if (index + 1 === this.state.correctAnswer) {
            resultText = 'Правильно! +3 балла';
            points = 3;
            this.add.text(width * 0.05, height * 0.75, resultText, { 
                fontSize: '20px', 
                color: '#00ff00' 
            });
        } else {
            resultText = 'Неправильно!';
            this.add.text(width * 0.05, height * 0.75, resultText, { 
                fontSize: '20px', 
                color: '#ff0000' 
            });
        }

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({
                user: user,
                points: points,
                mode: this.state.mode,
                answer: index + 1
            }));
            // Не закрываем, чтобы показать результат
        }
    }

    updateGameState() {
        // Здесь будет запрос к серверу для получения текущего тура и правильного ответа
        // Пока имитация
        this.state.mode = 'buttons';
        this.state.correctAnswer = 2; // Пример
    }
}

let width = window.innerWidth || document.documentElement.clientWidth || 360;
let height = window.innerHeight || document.documentElement.clientHeight || 640;

if (window.Telegram && window.Telegram.WebApp) {
    const viewport = window.Telegram.WebApp.viewportStableHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    width = Math.min(viewportWidth, 800);
    height = Math.min(viewport, 600);
}

width = Math.max(width, 360);
height = Math.max(height, 640);

const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game-container',
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