import { GameContext } from "../source/gameContext.js";
import { ACTION_TYPE, GAME_EVENT } from "./enums.js";
import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { HealthComponent } from "./components/health.js";
import { MoveComponent } from "./components/move.js";
import { PositionComponent } from "./components/position.js";
import { UnitComponent } from "./components/unit.js";
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
import { Socket } from "../source/network/socket.js";
import { MapManager } from "../source/map/mapManager.js";
import { FireMissionAction } from "./actions/fireMissionAction.js";

export const ArmyContext = function() {
    GameContext.call(this);

    this.settings = {};
    this.itemTypes = {};
    this.resourceTypes = {};
    this.teamTypes = {};
    this.tileTypes = {};
    this.collectionTypes = {};
    this.allianceTypes = {};
    this.tileConversions = {};
    this.tileFormConditions = {};
    this.fireCallTypes = {};

    this.playerID = null;
    this.modeID = ArmyContext.GAME_MODE.NONE;
    this.addContextMapHook();
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

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
    this.tileConversions = this.initConversions(resources.teamTileConversion);
    this.itemTypes = resources.items;
    this.teamTypes = resources.teams;
    this.collectionTypes = resources.collections;
    this.resourceTypes = resources.resources;
    this.tileTypes = resources.tileTypes;
    this.allianceTypes = resources.alliances;
    this.fireCallTypes = resources.fireCalls;
    this.tileFormConditions = resources.tileFormConditions;
    this.settings = resources.settings;
    this.editorConfig = resources.editor;

    this.world.actionQueue.registerAction(ACTION_TYPE.DEATH, new DeathAction())
    this.world.actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_MOVE, new CounterMoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.FIRE_MISSION, new FireMissionAction());

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
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.UNIT, UnitComponent);

    this.world.mapManager.registerFactory(ArmyContext.FACTORY.MAP, new ArmyMapFactory());
    this.world.mapManager.selectFactory(ArmyContext.FACTORY.MAP);

    this.world.entityManager.registerFactory(ArmyContext.FACTORY.ENTITY, new ArmyEntityFactory());
    this.world.entityManager.selectFactory(ArmyContext.FACTORY.ENTITY);

    this.world.turnManager.registerFactory(ArmyContext.FACTORY.ACTOR, new ArmyActorFactory());
    this.world.turnManager.selectFactory(ArmyContext.FACTORY.ACTOR);
    
    this.states.addState(ArmyContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(ArmyContext.STATE.STORY_MODE, new StoryModeState());
    this.states.addState(ArmyContext.STATE.VERSUS_MODE, new VersusModeState());
    this.states.addState(ArmyContext.STATE.EDIT_MODE, new MapEditorState());

    this.switchState(ArmyContext.STATE.MAIN_MENU);

    this.client.socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, (socketID) => {
        this.client.socket.registerName("neyn!");
    }, { once: true });
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
    const { turnManager, entityManager } = this.world;
    const entities = [];
    const actors = [];

    turnManager.forAllActors((actorID, actor) => {
        const saveData = actor.save();

        actors.push({
            "id": actorID,
            "data": saveData
        });
    });

    entityManager.forAllEntities((entityID, entity) => {
        const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
        const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
        const savedComponents = entity.save();
        const owners = turnManager.getOwnersOf(entityID);
        
        entities.push({
            "type": entity.config.id,
            "tileX": positionComponent.tileX,
            "tileY": positionComponent.tileY,
            "team": teamComponent.teamID,
            "owners": owners,
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

ArmyContext.prototype.addContextMapHook = function() {
    const { world, renderer, client } = this;
    const { musicPlayer } = client;
    const { mapManager } = world;

    renderer.events.on(Renderer.EVENT.CONTEXT_CREATE, (contextID, context) => {
        mapManager.events.on(MapManager.EVENT.MAP_CREATE, (mapID, worldMap) => {
            const { width, height, music } = worldMap;
            const camera = context.getCamera();

            camera.setMapSize(width, height);

            if(music) {
                musicPlayer.playTrack(music);
            }
        }, { id: contextID });
    }, { permanent: true });

    renderer.events.on(Renderer.EVENT.CONTEXT_DESTROY, (contextID) => {
        mapManager.events.unsubscribe(MapManager.EVENT.MAP_CREATE, contextID);
    }, { permanent: true });
}