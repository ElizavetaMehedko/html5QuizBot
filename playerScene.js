class PlayerScene extends Phaser.Scene {
    constructor() {
        super('PlayerScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const playerText = `Привет, игрок!\nВаш ID: ${this.registry.get('userId')}`;
        this.add.text(width / 2, height / 2, playerText, { 
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
    }
}