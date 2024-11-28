import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { SpriteManager } from "./graphics/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { MapManager } from "./map/mapManager.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { UIElement } from "./ui/uiElement.js";
import { Logger } from "./logger.js";
import { SystemManager } from "./system/systemManager.js";
import { TileManager } from "./tile/tileManager.js";
import { Renderer } from "./renderer.js";
import { ControllerManager } from "./controller/controllerManager.js";
import { QuestManager } from "./questManager.js";
import { ClientQueue } from "./action/clientQueue.js";
import { ResourceManager } from "./resourceManager.js";

export const GameContext = function(fps = 60) {
    this.id = "GAME_CONTEXT";
    this.config = {};
    this.settings = {};
    this.client = new Client();
    this.renderer = new Renderer();
    this.timer = new Timer(fps);
    this.mapManager = new MapManager();
    this.questManager = new QuestManager();
    this.controllerManager = new ControllerManager();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.systemManager = new SystemManager();
    this.entityManager = new EntityManager();
    this.actionQueue = new ClientQueue();
    this.events = new EventEmitter();
    this.states = new StateMachine(this);
    this.resourceManager = new ResourceManager();

    this.timer.inputFunction = (realTime, deltaTime) => {
        this.client.update(this);
    }

    this.timer.updateFunction = (gameTime, fixedDeltaTime) => {
        this.actionQueue.update(this);
        this.systemManager.update(this);
        this.entityManager.update(this);
        this.controllerManager.update(this);
    }

    this.timer.renderFunction = (realTime, deltaTime) => {
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.uiManager.update(this);
        this.renderer.update(this);
    }
}

GameContext.prototype.onResourcesLoad = function(resources) {}

GameContext.prototype.loadResources = function(resources) {
    this.client.musicPlayer.load(resources.music);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.settings.socket);
    this.mapManager.load(resources.maps);
    this.spriteManager.load(resources.sprites);
    this.tileManager.load(resources.tiles, resources.tileMeta);
    this.uiManager.load(resources.uiConfig, resources.icons, resources.fonts);
    this.entityManager.load(resources.entities, resources.components, resources.traits);
    this.settings = resources.settings;
    this.config = resources.config;
}

GameContext.prototype.initialize = function() {}

GameContext.prototype.addUIClickEvent = function() {
    const { cursor } = this.client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, EventEmitter.SUPER_SUBSCRIBER_ID, () => {
        const clickedElements = this.uiManager.getCollidedElements(cursor.position.x, cursor.position.y, cursor.radius);

        for(const element of clickedElements) {
            element.events.emit(UIElement.EVENT_CLICKED);
        }
    });
}

GameContext.prototype.exitGame = function() {
    this.actionQueue.end();
    this.entityManager.end();
    this.spriteManager.end();
    this.tileManager.end();
    this.uiManager.end();
}

GameContext.prototype.getConfig = function(elementID) {
    if(!elementID) {
        return this.config;
    }

    if(this.config[elementID]) {
        return this.config[elementID];
    }

    Logger.error(false, "Element does not exist!", "GameContext.prototype.getConfig", { elementID });

    return {};
}

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

GameContext.prototype.getTileEntity = function(tileX, tileY) {
    const activeMap = this.mapManager.getActiveMap();

    if(!activeMap) {
        return null;
    }

    const entityID = activeMap.getFirstEntity(tileX, tileY);
    
    return this.entityManager.getEntity(entityID);
}

GameContext.prototype.getMouseEntity = function() {
    const { x, y } = this.getMouseTile();
    const mouseEntity = this.getTileEntity(x, y);
    
    return mouseEntity;
}

GameContext.prototype.lockPointer = function() {
    if(!this.client.cursor.isLocked) {
        this.renderer.display.canvas.requestPointerLock();
    }
}

GameContext.prototype.unlockPointer = function() {
    if(this.client.cursor.isLocked) {      
        document.exitPointerLock();
    }
}

GameContext.prototype.addLockEvent = function() {
    document.addEventListener("pointerlockchange", () => {
        if(document.pointerLockElement === this.renderer.display.canvas) {
            this.client.cursor.lock();
        } else {
            this.client.cursor.unlock();
        }
    });
}

GameContext.prototype.createController = function(setup, controllerID) {
    if(typeof setup !== "object") {
        Logger.error(false, "Setup does not exist!", "GameContext.prototype.createController", null);

        return null;
    }

    const { type } = setup;
    const controller = this.controllerManager.createController(type, controllerID);

    if(!controller) {
        return null;
    }

    controller.initialize(this, setup);

    return controller;
}

GameContext.prototype.onEntityCreate = function(entity) {}

GameContext.prototype.createEntity = function(setup, masterID, externalID) {
    if(typeof setup !== "object") {
        Logger.error(false, "Setup does not exist!", "GameContext.prototype.createEntity", null);

        return null;
    }

    const { type } = setup;
    const entity = this.entityManager.createEntity(type, externalID);
    const entityID = entity.getID();

    this.controllerManager.addEntity(masterID, entityID);
    this.entityManager.buildEntity(this, entity, type, setup);
    this.onEntityCreate(entity);

    return entity;
}

GameContext.prototype.onEntityDestroy = function(entity) {}

GameContext.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        return false;
    }

    this.controllerManager.removeEntity(entityID);
    this.entityManager.destroyEntity(entityID);
    this.onEntityDestroy(entity);

    return true;
}

GameContext.prototype.onMapLoad = function(gameMap) {}

GameContext.prototype.parseMap = async function(mapID, onParse) {
    if(!onParse) {
        Logger.log(false, "No parser given!", "GameContext.prototype.parseMap", { mapID });
        return false;
    }

    const parsedMap = await this.mapManager.parseMap(mapID, onParse);

    if(!parsedMap) {
        Logger.log(false, "Map could not be parsed!", "GameContext.prototype.parseMap", { mapID });
        return false;
    }

    this.loadMap(mapID, parsedMap);

    return true;
}

GameContext.prototype.loadMap = function(mapID, gameMap) {
    if(!gameMap) {
        return false;
    }
    
    this.mapManager.addMap(mapID, gameMap);
    this.mapManager.updateActiveMap(mapID);
    this.actionQueue.start();
    this.onMapLoad(gameMap);

    return true;
}

GameContext.prototype.clearEvents = function() {
    this.client.cursor.events.unsubscribeAll(this.id);
    this.client.keyboard.events.unsubscribeAll(this.id);
    this.client.socket.events.unsubscribeAll(this.id);
    this.renderer.events.unsubscribeAll(this.id);
    this.questManager.events.unsubscribeAll(this.id);
    this.actionQueue.events.unsubscribeAll(this.id);
}

GameContext.prototype.getID = function() {
    return this.id;
}

GameContext.prototype.switchState = function(stateID) {
    if(!this.states.hasState(stateID)) {
        return false;
    }

    this.clearEvents();
    this.states.setNextState(stateID);
}