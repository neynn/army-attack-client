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
import { ArmyActorFactory } from "./init/armyActorFactory.js";
import { ArmyMapFactory } from "./init/armyMapFactory.js";
import { ArmyEntity } from "./init/armyEntity.js";
import { SpriteComponent } from "./components/sprite.js";
import { ProductionComponent } from "./components/production.js";
import { DirectionComponent } from "./components/direction.js";
import { TileManager } from "../source/tile/tileManager.js";
import { Renderer } from "../source/renderer.js";
import { Logger } from "../source/logger.js";
import { EventBus } from "../source/events/eventBus.js";
import { choiceMadeEvent, dropItemsEvent, skipTurnEvent } from "./clientEvents.js";
import { DeathAction } from "./actions/deathAction.js";
import { ArmyMap } from "./init/armyMap.js";

export const ArmyContext = function() {
    GameContext.call(this);

    this.settings = {};
    this.itemTypes = {};
    this.resourceTypes = {};
    this.entityTypes = {};
    this.teamTypes = {};
    this.tileTypes = {};
    this.allianceTypes = {};
    this.tileConversions = {};
    this.tileFormConditions = {};
    this.playerID = null;
    this.modeID = ArmyContext.GAME_MODE.NONE;
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
    ACTOR: "ACTOR"
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
    NONE: 0,
    STORY: 1,
    VERSUS: 2,
    EDIT: 3
};

ArmyContext.GAME_MODE_NAME = {
    [ArmyContext.GAME_MODE.NONE]: "none",
    [ArmyContext.GAME_MODE.STORY]: "story",
    [ArmyContext.GAME_MODE.VERSUS]: "versus",
    [ArmyContext.GAME_MODE.EDIT]: "edit"
};

ArmyContext.prototype.getGameModeName = function() {
    return ArmyContext.GAME_MODE_NAME[this.modeID];
}

ArmyContext.prototype.init = function(resources) {
    this.tileConversions = this.initConversions(resources.world["TeamTileConversion"]);
    this.itemTypes = resources.world["ItemType"];
    this.resourceTypes = resources.world["ResourceType"];
    this.tileTypes = resources.world["TileType"];
    this.teamTypes = resources.world["TeamType"];
    this.entityTypes = resources.world["EntityType"];
    this.allianceTypes = resources.world["AllianceType"];
    this.tileFormConditions = resources.world["TileFormCondition"];
    this.settings = resources.world["Settings"];
    this.editorConfig = resources.editor;

    this.world.actionQueue.registerAction(ACTION_TYPES.DEATH, new DeathAction())
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

    this.world.turnManager.registerFactory(ArmyContext.FACTORY.ACTOR, new ArmyActorFactory().load(resources.actors));
    this.world.turnManager.selectFactory(ArmyContext.FACTORY.ACTOR);
    
    this.states.addState(ArmyContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(ArmyContext.STATE.STORY_MODE, new StoryModeState());
    this.states.addState(ArmyContext.STATE.VERSUS_MODE, new VersusModeState());
    this.states.addState(ArmyContext.STATE.EDIT_MODE, new MapEditorState());
    
    if(ArmyContext.DEBUG.LOG_QUEUE_EVENTS) {
        this.world.actionQueue.events.on(ActionQueue.EVENT.QUEUE_ERROR, (error) => console.log(error), { id: "DEBUG" });
        this.world.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_RUNNING, (item) => console.log(item, "IS PROCESSING"), { id: "DEBUG" });
        this.world.actionQueue.events.on(ActionQueue.EVENT.EXECUTION_ERROR,  (request) => console.log(request, "IS INVALID"), { id: "DEBUG" });
    }

    if(ArmyContext.DEBUG.LOG_SOCKET_EVENTS) {
        this.client.socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, (socketID) => {
            this.client.socket.emit(NETWORK_EVENTS.REGISTER, { "user-id": "neyn!" }, (response) => console.log(response));
            console.log(`${socketID} is connected to the server!`);
        }, { id: "DEBUG" });
    
        this.client.socket.events.on(Socket.EVENT.DISCONNECTED_FROM_SERVER, (reason) => {
            console.log(`${reason} is disconnected from the server!`);
        }, { id: "DEBUG" });
    }

    if(ArmyContext.DEBUG.LOG_WORLD_EVENTS) {

    }

    this.switchState(ArmyContext.STATE.MAIN_MENU);
}

ArmyContext.prototype.setGameMode = function(modeID) {
    if(this.modeID === modeID) {
        return;
    }

    const { eventBus } = this.world;

    this.modeID = modeID;

    eventBus.clear();

    switch(modeID) {
        case ArmyContext.GAME_MODE.NONE: {
            break;
        }
        case ArmyContext.GAME_MODE.EDIT: {
            this.switchState(ArmyContext.STATE.EDIT_MODE);
            break;
        }
        case ArmyContext.GAME_MODE.STORY: {
            eventBus.register(GAME_EVENT.DROP_HIT_ITEMS, EventBus.STATUS.EMITABLE);
            eventBus.register(GAME_EVENT.DROP_KILL_ITEMS, EventBus.STATUS.EMITABLE);
            eventBus.register(GAME_EVENT.CHOICE_MADE, EventBus.STATUS.EMITABLE);

            eventBus.on(GAME_EVENT.DROP_HIT_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            eventBus.on(GAME_EVENT.DROP_KILL_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            eventBus.on(GAME_EVENT.CHOICE_MADE, (actorID) => choiceMadeEvent(this, actorID));

            this.switchState(ArmyContext.STATE.STORY_MODE);
            break;
        }
        case ArmyContext.GAME_MODE.VERSUS: {
            eventBus.register(GAME_EVENT.DROP_KILL_ITEMS, EventBus.STATUS.NOT_EMITABLE);
            eventBus.register(GAME_EVENT.CHOICE_MADE, EventBus.STATUS.NOT_EMITABLE);
            eventBus.register(GAME_EVENT.SKIP_TURN, EventBus.STATUS.NOT_EMITABLE);

            eventBus.on(GAME_EVENT.DROP_KILL_ITEMS, (items, receiverID) => dropItemsEvent(this, items, receiverID));
            eventBus.on(GAME_EVENT.CHOICE_MADE, (actorID) => choiceMadeEvent(this, actorID));
            eventBus.on(GAME_EVENT.SKIP_TURN, (actorID) => skipTurnEvent(this, actorID));

            this.switchState(ArmyContext.STATE.VERSUS_MODE);
            break;
        }
    }
}

ArmyContext.prototype.initConversions = function(teamConversions) {
    const updatedConversions = {};

    for(const teamID in teamConversions) {
        const sets = teamConversions[teamID];
        const teamConversion = {};

        for(const setID in sets) {
            const set = sets[setID];

            for(const animationID in set) {
                const tileID = this.tileManager.getTileID(setID, animationID);

                if(tileID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                const [a, b] = set[animationID];
                const convertedID = this.tileManager.getTileID(a, b);

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
    const actors = [];

    this.world.turnManager.forAllActors((actor, actorID) => {
        const saveData = actor.save();

        actors.push({
            "id": actorID,
            "data": saveData
        });
    });

    this.world.entityManager.forAllEntities((entity, entityID) => {
        const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
        const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
        const savedComponents = entity.save();
        const ownerID = entity.getOwner();
        
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
        "actors": actors,
        "entities": entities
    }
}

ArmyContext.prototype.loadSnapshot = function(snapshot) {
    const { time, entities, actors } = snapshot;
    const { turnManager } = this.world;

    for(let i = 0; i < actors.length; i++) {
        const actor = actors[i];

        turnManager.createActor(this, actor, "ID");
    }

    for(const entity of entities) {
        SpawnSystem.createEntity(this, entity);
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

ArmyContext.prototype.getPlayerTeamID = function() {
    const player = this.world.turnManager.getActor(this.playerID);

    if(!player || !player.teamID) {
        return null;
    }

    return player.teamID;
}

ArmyContext.prototype.getConversionID = function(tileID, teamID) {
    const teamConversions = this.tileConversions[ArmyMap.TEAM_TYPE[teamID]];

    if(!teamConversions) {
        return TileManager.TILE_ID.EMPTY;
    }

    const convertedID = teamConversions[tileID];
    
    if(!convertedID) {
        return TileManager.TILE_ID.EMPTY;
    }

    return convertedID;
}
