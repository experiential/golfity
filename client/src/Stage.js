import Scene from './Scene'

export default class Stage {

    constructor() {
        this.setup();
        this.onResize();
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('resize', () => { this.onResize() });
    }

    setup() {
        this.mainScene = new Scene();
    }

    onResize() {
        const scl = APP.Layout.isMobile ? 0.7 : 1;

        this.mainScene.scene.scale.set(scl, scl, scl);
    }
}
