// Подключение Telegram WebApp
const Telegram = window.Telegram;
Telegram.WebApp.ready();
const initData = Telegram.WebApp.initDataUnsafe;

// Подключение сцен (должны быть определены до конфигурации)
console.log('Loading scenes...');

// Конфигурация Phaser
const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
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