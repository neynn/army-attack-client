import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { SpriteManager } from "./graphics/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { MapLoader } from "./map/mapLoader.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { ActionQueue } from "./action/actionQueue.js";
import { UIElement } from "./ui/uiElement.js";
import { Entity } from "./entity/entity.js";
import { Logger } from "./logger.js";
import { SystemManager } from "./system/systemManager.js";
import { TileManager } from "./tile/tileManager.js";
import { Renderer } from "./renderer.js";
import { ControllerManager } from "./controller/controllerManager.js";

export const GameContext = function(fps = 60) {
    this.id = "GAME_CONTEXT";
    this.config = {};
    this.settings = {};
    this.client = new Client();
    this.controller = new Entity("CONTROLLER", "CONTROLLER"); //TODO: "Controllers!";
    this.controllerManager = new ControllerManager();
    this.renderer = new Renderer();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.timer = new Timer(fps);
    this.mapLoader = new MapLoader();
    this.systemManager = new SystemManager();
    this.entityManager = new EntityManager();
    this.actionQueue = new ActionQueue();
    this.events = new EventEmitter();
    this.states = new StateMachine(this);

    this.timer.inputFunction = (realTime, deltaTime) => {
        this.client.update(this);
    }

    this.timer.updateFunction = (gameTime, fixedDeltaTime) => {
        this.controller.update(this);
        this.controllerManager.update(this);
        this.actionQueue.update(this);
        this.systemManager.update(this);
        this.entityManager.update(this);
    }

    this.timer.renderFunction = (realTime, deltaTime) => {
        this.spriteManager.update(this, realTime, deltaTime);
        this.tileManager.update(this, realTime, deltaTime);
        this.uiManager.update(this);
        this.renderer.update(this);
    }

    this.controller.initializeEvents();
    this.controller.initializeStates();
}

GameContext.prototype.load = function(resources) {}

GameContext.prototype.initializeActionQueue = function() {}

GameContext.prototype.initializeController = function() {}

GameContext.prototype.initializeContext = function() {}

GameContext.prototype.initializeInput = function() {
    const { cursor } = this.client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const camera = this.getCameraAtMouse();

        if(camera) {
            camera.dragViewport(deltaX, deltaY);
        }
    });
    
    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = this.uiManager.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);
        const viewportTile = this.getWorldTile();

        if(clickedElements.length === 0) {
            if(!viewportTile) {
                return;
            }

            this.controller.states.onEventEnter(this, viewportTile);
            return;
        }

        for(const element of clickedElements) {
            element.events.emit(UIElement.EVENT_CLICKED);
        }
    });
}

GameContext.prototype.initializeMap = function(mapID) {
    const nextMap = this.mapLoader.getLoadedMap(mapID);
    const activeMapID = this.mapLoader.getActiveMapID();

    if(!nextMap) {
        Logger.log(false, "Map could not be loaded!", "GameContext.prototype.loadMap", {mapID});

        return null;
    }

    if(activeMapID) {
        if(activeMapID === mapID) {
            Logger.log(false, "Map is already loaded!", "GameContext.prototype.loadMap", {mapID});

            return null;
        }
        
        this.mapLoader.unloadMap(activeMapID);
    }

    this.renderer.getCamera("ARMY_CAMERA").loadViewport(nextMap.width, nextMap.height); //HÄCK
    this.mapLoader.setActiveMap(mapID);
    this.actionQueue.workStart();

    if(nextMap.music) {
        this.client.musicPlayer.loadTrack(nextMap.music);
        this.client.musicPlayer.swapTrack(nextMap.music);
    }
    
    if(!this.mapLoader.mapCache[mapID]) {
        this.mapLoader.mapCache[mapID] = 1;
    }
    
    return nextMap;
}

GameContext.prototype.exitGame = function() {
    this.actionQueue.end();
    this.entityManager.end();
    this.spriteManager.end();
    this.tileManager.end();
    this.uiManager.end();
}

GameContext.prototype.getConfig = function(key) {
    if(!key) {
        return this.config;
    }

    if(this.config[key] === undefined) {
        return null;
    }

    return this.config[key];
}

GameContext.prototype.getCameraAtMouse = function() {
    const camera = this.renderer.getCollidedCamera(this.client.cursor.position.x, this.client.cursor.position.y, this.client.cursor.radius);
    return camera;
}

GameContext.prototype.getWorldTilePosition = function() {
    const camera = this.getCameraAtMouse();

    if(!camera) {
        return {
            "x": -1,
            "y": -1
        }
    }

    const worldTile = camera.screenToWorldTile(this.client.cursor.position.x, this.client.cursor.position.y);

    return worldTile;
}

GameContext.prototype.getWorldTile = function() {
    const gameMap = this.mapLoader.getActiveMap();

    if(!gameMap) {
        return null;
    }

    const { x, y } = this.getWorldTilePosition();
    const viewportTile = gameMap.getTile(x, y);

    return viewportTile;
}

GameContext.prototype.getTileEntity = function(tileX, tileY) {
    const activeMap = this.mapLoader.getActiveMap();

    if(!activeMap) {
        return null;
    }

    const tile = activeMap.getTile(tileX, tileY);

    if(!tile) {
        return null;
    }

    const entityID = tile.getFirstEntity();

    return this.entityManager.getEntity(entityID);
}

GameContext.prototype.createEntity = function(setup, externalID) {
    if(typeof setup !== "object") {
        Logger.error(false, "Setup does not exist!", "GameContext.prototype.createEntity", null);

        return null;
    }

    const { type } = setup;
    const typeConfig = this.entityManager.getEntityType(type);

    if(typeof typeConfig !== "object") {
        Logger.error(false, "TypeConfig does not exist!", "GameContext.prototype.createEntity", {type});

        return null; 
    }

    const entity = this.entityManager.createEntity(type, externalID);
    const { archetype } = typeConfig;
    const archetypeBuilder = this.entityManager.getArchetype(archetype);

    if(typeof archetypeBuilder === "function") {
        archetypeBuilder(this, entity, typeConfig, setup);
    } else {
        Logger.error(false, "Archetype does not exist!", "GameContext.prototype.createEntity", {archetype});
    }

    this.onEntityCreate(entity);

    return entity;
}

GameContext.prototype.destroyEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        return false;
    }

    this.entityManager.destroyEntity(entityID);

    this.onEntityDestroy(entity);

    return true;
}

GameContext.prototype.onEntityCreate = function(entity) {}

GameContext.prototype.onEntityDestroy = function(entity) {}