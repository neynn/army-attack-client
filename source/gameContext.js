import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { EntityManager } from "./entity/entityManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { SpriteManager } from "./graphics/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { getViewportTile } from "./camera/helpers.js";
import { MapLoader } from "./map/mapLoader.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { ActionQueue } from "./action/actionQueue.js";
import { UIElement } from "./ui/uiElement.js";
import { Entity } from "./entity/entity.js";
import { Logger } from "./logger.js";
import { SystemManager } from "./system/systemManager.js";
import { Camera2D } from "./camera/2D/camera2D.js";
import { TileManager } from "./tile/tileManager.js";

export const GameContext = function() {
    this.id = "GAME_CONTEXT";
    this.config = {};
    this.settings = {};
    this.client = new Client();
    this.controller = new Entity("CONTROLLER");
    this.renderer = new Camera2D(window.innerWidth, window.innerHeight);
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.timer = new Timer(60);
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

GameContext.prototype.initializeActionQueue = function() {

}

GameContext.prototype.initializeSystems = function() {

}

GameContext.prototype.initializeController = function() {
    
}

GameContext.prototype.initializeContext = function() {

}

GameContext.prototype.initializeInput = function() {
    const { cursor } = this.client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => this.renderer.dragViewport(deltaX, deltaY));
    
    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = this.uiManager.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);
        const viewportTile = this.getViewportTile();

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

    this.mapLoader.setActiveMap(mapID);
    this.renderer.loadViewport(nextMap.width, nextMap.height);
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

GameContext.prototype.loadResources = function(resources) {
    this.uiManager.loadFontTypes(resources.fonts);
    this.uiManager.loadIconTypes(resources.icons);
    this.uiManager.loadInterfaceTypes(resources.uiConfig);
    this.entityManager.loadEntityTypes(resources.entities);
    this.entityManager.loadTraitTypes(resources.traits);
    this.mapLoader.loadMapTypes(resources.maps);
    this.mapLoader.loadConfig(resources.settings.mapLoader);
    this.spriteManager.loadSpriteTypes(resources.sprites);
    this.tileManager.loadTileMeta(resources.tileMeta);
    this.tileManager.loadTileTypes(resources.tiles);
    this.client.musicPlayer.loadMusicTypes(resources.music);
    this.client.soundPlayer.loadSoundTypes(resources.sounds);
    this.client.socket.loadConfig(resources.settings.socket);
    this.config = resources.config;
    this.settings = resources.settings;
}

GameContext.prototype.exitGame = function() {
    this.actionQueue.workEnd();
    this.entityManager.workEnd();
    this.spriteManager.workEnd();
    this.tileManager.workEnd();
    this.uiManager.workEnd();
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

GameContext.prototype.getViewportTilePosition = function() {
    const { viewportX, viewportY } = this.renderer.getViewportPosition();
    const viewportTilePosition = getViewportTile(this.client.cursor.position.x, this.client.cursor.position.y, viewportX, viewportY);

    return viewportTilePosition;
}

GameContext.prototype.getViewportTile = function() {
    const gameMap = this.mapLoader.getActiveMap();

    if(!gameMap) {
        return null;
    }

    const { viewportX, viewportY } = this.renderer.getViewportPosition();
    const viewportTilePosition = getViewportTile(this.client.cursor.position.x, this.client.cursor.position.y, viewportX, viewportY);
    const viewportTile = gameMap.getTile(viewportTilePosition.x, viewportTilePosition.y);

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