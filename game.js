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
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
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
    startTour(tour) {
        let mode = 'buttons';
        if (tour === 'Числа') mode = 'numbers';
        else if (tour === 'Кто быстрее') mode = 'fastest';
        fetch('http://localhost:5000/api/start_tour', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode, name: tour })
        }).then(response => response.json())
          .then(data => {
              this.registry.set('tourId', data.tour_id);
              this.registry.set('tourName', tour);
              this.scene.start('AdminGameScene');
          });
    }
    showLeaderboard() {
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
            });
    }
}

class AdminGameScene extends Phaser.Scene {
    constructor() { super('AdminGameScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        const tourName = this.registry.get('tourName');
        this.add.text(width * 0.05, height * 0.05, tourName, { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.answersText = this.add.text(width * 0.05, height * 0.15, 'Ожидание ответов...', { 
            fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.updateAnswers();
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
    updateAnswers() {
        fetch('http://localhost:5000/api/tour_answers?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                let text = 'Ответы игроков:\n';
                data.answers.forEach(answer => {
                    text += `${answer.name}: Кадр ${answer.answer}\n`;
                });
                this.answersText.setText(text);
            });
    }
    showLeaderboard() {
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
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
        fetch('http://localhost:5000/api/end_tour', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: this.registry.get('tourId'), correct_answer: correctFrame })
        }).then(() => this.scene.start('AdminTourResultsScene'));
    }
    showLeaderboard() {
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
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
        fetch('http://localhost:5000/api/tour_results?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                let text = 'Результаты:\n';
                data.results.forEach(result => {
                    text += `${result.name}: Кадр ${result.answer}, ${result.points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.15, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
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
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
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
                    fetch('http://localhost:5000/api/submit_answer', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: 0, tour_id: 0, points: points, answer: playerName })
                    });
                    this.scene.start('AdminMainScene');
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
        fetch('http://localhost:5000/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                let text = '🏆 Таблица лидеров:\n';
                data.leaderboard.forEach((player, i) => {
                    text += `${i + 1}. ${player.name}: ${player.total_points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.2, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
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
        } else {
            this.add.text(width * 0.5, height * 0.75, 'Обновить статус', { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setOrigin(0.5).setPadding(10).setInteractive().on('pointerdown', () => this.checkTour());
        }
    }
    checkTour() {
        fetch('http://localhost:5000/api/current_tour')
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    this.registry.set('tourId', data.id);
                    this.registry.set('mode', data.mode);
                    this.registry.set('tourName', data.name);
                    this.scene.start('PlayerGameScene');
                }
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
        this.add.text(width * 0.5, height * 0.75, 'Обновить статус', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
        }).setOrigin(0.5).setPadding(10).setInteractive().on('pointerdown', () => this.checkTourEnded());
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
        fetch('http://localhost:5000/api/submit_answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, tour_id: this.registry.get('tourId'), points: 0, answer })
        }).then(() => {
            this.add.text(width * 0.05, height * 0.75, 'Ответ принят!', { 
                fontSize: '20px', color: '#00ff00'
            });
        });
    }
    checkTourEnded() {
        fetch('http://localhost:5000/api/tour_status?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                if (data.ended) {
                    this.scene.start('PlayerTourResultsScene');
                }
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
        fetch('http://localhost:5000/api/tour_results?tour_id=' + this.registry.get('tourId'))
            .then(response => response.json())
            .then(data => {
                let text = 'Результаты:\n';
                data.results.forEach(result => {
                    text += `${result.name}: Кадр ${result.answer}, ${result.points} баллов\n`;
                });
                this.add.text(width * 0.05, height * 0.15, text, { 
                    fontSize: '20px', color: '#ffffff', wordWrap: { width: width * 0.9 }
                });
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