// Подключение Telegram WebApp
const Telegram = window.Telegram;
Telegram.WebApp.ready();
const initData = Telegram.WebApp.initDataUnsafe;

// Сцена для администратора
class AdminScene extends Phaser.Scene {
    constructor() {
        super('AdminScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.text(width / 2, height / 2, 'Экран для админа', { 
            fontSize: '24px', 
            color: '#ffffff' 
        }).setOrigin(0.5);
    }
}

// Сцена для игроков
class PlayerScene extends Phaser.Scene {
    constructor() {
        super('PlayerScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.text(width / 2, height / 2, 'Привет, игрок!', { 
            fontSize: '24px', 
            color: '#ffffff' 
        }).setOrigin(0.5);
    }
}

// Основная сцена для проверки userId
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Получаем userId из Telegram или URL
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromUrl = urlParams.get('userId');
        const userId = initData && initData.user ? initData.user.id.toString() : userIdFromUrl;

        // Логи для отладки
        console.log('Full initData:', JSON.stringify(initData, null, 2));
        console.log('User ID from URL or initData:', userId);

        // Проверка наличия userId
        if (!userId) {
            this.add.text(width / 2, height / 2, 'Ошибка: Нет данных пользователя.\nОткройте через Telegram.', { 
                fontSize: '20px', 
                color: '#ff0000', 
                align: 'center' 
            }).setOrigin(0.5);
            return;
        }

        // Запрашиваем ADMIN_CHAT_ID с сервера
        fetch('https://html5quizbot.onrender.com/api/admin_id')
            .then(response => response.json())
            .then(data => {
                const adminChatId = data.admin_chat_id;
                console.log('Admin Chat ID from server:', adminChatId);

                // Сравниваем userId с ADMIN_CHAT_ID
                if (userId === adminChatId) {
                    console.log('Starting AdminScene for user:', userId);
                    this.scene.start('AdminScene');
                } else {
                    console.log('Starting PlayerScene for user:', userId);
                    this.scene.start('PlayerScene');
                }
            })
            .catch(error => {
                console.error('Error fetching admin ID:', error);
                this.add.text(width / 2, height / 2, 'Ошибка загрузки данных админа.', { 
                    fontSize: '20px', 
                    color: '#ff0000', 
                    align: 'center' 
                }).setOrigin(0.5);
            });
    }
}

// Конфигурация Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [MainScene, AdminScene, PlayerScene]
};

// Создаём игру
console.log('Creating Phaser game instance');
const game = new Phaser.Game(config);