import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { SpriteManager } from "./sprite/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { TileManager } from "./tile/tileManager.js";
import { Renderer } from "./renderer.js";
import { World } from "./world.js";
import { LanguageHandler } from "./languageHandler.js";

export const GameContext = function() {
    this.client = new Client();
    this.world = new World();
    this.renderer = new Renderer();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.language = new LanguageHandler();
    this.states = new StateMachine(this);
    this.timer = new Timer();
    
    this.timer.input = () => {
        this.client.update();
    }

    this.timer.update = () => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = () => {
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.uiManager.update(this);
        this.renderer.update(this);
    }

    this.renderer.events.on(Renderer.EVENT.SCREEN_RESIZE, (width, height) => {
        this.uiManager.onWindowResize(width, height);
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_CLICK, (buttonID, cursorX, cursorY) => {
        if(buttonID === Cursor.BUTTON.LEFT) {
            this.uiManager.onClick(cursorX, cursorY, this.client.cursor.radius);
        }
    }, { permanent: true });
}

GameContext.prototype.exit = function() {
    this.world.exit();
    this.renderer.exit();
    this.spriteManager.exit();
    this.uiManager.exit();
}

GameContext.prototype.loadResources = function(resources) {
    this.spriteManager.load(resources.sprites);
    this.tileManager.load(resources.tiles, resources.tileMeta);
    this.uiManager.load(resources.interfaces, resources.icons, resources.fonts);
    this.client.musicPlayer.load(resources.music);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.network.socket);
    this.world.actionQueue.load(resources.actions);
    this.world.mapManager.load(resources.maps);
    this.world.entityManager.load(resources.traits, resources.archetypes);
}

GameContext.prototype.getContextAtMouse = function() {
    const context = this.renderer.getCollidedContext(this.client.cursor.positionX, this.client.cursor.positionY, this.client.cursor.radius);

    if(!context) {
        return null;
    }

    return context;
}

GameContext.prototype.getMouseTile = function() {
    const context = this.getContextAtMouse();

    if(!context) {
        return {
            "x": -1,
            "y": -1
        }
    }

    const { x, y } = context.getWorldPosition(this.client.cursor.positionX, this.client.cursor.positionY);
    const camera = context.getCamera();
    const mouseTile = camera.transformPositionToTile(x, y);

    return mouseTile;
}

GameContext.prototype.switchState = function(stateID) {
    if(!this.states.hasState(stateID)) {
        return;
    }

    this.states.setNextState(stateID);
}