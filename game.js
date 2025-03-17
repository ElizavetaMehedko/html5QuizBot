// Замените этот ID на ваш реальный ADMIN_CHAT_ID из server.py
const ADMIN_CHAT_ID = '167509764'; // ID администратора

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
        }).setOrigin(0.5); // Центрируем текст
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
        }).setOrigin(0.5); // Центрируем текст
    }
}

// Основная сцена для проверки userId
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        // Временно захардкодим userId для теста
        const userId = '167509764'; // Для админа используйте ваш ADMIN_CHAT_ID, для игрока — другой ID
        console.log('User ID:', userId);

        // Проверяем, является ли пользователь администратором
        if (userId === ADMIN_CHAT_ID) {
            console.log('Starting AdminScene');
            this.scene.start('AdminScene');
        } else {
            console.log('Starting PlayerScene');
            this.scene.start('PlayerScene');
        }
    }
}

// Конфигурация Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Убедитесь, что в HTML есть <div id="game-container"></div>
    scene: [MainScene, AdminScene, PlayerScene]
};

// Создаём игру
console.log('Creating Phaser game instance');
const game = new Phaser.Game(config);