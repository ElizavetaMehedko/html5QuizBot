class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Получаем role из URL
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role');

        // Получаем userId только из initData
        const userId = initData && initData.user ? initData.user.id.toString() : null;

        // Логи для отладки
        console.log('Full initData:', JSON.stringify(initData, null, 2));
        console.log('User ID from initData:', userId || 'Не доступно');
        console.log('Role from URL:', role);

        // Проверка наличия userId
        if (!userId) {
            const errorText = 'Ошибка: Нет данных пользователя.\nОткройте через Telegram.\nURL: ' + window.location.href;
            this.add.text(width / 2, height / 2, errorText, { 
                fontSize: '16px',
                color: '#ff0000',
                align: 'center',
                wordWrap: { width: width - 40 }
            }).setOrigin(0.5);
            return;
        }

        // Сохраняем userId для отображения в сценах
        this.registry.set('userId', userId);

        // Проверяем роль из URL
        if (role === 'admin') {
            console.log('Starting AdminScene for user:', userId);
            this.scene.start('AdminScene');
        } else if (role === 'player') {
            console.log('Starting PlayerScene for user:', userId);
            this.scene.start('PlayerScene');
        } else {
            this.add.text(width / 2, height / 2, 'Ошибка: Роль не определена.', { 
                fontSize: '16px',
                color: '#ff0000',
                align: 'center',
                wordWrap: { width: width - 40 }
            }).setOrigin(0.5);
        }
    }
}