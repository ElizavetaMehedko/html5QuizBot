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

        // Текст для админа с переносом
        const adminText = `Экран для админа\nВаш ID: ${this.registry.get('userId')}`;
        this.add.text(width / 2, height / 2, adminText, { 
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
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

        // Текст для игрока с переносом
        const playerText = `Привет, игрок!\nВаш ID: ${this.registry.get('userId')}`;
        this.add.text(width / 2, height / 2, playerText, { 
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
    }
}

// Основная сцена для проверки роли
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Получаем userId и role из Telegram или URL
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromUrl = urlParams.get('userId');
        const role = urlParams.get('role');
        const userId = initData && initData.user ? initData.user.id.toString() : userIdFromUrl;

        // Логи для отладки
        console.log('Full initData:', JSON.stringify(initData, null, 2));
        console.log('User ID from URL or initData:', userId);
        console.log('Role from URL:', role);

        // Проверка наличия userId
        if (!userId) {
            this.add.text(width / 2, height / 2, 'Ошибка: Нет данных пользователя.\nОткройте через Telegram.', { 
                fontSize: '16px',
                color: '#ff0000',
                align: 'center',
                wordWrap: { width: width - 40 }
            }).setOrigin(0.5);
            return;
        }

        // Сохраняем userId для использования в сценах
        this.registry.set('userId', userId);

        // Проверяем роль из URL
        if (role === 'admin') {
            console.log('Starting AdminScene for user:', userId);
            this.scene.start('AdminScene');
        } else if (role === 'player') {
            console.log('Starting PlayerScene for user:', userId);
            this.scene.start('PlayerScene');
        } else {
            // Если role не указан, показываем ошибку
            this.add.text(width / 2, height / 2, 'Ошибка: Роль не определена.', { 
                fontSize: '16px',
                color: '#ff0000',
                align: 'center',
                wordWrap: { width: width - 40 }
            }).setOrigin(0.5);
        }
    }
}

// Конфигурация Phaser с новыми размерами
const config = {
    type: Phaser.AUTO,
    width: 360, // Новая ширина
    height: 640, // Новая высота
    parent: 'game-container',
    scene: [MainScene, AdminScene, PlayerScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Создаём игру
console.log('Creating Phaser game instance');
const game = new Phaser.Game(config);