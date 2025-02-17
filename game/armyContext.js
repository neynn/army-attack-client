import { RequestQueue } from "../source/action/requestQueue.js";
import { GameContext } from "../source/gameContext.js";
import { Socket } from "../source/network/socket.js";
import { World } from "../source/world.js";
import { NETWORK_EVENTS } from "../source/network/events.js";
import { CameraContext } from "../source/camera/cameraContext.js";
import { ACTION_TYPES } from "./enums.js";
import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { HealthComponent } from "./components/health.js";
import { MoveComponent } from "./components/move.js";
import { PositionComponent } from "./components/position.js";
import { UnitSizeComponent } from "./components/unitSize.js";
import { TeamComponent } from "./components/team.js";
import { MainMenuState } from "./states/context/mainMenu.js";
import { MapEditorState } from "./states/context/mapEditor.js";
import { StoryModeState } from "./states/context/storyMode.js";
import { VersusModeState } from "./states/context/versusMode.js";
import { AvianComponent } from "./components/avian.js";
import { BulldozeComponent } from "./components/bulldoze.js";
import { ConstructionAction } from "./actions/constructionAction.js";
import { ReviveableComponent } from "./components/reviveable.js";
import { CounterComponent } from "./components/counter.js";
import { ResourceComponent } from "./components/resource.js";
import { ArmyCamera } from "./armyCamera.js";
import { SpawnSystem } from "./systems/spawn.js";
import { CounterAttackAction } from "./actions/counterAttackAction.js";
import { CounterMoveAction } from "./actions/counterMoveAction.js";
import { ArmyEntityFactory } from "./init/armyEntityFactory.js";
import { ArmyControllerFactory } from "./init/armyControllerFactory.js";
import { ArmyMapFactory } from "./init/armyMapFactory.js";
import { ArmyEntity } from "./init/armyEntity.js";
import { SpriteComponent } from "./components/sprite.js";
import { ProductionComponent } from "./components/production.js";
import { DirectionComponent } from "./components/direction.js";
import { TransparentComponent } from "./components/transparent.js";

export const ArmyContext = function() {
    GameContext.call(this);

    this.player = null;
    this.gameMode = ArmyContext.GAME_MODE.NONE;
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.DEBUG = {
    SHOW_INVALID_MOVE_TILES: true,
    LOG_WORLD_EVENTS: true,
    LOG_SOCKET_EVENTS: true,
    LOG_QUEUE_EVENTS: true
};

ArmyContext.FACTORY = {
    MAP: "MAP",
    ENTITY: "ENTITY",
    CONTROLLER: "CONTROLLER"
};

ArmyContext.STATE = {
    MAIN_MENU: 0,
    STORY_MODE: 1,
    STORY_MODE_INTRO: 2,
    STORY_MODE_PLAY: 3,
    VERSUS_MODE: 4,
    VERSUS_MODE_LOBBY: 5,
    VERSUS_MODE_PLAY: 6,
    EDIT_MODE: 7
};

ArmyContext.GAME_MODE = {
    NONE: "none",
    STORY: "story",
    VERSUS: "versus",
    EDIT: "edit"
};

ArmyContext.prototype.setGameMode = function(modeID) {
    this.gameMode = modeID;
}

ArmyContext.prototype.getGameMode = function() {
    return this.gameMode;
}

ArmyContext.prototype.init = function(resources) {
    this.updateConversions();

    this.world.actionQueue.registerActionHandler(ACTION_TYPES.ATTACK, new AttackAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.COUNTER_MOVE, new CounterMoveAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.MOVE, new MoveAction());

    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ARMOR, ArmorComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ATTACK, AttackComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.AVIAN, AvianComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.BULLDOZE, BulldozeComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.CONSTRUCTION, ConstructionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.COUNTER, CounterComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.DIRECTION, DirectionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.HEALTH, HealthComponent);
    //INVENTORY
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.MOVE, MoveComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.POSITION, PositionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.PRODUCTION, ProductionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.RESOURCE, ResourceComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.REVIVEABLE, ReviveableComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.SPRITE, SpriteComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.TEAM, TeamComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.TRANSPARENT, TransparentComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.UNIT_SIZE, UnitSizeComponent);

    this.world.mapManager.registerFactory(ArmyContext.FACTORY.MAP, new ArmyMapFactory().load(resources.mapTypes));
    this.world.mapManager.selectFactory(ArmyContext.FACTORY.MAP);

    this.world.entityManager.registerFactory(ArmyContext.FACTORY.ENTITY, new ArmyEntityFactory().load(resources.entities));
    this.world.entityManager.selectFactory(ArmyContext.FACTORY.ENTITY);

    this.world.controllerManager.registerFactory(ArmyContext.FACTORY.CONTROLLER, new ArmyControllerFactory().load(resources.controllers));
    this.world.controllerManager.selectFactory(ArmyContext.FACTORY.CONTROLLER);
    
    this.states.addState(ArmyContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(ArmyContext.STATE.STORY_MODE, new StoryModeState());
    this.states.addState(ArmyContext.STATE.VERSUS_MODE, new VersusModeState());
    this.states.addState(ArmyContext.STATE.EDIT_MODE, new MapEditorState());

    this.client.soundPlayer.loadAllSounds();
    
    if(ArmyContext.DEBUG.LOG_QUEUE_EVENTS) {
        this.world.actionQueue.events.subscribe(RequestQueue.EVENT.QUEUE_ERROR, "DEBUG", (error) => console.log(error));
        this.world.actionQueue.events.subscribe(RequestQueue.EVENT.EXECUTION_RUNNING, "DEBUG", (item) => console.log(item, "IS PROCESSING"));
        this.world.actionQueue.events.subscribe(RequestQueue.EVENT.EXECUTION_ERROR, "DEBUG",  (request, actionType) => console.log(request, "IS INVALID"));
    }

    if(ArmyContext.DEBUG.LOG_SOCKET_EVENTS) {
        this.client.socket.events.subscribe(Socket.EVENT_CONNECTED_TO_SERVER, "DEBUG", (socketID) => {
            this.client.socket.emit(NETWORK_EVENTS.REGISTER, { "user-id": "neyn!" }, (response) => console.log(response));
            console.log(`${socketID} is connected to the server!`);
        });
    
        this.client.socket.events.subscribe(Socket.EVENT_DISCONNECTED_FROM_SERVER, "DEBUG", (reason) => {
            console.log(`${reason} is disconnected from the server!`);
        });
    }

    if(ArmyContext.DEBUG.LOG_WORLD_EVENTS) {
        this.world.events.subscribe(World.EVENT.CONTROLLER_CREATE, "DEBUG", (controller) => console.log(controller, "HAS BEEN CREATED"));
        this.world.events.subscribe(World.EVENT.CONTROLLER_DESTROY, "DEBUG", (controller) => console.log(controller, "HAS BEEN DESTROYED"));
        this.world.events.subscribe(World.EVENT.ENTITY_DESTROY, "DEBUG", (entity) => console.log(entity, "HAS BEEN DESTROYED"));
        this.world.events.subscribe(World.EVENT.ENTITY_CREATE, "DEBUG", (entity) => console.log(entity, "HAS BEEN CREATED"));
        this.world.events.subscribe(World.EVENT.MAP_CREATE, "DEBUG", (worldMap) => console.log(worldMap, "HAS BEEN LOADED"));
    }

    this.switchState(ArmyContext.STATE.MAIN_MENU);
}

ArmyContext.prototype.updateConversions = function() {
    const conversions = this.world.getConfig("TileTeamConversion");
    const newConversions = {};

    for(const setID in conversions) {
        const set = conversions[setID];

        for(const frameID in set) {
            const config = {};
            const mainID = this.tileManager.getTileID(setID, frameID);

            if(mainID === null) {
                continue;
            }

            const teamConversions = set[frameID];

            for(const teamID in teamConversions) {
                const [tileSetID, tileFrameID] = teamConversions[teamID];
                const tileID = this.tileManager.getTileID(tileSetID, tileFrameID);

                if(teamID !== null) {
                    config[teamID] = tileID;
                }
            }

            newConversions[mainID] = config;
        }
    }

    this.world.config["TileTeamConversion"] = newConversions;
}

ArmyContext.prototype.saveSnapshot = function() {
    const entities = [];
    const controllers = [];

    this.world.controllerManager.controllers.forEach(controller => {
        const controllerID = controller.getID();
        const saveData = controller.save();

        controllers.push({
            "id": controllerID,
            "data": saveData
        });
    });

    this.world.entityManager.entities.forEach(entity => {
        const entityID = entity.getID();
        const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
        const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
        const savedComponents = entity.save();
        const owner = this.world.controllerManager.getOwnerOf(entityID);
        
        entities.push({
            "type": entity.config.id,
            "tileX": positionComponent.tileX,
            "tileY": positionComponent.tileY,
            "team": teamComponent.teamID,
            "owner": owner ? owner.getID() : null,
            "components": savedComponents
        });
    });

    return {
        "time": Date.now(),
        "controllers": controllers,
        "entities": entities
    }
}

ArmyContext.prototype.loadSnapshot = function(snapshot) {
    const { time, entities, controllers } = snapshot;

    for(const controller of controllers) {
        this.world.createController(this, controller);
    }

    for(const entity of entities) {
        SpawnSystem.createEntity(this, entity);
    }
}

ArmyContext.prototype.createCamera = function(cameraID) {
    const camera = new ArmyCamera();
    const settings = this.world.getConfig("Settings");
    const context = this.renderer.addCamera(cameraID, camera);

    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight);

    //context.initRenderer(640/2, 360/2);
    //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
    
    this.world.events.subscribe(World.EVENT.MAP_CREATE, cameraID, (worldMap) => {
        const { width, height, meta } = worldMap;
        const { music } = meta;
    
        camera.loadWorld(width, height);
    
        if(music) {
            this.client.musicPlayer.loadTrack(music);
            this.client.musicPlayer.swapTrack(music);
        }

        this.renderer.refreshCamera(cameraID);
    });

    /*
    let x = false;

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, "TEST", () => {
        x = !x;
        let mode = x ? CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT : CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
        this.renderer.getContext(cameraID).setDisplayMode(mode);
    });
    */

    return context;
}

ArmyContext.prototype.destroyCamera = function(cameraID) {
    this.renderer.removeCamera(cameraID);
    this.world.events.unsubscribe(World.EVENT.MAP_CREATE, cameraID);
}