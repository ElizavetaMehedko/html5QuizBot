// Подключение Telegram WebApp API
const Telegram = window.Telegram;

// Инициализация Telegram WebApp
Telegram.WebApp.ready();
const initData = Telegram.WebApp.initDataUnsafe;

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        console.log("MainScene create called"); // Добавляем отладочный лог
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Серый фон
        this.cameras.main.setBackgroundColor('#666666');

        // Логирование для отладки
        console.log("Telegram WebApp initData:", initData);

        // Проверка данных пользователя
        if (!initData || !initData.user) {
            console.error("No user data available");
            this.add.text(width * 0.5, height * 0.5, 'Ошибка: Нет данных пользователя.\nУбедитесь, что вы открыли приложение через Telegram.', { fontSize: '20px', color: '#ff0000', align: 'center' })
                .setOrigin(0.5);
            return;
        }

        const userId = initData.user.id;
        const userName = initData.user.first_name || "Unknown";
        this.registry.set('userId', userId);
        this.registry.set('userName', userName);

        // Проверка, зарегистрирован ли пользователь
        fetch('https://html5quizbot.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                console.log("Leaderboard data:", data);
                const player = data.leaderboard.find(p => p.id == userId);
                if (!player) {
                    this.add.text(width * 0.5, height * 0.5, 'Вы не зарегистрированы.\nПожалуйста, зарегистрируйтесь через бота.', { fontSize: '20px', color: '#ff0000', align: 'center' })
                        .setOrigin(0.5);
                    return;
                }

                // Отображение ожидания тура
                this.add.text(width * 0.5, height * 0.3, `Привет, ${userName}!`, { fontSize: '24px', color: '#ffffff' })
                    .setOrigin(0.5);
                this.waitText = this.add.text(width * 0.5, height * 0.5, 'Ожидайте начала тура...', { fontSize: '20px', color: '#ffffff' })
                    .setOrigin(0.5);

                // Проверка текущего тура
                this.checkTour();
            })
            .catch(error => {
                console.error('Error fetching leaderboard:', error);
                this.add.text(width * 0.5, height * 0.5, 'Ошибка загрузки данных.\nПопробуйте перезапустить приложение.', { fontSize: '20px', color: '#ff0000', align: 'center' })
                    .setOrigin(0.5);
            });
    }

    checkTour() {
        fetch('https://html5quizbot.onrender.com/api/current_tour')
            .then(response => response.json())
            .then(data => {
                console.log("Current tour data:", data);
                if (data.id) {
                    this.registry.set('tourId', data.id);
                    this.registry.set('tourName', data.name);
                    if (this.registry.get('userId') == ADMIN_CHAT_ID) {
                        this.scene.start('AdminGameScene');
                    } else {
                        this.scene.start('GameScene');
                    }
                } else {
                    setTimeout(() => this.checkTour(), 5000);
                }
            })
            .catch(error => {
                console.error('Error checking tour:', error);
                this.waitText.setText('Ошибка проверки тура...');
                setTimeout(() => this.checkTour(), 5000);
            });
    }
}

    checkTour() {
        fetch('https://html5quizbot.onrender.com/api/current_tour')
            .then(response => response.json())
            .then(data => {
                console.log("Current tour data:", data);
                if (data.id) {
                    this.registry.set('tourId', data.id);
                    this.registry.set('tourName', data.name);
                    if (this.registry.get('userId') == ADMIN_CHAT_ID) {
                        this.scene.start('AdminGameScene');
                    } else {
                        this.scene.start('GameScene');
                    }
                } else {
                    setTimeout(() => this.checkTour(), 5000);
                }
            })
            .catch(error => {
                console.error('Error checking tour:', error);
                this.waitText.setText('Ошибка проверки тура...');
                setTimeout(() => this.checkTour(), 5000);
            });
    }
}

class AdminGameScene extends Phaser.Scene {
    constructor() {
        super('AdminGameScene');
    }

    preload() {
        this.load.image('frame1', 'assets/frame1.png');
        this.load.image('frame2', 'assets/frame2.png');
        this.load.image('frame3', 'assets/frame3.png');
        this.load.image('frame4', 'assets/frame4.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const tourName = this.registry.get('tourName');

        // Серый фон
        this.cameras.main.setBackgroundColor('#666666');

        // Текст тура
        this.add.text(width * 0.05, height * 0.05, `Тур: ${tourName}`, { fontSize: '20px', color: '#ffffff' });

        // Отображение 4 кадров
        const frameWidth = width * 0.2;
        const frameHeight = height * 0.3;
        const frames = [
            this.add.image(width * 0.2, height * 0.3, 'frame1').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.4, height * 0.3, 'frame2').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.6, height * 0.3, 'frame3').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.8, height * 0.3, 'frame4').setDisplaySize(frameWidth, frameHeight)
        ];

        // Номера под кадрами
        frames.forEach((frame, index) => {
            this.add.text(frame.x - frameWidth / 4, frame.y + frameHeight / 2 + 10, `${index + 1}`, { fontSize: '16px', color: '#ffffff' });
        });

        // Текст инструкции
        this.add.text(width * 0.05, height * 0.5, 'Выберите лишний кадр:', { fontSize: '20px', color: '#ffffff' });

        // Кнопки выбора кадра
        const buttonWidth = width * 0.15;
        const buttonHeight = height * 0.1;
        const buttonSpacing = width * 0.05;

        for (let i = 1; i <= 4; i++) {
            const buttonX = width * 0.2 + (i - 1) * (buttonWidth + buttonSpacing);
            const buttonY = height * 0.65;

            const button = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x999999)
                .setStrokeStyle(2, 0x000000)
                .setInteractive();

            this.add.text(buttonX, buttonY, `${i}`, { fontSize: '20px', color: '#000000' })
                .setOrigin(0.5);

            button.on('pointerdown', () => {
                this.submitAnswer(i);
            });
        }

        // Кнопка "Конец тура"
        const endTourButton = this.add.rectangle(width * 0.5, height * 0.85, width * 0.3, height * 0.1, 0x999999)
            .setStrokeStyle(2, 0x000000)
            .setInteractive();

        this.add.text(width * 0.5, height * 0.85, 'Конец тура', { fontSize: '20px', color: '#000000' })
            .setOrigin(0.5);

        endTourButton.on('pointerdown', () => {
            this.endTour();
        });
    }

    submitAnswer(frameNumber) {
        const tourId = this.registry.get('tourId');
        fetch('https://html5quizbot.onrender.com/api/end_tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: tourId, correct_answer: frameNumber })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.scene.start('AdminResultsScene');
            } else {
                this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка при выборе кадра!', {
                    fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка при выборе кадра!', {
                fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
            });
        });
    }

    endTour() {
        const tourId = this.registry.get('tourId');
        fetch('https://html5quizbot.onrender.com/api/end_tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: tourId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.scene.start('AdminResultsScene');
            } else {
                this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка при завершении тура!', {
                    fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка при завершении тура!', {
                fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
            });
        });
    }
}

class AdminResultsScene extends Phaser.Scene {
    constructor() {
        super('AdminResultsScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const tourId = this.registry.get('tourId');

        // Серый фон
        this.cameras.main.setBackgroundColor('#666666');

        // Заголовок
        this.add.text(width * 0.5, height * 0.1, 'Результаты тура', { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5);

        // Загрузка результатов
        fetch(`https://html5quizbot.onrender.com/api/tour_results?tour_id=${tourId}`)
            .then(response => response.json())
            .then(data => {
                const results = data.results;
                let y = height * 0.2;
                if (results.length > 0) {
                    results.forEach((result, index) => {
                        this.add.text(width * 0.1, y, `${index + 1}. ${result.name}: ${result.answer} (${result.points} баллов)`, {
                            fontSize: '18px', color: '#ffffff'
                        });
                        y += height * 0.1;
                    });
                } else {
                    this.add.text(width * 0.5, height * 0.5, 'Нет результатов.', { fontSize: '20px', color: '#ffffff' })
                        .setOrigin(0.5);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.add.text(width * 0.5, height * 0.5, 'Ошибка загрузки результатов.', { fontSize: '20px', color: '#ff0000' })
                    .setOrigin(0.5);
            });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const tourId = this.registry.get('tourId');
        const userId = this.registry.get('userId');

        // Серый фон
        this.cameras.main.setBackgroundColor('#666666');

        // Заголовок
        this.add.text(width * 0.5, height * 0.1, 'Ваш ход', { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5);

        // Загрузка кадров (пример)
        const frameWidth = width * 0.2;
        const frameHeight = height * 0.3;
        const frames = [
            this.add.image(width * 0.2, height * 0.3, 'frame1').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.4, height * 0.3, 'frame2').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.6, height * 0.3, 'frame3').setDisplaySize(frameWidth, frameHeight),
            this.add.image(width * 0.8, height * 0.3, 'frame4').setDisplaySize(frameWidth, frameHeight)
        ];

        // Номера под кадрами
        frames.forEach((frame, index) => {
            this.add.text(frame.x - frameWidth / 4, frame.y + frameHeight / 2 + 10, `${index + 1}`, { fontSize: '16px', color: '#ffffff' });
        });

        // Кнопки выбора кадра
        const buttonWidth = width * 0.15;
        const buttonHeight = height * 0.1;
        const buttonSpacing = width * 0.05;

        for (let i = 1; i <= 4; i++) {
            const buttonX = width * 0.2 + (i - 1) * (buttonWidth + buttonSpacing);
            const buttonY = height * 0.65;

            const button = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x999999)
                .setStrokeStyle(2, 0x000000)
                .setInteractive();

            this.add.text(buttonX, buttonY, `${i}`, { fontSize: '20px', color: '#000000' })
                .setOrigin(0.5);

            button.on('pointerdown', () => {
                this.submitAnswer(i);
            });
        }
    }

    submitAnswer(frameNumber) {
        const tourId = this.registry.get('tourId');
        const userId = this.registry.get('userId');
        fetch('https://html5quizbot.onrender.com/api/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, tour_id: tourId, answer: frameNumber })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.scene.start('ResultsScene');
            } else {
                this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка отправки ответа!', {
                    fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.8, 'Ошибка отправки ответа!', {
                fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
            });
        });
    }
}

class ResultsScene extends Phaser.Scene {
    constructor() {
        super('ResultsScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const tourId = this.registry.get('tourId');
        const userId = this.registry.get('userId');

        // Серый фон
        this.cameras.main.setBackgroundColor('#666666');

        // Заголовок
        this.add.text(width * 0.5, height * 0.1, 'Ваши результаты', { fontSize: '24px', color: '#ffffff' })
            .setOrigin(0.5);

        // Загрузка результатов
        fetch(`https://html5quizbot.onrender.com/api/tour_results?tour_id=${tourId}`)
            .then(response => response.json())
            .then(data => {
                const results = data.results;
                let y = height * 0.2;
                const userResult = results.find(r => r.user_id == userId);
                if (userResult) {
                    this.add.text(width * 0.5, y, `Ваш ответ: ${userResult.answer} (${userResult.points} баллов)`, {
                        fontSize: '18px', color: '#ffffff'
                    }).setOrigin(0.5);
                    y += height * 0.1;
                } else {
                    this.add.text(width * 0.5, y, 'Ваши результаты не найдены.', { fontSize: '18px', color: '#ffffff' })
                        .setOrigin(0.5);
                    y += height * 0.1;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.add.text(width * 0.5, height * 0.5, 'Ошибка загрузки результатов.', { fontSize: '20px', color: '#ff0000' })
                    .setOrigin(0.5);
            });
    }
}

// Конфигурация игры
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [MainScene, AdminGameScene, AdminResultsScene, GameScene, ResultsScene]
};

const game = new Phaser.Game(config);