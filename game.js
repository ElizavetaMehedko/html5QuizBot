class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Тёмно-серый фон игры (через Phaser)
        this.cameras.main.setBackgroundColor('#333333');

        // Адаптивный текст и кнопки
        const fontSizeTitle = Math.min(32, height * 0.05); // Шрифт до 32px, но не больше 5% высоты
        this.add.text(width * 0.1, height * 0.05, 'Выберите лишний кадр:', { 
            fontSize: fontSizeTitle + 'px', 
            color: '#ffffff' 
        });

        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        const correctAnswer = 2;
        const buttonFontSize = Math.min(24, height * 0.04); // Шрифт до 24px, но не больше 4% высоты

        options.forEach((text, index) => {
            const button = this.add.text(width * 0.1, height * 0.15 + index * (height * 0.1), text, { 
                fontSize: buttonFontSize + 'px', 
                color: '#ffffff', 
                backgroundColor: '#666666' // Средне-серые кнопки
            })
            .setPadding(10) // Добавляем отступы внутри кнопки
            .setInteractive()
            .on('pointerdown', () => {
                let resultText, points = 0;
                if (index === correctAnswer) {
                    resultText = 'Правильно! +3 балла';
                    points = 3;
                    this.add.text(width * 0.1, height * 0.75, resultText, { 
                        fontSize: buttonFontSize + 'px', 
                        color: '#00ff00' // Зелёный для "Правильно!"
                    });
                } else {
                    resultText = 'Неправильно!';
                    this.add.text(width * 0.1, height * 0.75, resultText, { 
                        fontSize: buttonFontSize + 'px', 
                        color: '#ff0000' // Красный для "Неправильно!"
                    });
                }

                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        user: window.Telegram.WebApp.initDataUnsafe.user,
                        points: points
                    }));
                    // window.Telegram.WebApp.close(); // Закомментировано, если не нужно закрытие
                }
            });
        });
    }
}

// Устанавливаем размеры с fallback
let width = window.innerWidth || document.documentElement.clientWidth || 360;
let height = window.innerHeight || document.documentElement.clientHeight || 640;

if (window.Telegram && window.Telegram.WebApp) {
    const viewport = window.Telegram.WebApp.viewportStableHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    width = Math.min(viewportWidth, 800);
    height = Math.min(viewport, 600);
}

// Минимальные размеры
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