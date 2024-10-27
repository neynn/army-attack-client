import { Camera } from "./source/camera/camera.js";
import { Client } from "./source/client/client.js";
import { Cursor } from "./source/client/cursor.js";
import { EntityManager } from "./source/entity/entityManager.js";
import { EventEmitter } from "./source/events/eventEmitter.js";
import { SpriteManager } from "./source/graphics/spriteManager.js";
import { UIManager } from "./source/ui/uiManager.js";
import { getViewportTile } from "./source/camera/helpers.js";
import { MapLoader } from "./source/map/mapLoader.js";
import { StateMachine } from "./source/state/stateMachine.js";
import { Timer } from "./source/timer.js";
import { ActionQueue } from "./source/action/actionQueue.js";
import { UIElement } from "./source/ui/uiElement.js";
import { Entity } from "./source/entity/entity.js";
import { MapEditor } from "./source/map/mapEditor.js";
import { GAME_EVENTS } from "./enums.js";
import { Logger } from "./source/logger.js";

export const GameContext = function() {
    this.id = "GAME_CONTEXT";
    this.config = {};
    this.settings = {};
    this.client = new Client();
    this.controller = new Entity("CONTROLLER");
    this.renderer = new Camera(window.innerWidth, window.innerHeight);
    this.spriteManager = new SpriteManager();
    this.uiManager = new UIManager();
    this.timer = new Timer(60);
    this.mapLoader = new MapLoader();
    this.mapEditor = new MapEditor();
    this.entityManager = new EntityManager();
    this.actionQueue = new ActionQueue();
    this.events = new EventEmitter();
    this.states = new StateMachine(this);

    this.timer.inputFunction = () => {
        this.client.update(this);
    }

    this.timer.updateFunction = () => {
        this.controller.update(this);
        this.actionQueue.update(this);
        this.entityManager.update(this);
    }

    this.timer.renderFunction = () => {
        this.spriteManager.update(this);
        this.uiManager.update(this);
        this.renderer.update(this);
    }

    this.initializeController();
    this.initializeActionQueue();
}

GameContext.prototype.loadResources = function(resources) {
    this.uiManager.loadFontTypes(resources.fonts);
    this.uiManager.loadIconTypes(resources.icons);
    this.uiManager.loadUserInterfaceTypes(resources.uiConfig);
    this.client.musicPlayer.loadMusicTypes(resources.music);
    this.entityManager.loadEntityTypes(resources.entities);
    this.entityManager.loadTraitTypes(resources.traits);
    this.mapLoader.loadMapTypes(resources.maps);
    this.mapLoader.loadConfig(resources.settings.mapLoader);
    this.mapEditor.loadConfig(resources.settings.mapEditor);
    this.mapEditor.loadTileSetKeys(resources.tiles);
    this.spriteManager.loadTileSprites(resources.tiles);
    this.spriteManager.loadSpriteTypes(resources.sprites);
    this.client.soundPlayer.loadSoundTypes(resources.sounds);
    this.client.socket.loadConfig(resources.settings.socket);
    this.config = resources.config;
    this.settings = resources.settings;
}

GameContext.prototype.initializeActionQueue = function() {
    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_PROCESS, this.id, (request) => {
        console.log(request, "IS VALID");
    });

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_INVALID, this.id, (request) => {
        this.client.soundPlayer.playSound("sound_error", 0.5);
        console.log(request, "IS INVALID");
    });

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_VALID, this.id, (request) => {
        if(this.client.isOnline()) {
            console.log("TO SERVER!");
            this.client.socket.messageRoom(GAME_EVENTS.ENTITY_ACTION, request);
        } else {
            console.log("TO CLIENT!");
            this.actionQueue.queueAction(request);
        }
    });

    this.spriteManager.events.subscribe(SpriteManager.EVENT_REQUEST_TIMESTAMP, this.id, (answer) => answer(this.timer.getRealTime()));
}

GameContext.prototype.initializeController = function() {
    const { client, renderer, uiManager, controller } = this;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => renderer.dragViewport(deltaX, deltaY));
    
    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = uiManager.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);
        const viewportTile = this.getViewportTile();

        if(clickedElements.length === 0) {
            if(!viewportTile) {
                return;
            }

            controller.states.onEventEnter(this, viewportTile);
            return;
        }

        for(const element of clickedElements) {
            element.events.emit(UIElement.EVENT_CLICKED);
        }
    });
}

GameContext.prototype.exitGame = function() {
    this.actionQueue.workEnd();
    this.entityManager.workEnd();
    this.spriteManager.workEnd();
    this.tileManager.workEnd();
    this.uiManager.workEnd();
}

GameContext.prototype.loadMap = async function(mapID) {
    const map2D =  await this.mapLoader.loadMap(mapID);

    if(!map2D) {
        return null;
    }

    const nextMap = this.initMap(mapID);
    
    return nextMap;
}

GameContext.prototype.initMap = function(mapID) {
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