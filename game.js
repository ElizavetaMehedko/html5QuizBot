// Сцены для Phaser
class AdminMainScene extends Phaser.Scene {
    constructor() { super('AdminMainScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log("AdminMainScene: User data:", user);
        if (!user || user.id !== 167509764) {
            console.log("No user data or not admin, redirecting to PlayerWaitingScene");
            this.scene.start('PlayerWaitingScene');
            return;
        }
        console.log("User is admin, showing AdminMainScene");
        this.add.text(width * 0.05, height * 0.05, 'Панель администратора', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.addAdminPanel();
    }
    addAdminPanel() {
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            this.add.text(width * 0.05 + col * (width * 0.45), height * 0.75 + row * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.scene.start('AdminEndTourScene');
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    showLeaderboard() {
        fetch('https://telegram-quiz-game.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching leaderboard:", error);
            });
    }
}

class AdminTourSelectionScene extends Phaser.Scene {
    constructor() { super('AdminTourSelectionScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Выберите тур:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        const tours = ['Лишний кадр', 'Числа', 'Кто быстрее'];
        tours.forEach((text, index) => {
            this.add.text(width * 0.05, height * 0.15 + index * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.startTour(text));
        });
        this.addAdminPanel();
    }
    addAdminPanel() {
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            this.add.text(width * 0.05 + col * (width * 0.45), height * 0.75 + row * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.scene.start('AdminEndTourScene');
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    startTour(mode) {
        const initData = Telegram.WebApp.initDataUnsafe;
        const userId = initData.user ? initData.user.id : null;
        if (!userId) {
            this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.4, 'Ошибка: Нет данных пользователя!', {
                fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
            });
            return;
        }
        const tour = this.registry.get('tourName') || `Тур ${new Date().toISOString().slice(0, 10)}`;
        fetch('https://html5quizbot.onrender.com/api/start_tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode || 'extra_frame', name: tour, user_id: userId })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("Tour started:", data);
            this.registry.set('tourId', data.tour_id);
            this.registry.set('tourName', tour);
            this.scene.start('AdminGameScene');
        })
        .catch(error => {
            console.error("Error:", error);
            this.add.text(this.cameras.main.width * 0.05, this.cameras.main.height * 0.4, 'Ошибка при запуске тура!', {
                fontSize: '20px', color: '#ff0000', wordWrap: { width: this.cameras.main.width * 0.9 }
            });
        });
    }
    showLeaderboard() {
        fetch('https://telegram-quiz-game.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching leaderboard:", error);
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

class AdminEndTourScene extends Phaser.Scene {
    constructor() { super('AdminEndTourScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Введите правильный кадр:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.inputField = this.add.dom(width * 0.5, height * 0.2, 'input', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666', padding: 10 
        }, '').setOrigin(0.5);
        this.add.text(width * 0.5, height * 0.3, 'Отправить', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
        }).setOrigin(0.5).setPadding(10).setInteractive().on('pointerdown', () => this.submitCorrectFrame());
        this.addAdminPanel();
    }
    addAdminPanel() {
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            this.add.text(width * 0.05 + col * (width * 0.45), height * 0.75 + row * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.scene.start('AdminEndTourScene');
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    submitCorrectFrame() {
        const correctFrame = parseInt(this.inputField.node.value);
        if (isNaN(correctFrame) || correctFrame < 1 || correctFrame > 4) {
            this.add.text(width * 0.05, height * 0.4, 'Введите число от 1 до 4!', { 
                fontSize: '20px', color: '#ff0000'
            });
            return;
        }
        fetch('https://telegram-quiz-game.onrender.com/api/end_tour', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: this.registry.get('tourId'), correct_answer: correctFrame })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            this.scene.start('AdminTourResultsScene');
        })
        .catch(error => {
            console.error("Error ending tour:", error);
            this.add.text(width * 0.05, height * 0.4, 'Ошибка при завершении тура!', { 
                fontSize: '20px', color: '#ff0000', wordWrap: { width: width * 0.9 }
            });
        });
    }
    showLeaderboard() {
        fetch('https://telegram-quiz-game.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching leaderboard:", error);
            });
    }
}

class AdminTourResultsScene extends Phaser.Scene {
    constructor() { super('AdminTourResultsScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Результаты тура:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        fetch('https://telegram-quiz-game.onrender.com/api/tour_results?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                let text = 'Результаты:\n';
                data.results.forEach(result => {
                    text += `${result.name}: Кадр ${result.answer}, ${result.points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.15, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching tour results:", error);
            });
        this.addAdminPanel();
    }
    addAdminPanel() {
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            this.add.text(width * 0.05 + col * (width * 0.45), height * 0.75 + row * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.scene.start('AdminEndTourScene');
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    showLeaderboard() {
        fetch('https://telegram-quiz-game.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching leaderboard:", error);
            });
    }
}

class AdminPointsScene extends Phaser.Scene {
    constructor() { super('AdminPointsScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Начисление баллов', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        const input = this.add.dom(width * 0.5, height * 0.2, 'input', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666', padding: 10 
        }, '').setOrigin(0.5);
        const buttons = ['-1', '+1', '-0.25', '+0.25', 'Отправить'];
        let points = 0;
        buttons.forEach((text, index) => {
            this.add.text(width * 0.05 + (index % 3) * 80, height * 0.3 + Math.floor(index / 3) * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => {
                if (text === '-1') points -= 1;
                else if (text === '+1') points += 1;
                else if (text === '-0.25') points -= 0.25;
                else if (text === '+0.25') points += 0.25;
                else if (text === 'Отправить') {
                    const playerName = input.node.value;
                    const user = window.Telegram.WebApp.initDataUnsafe.user;
                    fetch('https://telegram-quiz-game.onrender.com/api/submit_answer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user_id: user ? user.id : 0,
                            tour_id: this.registry.get('tourId') || 0,
                            points: points,
                            answer: playerName
                        })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                        return response.json();
                    })
                    .then(() => {
                        this.scene.start('AdminMainScene');
                    })
                    .catch(error => {
                        console.error("Error submitting points:", error);
                        this.add.text(width * 0.05, height * 0.4, 'Ошибка при начислении баллов!', { 
                            fontSize: '20px', color: '#ff0000'
                        });
                    });
                }
            });
        });
        this.addAdminPanel();
    }
    addAdminPanel() {
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            this.add.text(width * 0.05 + col * (width * 0.45), height * 0.75 + row * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.scene.start('AdminEndTourScene');
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    showLeaderboard() {
        fetch('https://telegram-quiz-game.onrender.com/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching leaderboard:", error);
            });
    }
}

class PlayerWaitingScene extends Phaser.Scene {
    constructor() { super('PlayerWaitingScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log("PlayerWaitingScene: User data:", user);
        this.add.text(width * 0.05, height * 0.05, 'Ожидайте начала тура', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        if (user && user.id === 167509764) {
            console.log("Admin detected in PlayerWaitingScene, switching to AdminMainScene");
            this.scene.start('AdminMainScene');
        } else if (user) {
            fetch('https://telegram-quiz-game.onrender.com/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, name: user.first_name || 'Unknown' })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Player registered:", data);
                this.checkTour();
                this.time.addEvent({ delay: 2000, callback: this.checkTour, callbackScope: this, loop: true });
            })
            .catch(error => {
                console.error("Error registering player:", error);
                this.add.text(width * 0.05, height * 0.15, 'Ошибка регистрации!', { 
                    fontSize: '20px', color: '#ff0000'
                });
            });
        } else {
            this.add.text(width * 0.05, height * 0.15, 'Ошибка: Нет данных пользователя!', { 
                fontSize: '20px', color: '#ff0000'
            });
        }
    }
    checkTour() {
        fetch('https://telegram-quiz-game.onrender.com/api/current_tour')
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    this.registry.set('tourId', data.id);
                    this.registry.set('mode', data.mode);
                    this.registry.set('tourName', data.name);
                    this.scene.start('PlayerGameScene');
                }
            })
            .catch(error => {
                console.error("Error checking tour status:", error);
            });
    }
}

class PlayerGameScene extends Phaser.Scene {
    constructor() { super('PlayerGameScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        const tourName = this.registry.get('tourName');
        this.add.text(width * 0.05, height * 0.05, tourName, { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        if (this.registry.get('mode') === 'buttons') this.startButtonsMode();
        this.checkTourEnded();
        this.time.addEvent({ delay: 2000, callback: this.checkTourEnded, callbackScope: this, loop: true });
    }
    startButtonsMode() {
        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        options.forEach((text, index) => {
            this.add.text(width * 0.05, height * 0.15 + index * (height * 0.1), text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleButtonClick(index + 1));
        });
    }
    handleButtonClick(answer) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (!user) return;
        fetch('https://telegram-quiz-game.onrender.com/api/submit_answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, tour_id: this.registry.get('tourId'), points: 0, answer })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(() => {
            this.add.text(width * 0.05, height * 0.75, 'Ответ принят!', { 
                fontSize: '20px', color: '#00ff00'
            });
        })
        .catch(error => {
            console.error("Error submitting answer:", error);
            this.add.text(width * 0.05, height * 0.75, 'Ошибка при отправке ответа!', { 
                fontSize: '20px', color: '#ff0000'
            });
        });
    }
    checkTourEnded() {
        fetch('https://telegram-quiz-game.onrender.com/api/current_tour')
            .then(response => response.json())
            .then(data => {
                if (data.id && data.status === 'finished') {
                    this.scene.start('PlayerTourResultsScene');
                }
            })
            .catch(error => {
                console.error("Error checking tour end:", error);
            });
    }
}

class PlayerTourResultsScene extends Phaser.Scene {
    constructor() { super('PlayerTourResultsScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Результаты тура:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        fetch('https://telegram-quiz-game.onrender.com/api/tour_results?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                let text = 'Результаты:\n';
                data.results.forEach(result => {
                    text += `${result.name}: Кадр ${result.answer}, ${result.points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.15, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            })
            .catch(error => {
                console.error("Error fetching tour results:", error);
            });
    }
}

let width = window.innerWidth || document.documentElement.clientWidth || 360;
let height = window.innerHeight || document.documentElement.clientHeight || 640;

if (window.Telegram && window.Telegram.WebApp) {
    const viewport = window.Telegram.WebApp.viewportStableHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    width = Math.min(viewportWidth, 800);
    height = Math.min(viewport, 600);
    window.Telegram.WebApp.expand();
    console.log("Telegram WebApp initialized, initData:", window.Telegram.WebApp.initData);
}

width = Math.max(width, 360);
height = Math.max(height, 640);

const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game-container',
    scene: [AdminMainScene, AdminTourSelectionScene, AdminGameScene, AdminEndTourScene, AdminTourResultsScene, AdminPointsScene, PlayerWaitingScene, PlayerGameScene, PlayerTourResultsScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
}