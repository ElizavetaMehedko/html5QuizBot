// Сцены для Phaser
class AdminMainScene extends Phaser.Scene {
    constructor() { super('AdminMainScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        console.log("AdminMainScene: User data:", user); // Логирование для отладки
        if (!user || user.id !== 167509764) { // Замените на ID админа
            console.log("Not an admin, redirecting to PlayerWaitingScene");
            this.scene.start('PlayerWaitingScene');
            return;
        }
        this.add.text(width * 0.05, height * 0.05, 'Панель администратора', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        const buttons = ['Выбор тура', 'Конец тура', 'Таблица лидеров', 'Дополнительные баллы'];
        buttons.forEach((text, index) => {
            this.add.text(width * 0.05, height * 0.2 + index * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleAdminAction(text));
        });
    }
    handleAdminAction(action) {
        if (action === 'Выбор тура') this.scene.start('AdminTourSelectionScene');
        else if (action === 'Конец тура') this.endTour();
        else if (action === 'Таблица лидеров') this.showLeaderboard();
        else if (action === 'Дополнительные баллы') this.scene.start('AdminPointsScene');
    }
    endTour() {
        fetch('http://localhost:5000/api/end_tour', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: this.registry.get('tourId') })
        }).then(() => this.scene.start('AdminMainScene'));
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
            this.add.text(width * 0.05, height * 0.2 + index * 60, text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.startTour(text));
        });
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
              this.scene.start('PlayerGameScene');
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
    }
}

class PlayerWaitingScene extends Phaser.Scene {
    constructor() { super('PlayerWaitingScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        this.add.text(width * 0.05, height * 0.05, 'Ожидайте начала тура', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
    }
}

class PlayerGameScene extends Phaser.Scene {
    constructor() { super('PlayerGameScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#333333');
        fetch('http://localhost:5000/api/current_tour')
            .then(response => response.json())
            .then(data => {
                this.registry.set('tourId', data.id);
                this.registry.set('mode', data.mode);
                this.registry.set('correctAnswer', data.correct_answer ? parseInt(data.correct_answer) : null);
                this.startPlayerGame();
            });
    }
    startPlayerGame() {
        const mode = this.registry.get('mode');
        if (mode === 'buttons') this.startButtonsMode();
        else if (mode === 'numbers') this.startNumbersMode();
        else if (mode === 'fastest') this.startFastestMode();
    }
    startButtonsMode() {
        this.add.text(width * 0.05, height * 0.05, 'Выберите лишний кадр:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        const options = ['Кадр 1', 'Кадр 2', 'Кадр 3', 'Кадр 4'];
        options.forEach((text, index) => {
            this.add.text(width * 0.05, height * 0.15 + index * (height * 0.1), text, { 
                fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
            }).setPadding(10).setInteractive().on('pointerdown', () => this.handleButtonClick(index + 1));
        });
    }
    startNumbersMode() {
        this.add.text(width * 0.05, height * 0.05, 'Введите число:', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.inputField = this.add.dom(width * 0.5, height * 0.3, 'input', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666', padding: 10 
        }, '').setOrigin(0.5);
        this.add.text(width * 0.5, height * 0.4, 'Отправить', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
        }).setOrigin(0.5).setPadding(10).setInteractive().on('pointerdown', () => this.handleNumberSubmit());
    }
    startFastestMode() {
        this.add.text(width * 0.05, height * 0.05, 'Кто быстрее?', { 
            fontSize: '28px', color: '#ffffff', wordWrap: { width: width * 0.9 }
        });
        this.add.text(width * 0.5, height * 0.3, 'Нажми меня!', { 
            fontSize: '20px', color: '#ffffff', backgroundColor: '#666666'
        }).setOrigin(0.5).setPadding(10).setInteractive().on('pointerdown', () => this.handleFastestClick());
    }
    handleButtonClick(answer) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (!user) return;
        let points = (answer === this.registry.get('correctAnswer')) ? 3 : 0;
        fetch('http://localhost:5000/api/submit_answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, tour_id: this.registry.get('tourId'), points, answer })
        }).then(() => {
            this.add.text(width * 0.05, height * 0.75, points ? 'Правильно!' : 'Неправильно!', { 
                fontSize: '20px', color: points ? '#00ff00' : '#ff0000'
            });
        });
    }
    handleNumberSubmit() {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (!user || !this.inputField) return;
        const answer = parseInt(this.inputField.node.value);
        if (isNaN(answer)) {
            this.add.text(width * 0.05, height * 0.75, 'Введите число!', { 
                fontSize: '20px', color: '#ff0000'
            });
            return;
        }
        fetch('http://localhost:5000/api/submit_answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, tour_id: this.registry.get('tourId'), points: 0, answer })
        }).then(() => {
            this.add.text(width * 0.05, height * 0.75, 'Ответ принят!', { 
                fontSize: '20px', color: '#00ff00'
            });
        });
    }
    handleFastestClick() {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (!user) return;
        fetch('http://localhost:5000/api/submit_answer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, tour_id: this.registry.get('tourId'), points: 0, answer: 'clicked' })
        }).then(() => {
            this.add.text(width * 0.05, height * 0.75, 'Вы нажали!', { 
                fontSize: '20px', color: '#00ff00'
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
    window.Telegram.WebApp.expand(); // Разворачиваем приложение на полный экран
}

width = Math.max(width, 360);
height = Math.max(height, 640);

const config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: 'game-container',
    scene: [AdminMainScene, AdminTourSelectionScene, AdminPointsScene, PlayerWaitingScene, PlayerGameScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
}