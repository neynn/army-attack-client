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
import { Button } from "./ui/elements/button.js";

export const GameContext = function(fps = 60) {
    this.id = "GAME_CONTEXT";
    this.settings = {};
    this.client = new Client();
    this.renderer = new Renderer();
    this.timer = new Timer(fps);
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.world = new World();
    this.states = new StateMachine(this);

    this.timer.input = (realTime, deltaTime) => {
        this.client.update();
    }

    this.timer.update = (gameTime, fixedDeltaTime) => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = (realTime, deltaTime) => {
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.uiManager.update(this);
        this.renderer.update(this);
    }

    this.addClickEvent();
}

GameContext.prototype.addClickEvent = function() {
    const { cursor } = this.client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, EventEmitter.SUPER_SUBSCRIBER_ID, () => {
        const clickedElements = this.uiManager.getCollidedElements(cursor.position.x, cursor.position.y, cursor.radius);

        for(const element of clickedElements) {
            element.events.emit(Button.EVENT_CLICKED);
        }
    });
}

GameContext.prototype.start = function() {
    this.world.actionQueue.start();
    this.timer.start();
}

GameContext.prototype.end = function() {
    this.world.actionQueue.end();
    this.world.entityManager.end();
    this.spriteManager.clear();
    this.tileManager.end();
    this.uiManager.end();
}

GameContext.prototype.loadResources = function(resources) {
    this.client.musicPlayer.load(resources.music);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.settings.socket);
    this.world.actionQueue.load(resources.actions);
    this.world.mapManager.load(resources.maps);
    this.world.controllerManager.load(resources.controllers);
    this.spriteManager.load(resources.sprites);
    this.tileManager.load(resources.tiles, resources.tileMeta);
    this.uiManager.load(resources.interfaces, resources.icons, resources.fonts);
    this.world.entityManager.load(resources.entities, resources.traits);
    this.settings = resources.settings;
    this.world.config = resources.world;
}

GameContext.prototype.initialize = function() {}

GameContext.prototype.getCameraAtMouse = function() {
    const camera = this.renderer.getCollidedCamera(this.client.cursor.position.x, this.client.cursor.position.y, this.client.cursor.radius);

    return camera;
}

GameContext.prototype.getMouseTile = function() {
    const camera = this.getCameraAtMouse();

    if(!camera) {
        return {
            "x": -1,
            "y": -1
        }
    }

    const mouseTile = camera.screenToWorldTile(this.client.cursor.position.x, this.client.cursor.position.y);

    return mouseTile;
}

GameContext.prototype.getMouseEntity = function() {
    const { x, y } = this.getMouseTile();
    const mouseEntity = this.world.getTileEntity(x, y);
    
    return mouseEntity;
}

GameContext.prototype.clearEvents = function() {
    this.client.cursor.events.unsubscribeAll(this.id);
    this.client.keyboard.events.unsubscribeAll(this.id);
    this.client.socket.events.unsubscribeAll(this.id);
    this.renderer.events.unsubscribeAll(this.id);
    this.world.actionQueue.events.unsubscribeAll(this.id);
}

GameContext.prototype.getID = function() {
    return this.id;
}

GameContext.prototype.switchState = function(stateID) {
    if(!this.states.hasState(stateID)) {
        return;
    }

    this.clearEvents();
    this.states.setNextState(stateID);
}