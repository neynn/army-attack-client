import { ActionQueue } from "../source/action/actionQueue.js";
import { GameContext } from "../source/gameContext.js";
import { Socket } from "../source/network/socket.js";
import { World } from "../source/world.js";
import { NETWORK_EVENTS } from "../source/network/events.js";
import { ACTION_TYPES, GAME_EVENT } from "./enums.js";
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
import { ConstructionAction } from "./actions/constructionAction.js";
import { ReviveableComponent } from "./components/reviveable.js";
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
import { TileManager } from "../source/tile/tileManager.js";
import { Renderer } from "../source/renderer.js";
import { Logger } from "../source/logger.js";
import { dropItemsEvent } from "./events/dropItem.js";

export const ArmyContext = function() {
    GameContext.call(this);

    this.armyConfig = {};
    this.tileConversions = {};
    this.tileTypes = {};
    this.playerID = null;
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

ArmyContext.prototype.getGameMode = function() {
    return this.gameMode;
}

ArmyContext.prototype.init = function(resources) {
    this.armyConfig = resources.world;
    this.tileConversions = this.initConversions(this.armyConfig["TeamTileConversion"]);
    this.tileTypes = 0;

    this.world.actionQueue.registerAction(ACTION_TYPES.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPES.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerAction(ACTION_TYPES.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPES.COUNTER_MOVE, new CounterMoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPES.MOVE, new MoveAction());

    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ARMOR, ArmorComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.ATTACK, AttackComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.AVIAN, AvianComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.CONSTRUCTION, ConstructionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.DIRECTION, DirectionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.HEALTH, HealthComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.MOVE, MoveComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.POSITION, PositionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.PRODUCTION, ProductionComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.REVIVEABLE, ReviveableComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.SPRITE, SpriteComponent);
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.TEAM, TeamComponent);
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
        this.world.actionQueue.events.subscribe(ActionQueue.EVENT.QUEUE_ERROR, "DEBUG", (error) => console.log(error));
        this.world.actionQueue.events.subscribe(ActionQueue.EVENT.EXECUTION_RUNNING, "DEBUG", (item) => console.log(item, "IS PROCESSING"));
        this.world.actionQueue.events.subscribe(ActionQueue.EVENT.EXECUTION_ERROR, "DEBUG",  (request, actionType) => console.log(request, "IS INVALID"));
    }

    if(ArmyContext.DEBUG.LOG_SOCKET_EVENTS) {
        this.client.socket.events.subscribe(Socket.EVENT.CONNECTED_TO_SERVER, "DEBUG", (socketID) => {
            this.client.socket.emit(NETWORK_EVENTS.REGISTER, { "user-id": "neyn!" }, (response) => console.log(response));
            console.log(`${socketID} is connected to the server!`);
        });
    
        this.client.socket.events.subscribe(Socket.EVENT.DISCONNECTED_FROM_SERVER, "DEBUG", (reason) => {
            console.log(`${reason} is disconnected from the server!`);
        });
    }

    if(ArmyContext.DEBUG.LOG_WORLD_EVENTS) {
        this.world.events.subscribe(World.EVENT.CONTROLLER_CREATE, "DEBUG", (controller) => console.log(controller, "HAS BEEN CREATED"));
        this.world.events.subscribe(World.EVENT.CONTROLLER_DESTROY, "DEBUG", (controller) => console.log(controller, "HAS BEEN DESTROYED"));
        this.world.events.subscribe(World.EVENT.ENTITY_DESTROY, "DEBUG", (entity) => {
            console.log(entity, "HAS BEEN DESTROYED");
            this.unloadEntitySprites(entity);
        });
        this.world.events.subscribe(World.EVENT.ENTITY_CREATE, "DEBUG", (entity) => {
            console.log(entity, "HAS BEEN CREATED");
            this.loadEntitySprites(entity);
        });
        this.world.events.subscribe(World.EVENT.MAP_CREATE, "DEBUG", (worldMap) => console.log(worldMap, "HAS BEEN LOADED"));
    }

    this.switchState(ArmyContext.STATE.MAIN_MENU);
}

ArmyContext.prototype.setGameMode = function(modeID) {
    const { eventQueue } = this.world;

    this.gameMode = modeID;

    switch(modeID) {
        case ArmyContext.GAME_MODE.STORY: {
            eventQueue.register(GAME_EVENT.DROP_HIT_ITEMS);
            eventQueue.register(GAME_EVENT.DROP_KILL_ITEMS);
            eventQueue.on(GAME_EVENT.DROP_HIT_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            eventQueue.on(GAME_EVENT.DROP_KILL_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            break;
        }
        case ArmyContext.GAME_MODE.VERSUS: {
            eventQueue.register(GAME_EVENT.DROP_KILL_ITEMS);
            eventQueue.on(GAME_EVENT.DROP_KILL_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            break;
        }
    }
}

ArmyContext.prototype.getConfig = function(elementID) {
    const element = this.armyConfig[elementID];

    if(element === undefined) {
        Logger.log(false, "Element does not exist!", "ArmyContext.prototype.getConfig", { elementID });

        return null;
    }

    return element;
}

ArmyContext.prototype.initConversions = function(teamConversions) {
    const { meta } = this.tileManager;
    const updatedConversions = {};

    for(const teamID in teamConversions) {
        const sets = teamConversions[teamID];
        const teamConversion = {};

        for(const setID in sets) {
            const set = sets[setID];

            for(const animationID in set) {
                const tileID = meta.getTileID(setID, animationID);

                if(tileID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                const [a, b] = set[animationID];
                const convertedID = meta.getTileID(a, b);

                if(convertedID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                teamConversion[tileID] = convertedID;
            }
        }

        updatedConversions[teamID] = teamConversion;
    }

    return updatedConversions;
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
        const ownerID = this.world.controllerManager.getOwnerID(entityID);
        
        entities.push({
            "type": entity.config.id,
            "tileX": positionComponent.tileX,
            "tileY": positionComponent.tileY,
            "team": teamComponent.teamID,
            "owner": ownerID,
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

    //TODO
    for(const controller of controllers) {
        this.world.createController(this, controller);
    }

    for(const entity of entities) {
        SpawnSystem.createEntity(this, entity);
    }
}

ArmyContext.prototype.loadEntitySounds = function(entity) {
    const { soundPlayer } = this.client;
    const { sounds } = entity.config;

    for(const soundType in sounds) {
        const soundList = sounds[soundType];

        for(let i = 0; i < soundList.length; i++) {
            const soundID = soundList[i];

            soundPlayer.loadSound(soundID);
        }
    }
}

ArmyContext.prototype.unloadEntitySprites = function(entity) {
    const { resources } = this.spriteManager;
    const { sprites } = entity.config;

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        resources.removeReference(spriteID);
    }
}

ArmyContext.prototype.loadEntitySprites = function(entity) {
    const { resources } = this.spriteManager;
    const { sprites } = entity.config;
    const blocked = new Set(["airdrop"]);

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        if(blocked.has(spriteType)) {
            console.log("BLOCKED", spriteID);
            continue;
        }

        resources.requestImage(spriteID, (id, image, sheet) => console.log("LOADED IMAGE", id));
        resources.addReference(spriteID);
    }
}

ArmyContext.prototype.addDebug = function() {
    const { router } = this.client;

    router.load(this, {
        "DEBUG_MAP": "+F1",
        "DEBUG_CONTEXT": "+F2",
        "DEBUG_INTERFACE": "+F3",
        "DEBUG_SPRITES": "+F4",
        "EXPORT_LOGS": "+F6"
    });

    router.on("DEBUG_MAP", () => Renderer.DEBUG.MAP = !Renderer.DEBUG.MAP);
    router.on("DEBUG_CONTEXT", () => Renderer.DEBUG.CONTEXT = !Renderer.DEBUG.CONTEXT);
    router.on("DEBUG_INTERFACE", () => Renderer.DEBUG.INTERFACE = !Renderer.DEBUG.INTERFACE);
    router.on("DEBUG_SPRITES", () => Renderer.DEBUG.SPRITES = !Renderer.DEBUG.SPRITES);
    router.on("EXPORT_LOGS", () => Logger.exportLogs(Logger.EXPORT_CODE_ALL));
}