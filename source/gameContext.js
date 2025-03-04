import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { SpriteManager } from "./graphics/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { TileManager } from "./tile/tileManager.js";
import { Renderer } from "./renderer.js";
import { World } from "./world.js";

export const GameContext = function() {
    this.id = "GAME_CONTEXT";
    this.client = new Client();
    this.renderer = new Renderer();
    this.timer = new Timer();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.world = new World();
    this.states = new StateMachine(this);

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

    this.renderer.events.subscribe(Renderer.EVENT.SCREEN_RESIZE, EventEmitter.SUPER_ID, (width, height) => {
        this.uiManager.onWindowResize(width, height);
    });

    this.client.cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_CLICK, EventEmitter.SUPER_ID, (cursorX, cursorY) => {
        this.uiManager.onClick(cursorX, cursorY, this.client.cursor.radius);
    });
}

GameContext.prototype.start = function() {
    this.world.actionQueue.start();
    this.timer.start();
}

GameContext.prototype.exit = function() {
    this.world.exit();
    this.spriteManager.clear();
    this.uiManager.exit();
}

GameContext.prototype.loadResources = function(resources) {
    this.client.musicPlayer.load(resources.music);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.network.socket);
    this.world.actionQueue.load(resources.actions);
    this.world.mapManager.load(resources.maps);
    this.spriteManager.load(resources.sprites);
    this.tileManager.load(resources.tiles, resources.tileMeta);
    this.uiManager.load(resources.interfaces, resources.icons, resources.fonts);
    this.world.entityManager.load(resources.traits);
    this.world.config = resources.world;
}

GameContext.prototype.init = function() {}

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

GameContext.prototype.clearEvents = function() {
    this.client.cursor.events.unsubscribeAll(this.id);
    this.client.keyboard.events.unsubscribeAll(this.id);
    this.client.socket.events.unsubscribeAll(this.id);
    this.renderer.events.unsubscribeAll(this.id);
    this.world.actionQueue.events.unsubscribeAll(this.id);
}

GameContext.prototype.switchState = function(stateID) {
    if(!this.states.hasState(stateID)) {
        return;
    }

    this.clearEvents();
    this.states.setNextState(stateID);
}