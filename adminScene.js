class AdminScene extends Phaser.Scene {
    constructor() {
        super('AdminScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const adminText = `Экран для админа\nВаш ID: ${this.registry.get('userId')}`;
        this.add.text(width / 2, height / 2, adminText, { 
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
    }
}