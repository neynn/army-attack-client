import { GameContext } from "../source/gameContext.js";
import { ACTION_TYPE } from "./enums.js";
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
import { WorldEventHandler } from "../source/worldEventHandler.js";
import { GameEvent } from "./gameEvent.js";
import { ArmyMap } from "./init/armyMap.js";
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
    this.keybinds = {};

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
    this.keybinds = resources.keybinds;

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
    this.states.setNextState(this, ArmyContext.STATE.MAIN_MENU);
}

ArmyContext.prototype.setGameMode = function(modeID) {
    const { eventBus } = this.world;

    switch(modeID) {
        case ArmyContext.GAME_MODE.NONE: {
            break;
        }
        case ArmyContext.GAME_MODE.EDIT: {
            break;
        }
        case ArmyContext.GAME_MODE.STORY: {
            eventBus.register(GameEvent.TYPE.STORY_AI_CHOICE_MADE, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.PLAYER_CHOICE_MADE, WorldEventHandler.STATUS.EMITABLE);

            eventBus.register(GameEvent.TYPE.ENTITY_DEATH, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.ENTITY_DECAY, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.ENTITY_HIT, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.ENTITY_DOWN, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.ENTITY_KILL, WorldEventHandler.STATUS.EMITABLE);

            eventBus.register(GameEvent.TYPE.TILE_CAPTURED, WorldEventHandler.STATUS.EMITABLE);

            eventBus.register(GameEvent.TYPE.HIT_DROP, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.KILL_DROP, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.DROP, WorldEventHandler.STATUS.EMITABLE);

            eventBus.register(GameEvent.TYPE.ACTION_COUNTER_MOVE, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.ACTION_COUNTER_ATTACK, WorldEventHandler.STATUS.EMITABLE);

            eventBus.on(GameEvent.TYPE.PLAYER_CHOICE_MADE, (event) => GameEvent.onStoryChoice(this, event));
            eventBus.on(GameEvent.TYPE.STORY_AI_CHOICE_MADE, (event) => GameEvent.onStoryChoice(this, event));

            eventBus.on(GameEvent.TYPE.ENTITY_DEATH, (event) => GameEvent.onEntityDeath(this, event));
            eventBus.on(GameEvent.TYPE.ENTITY_DECAY, (event) => GameEvent.onEntityDecay(this, event));
            eventBus.on(GameEvent.TYPE.ENTITY_HIT, (event) => GameEvent.onEntityHit(this, event));
            eventBus.on(GameEvent.TYPE.ENTITY_DOWN, (event) => GameEvent.onEntityDown(this, event));
            eventBus.on(GameEvent.TYPE.ENTITY_KILL, (event) => GameEvent.onEntityKill(this, event));

            eventBus.on(GameEvent.TYPE.TILE_CAPTURED, (event) => GameEvent.onTileCaptured(this, event));

            eventBus.on(GameEvent.TYPE.HIT_DROP, (event) => GameEvent.onHitDrop(this, event));
            eventBus.on(GameEvent.TYPE.KILL_DROP, (event) => GameEvent.onKillDrop(this, event));
            eventBus.on(GameEvent.TYPE.DROP, (event) => GameEvent.onDrop(this, event));

            eventBus.on(GameEvent.TYPE.ACTION_COUNTER_MOVE, (event) => GameEvent.onMoveCounter(this, event));
            eventBus.on(GameEvent.TYPE.ACTION_COUNTER_ATTACK, (event) => GameEvent.onAttackCounter(this, event));
            break;
        }
        case ArmyContext.GAME_MODE.VERSUS: {
            eventBus.register(GameEvent.TYPE.VERSUS_REQUEST_SKIP_TURN, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.VERSUS_SKIP_TURN);
            eventBus.register(GameEvent.TYPE.PLAYER_CHOICE_MADE, WorldEventHandler.STATUS.EMITABLE);
            eventBus.register(GameEvent.TYPE.VERSUS_CHOICE_MADE);

            eventBus.on(GameEvent.TYPE.VERSUS_REQUEST_SKIP_TURN, (event) => GameEvent.onVersusRequestSkipTurn(this, event));
            eventBus.on(GameEvent.TYPE.VERSUS_SKIP_TURN, (event) => GameEvent.onVersusSkipTurn(this, event));
            eventBus.on(GameEvent.TYPE.PLAYER_CHOICE_MADE, (event) => GameEvent.onRequestVersusChoice(this, event));
            eventBus.on(GameEvent.TYPE.VERSUS_CHOICE_MADE, (event) => GameEvent.onVersusChoice(this, event));
            break;
        }
    }

    this.modeID = modeID;
    this.addDebug();
}

ArmyContext.prototype.initConversions = function(teamConversions) {
    const updatedConversions = {};

    for(const teamID in teamConversions) {
        const atlases = teamConversions[teamID];
        const teamConversion = {};

        for(const atlasID in atlases) {
            const atlas = atlases[atlasID];

            for(const textureID in atlas) {
                const tileID = this.tileManager.getTileID(atlasID, textureID);

                if(tileID === TileManager.TILE_ID.EMPTY) {
                    continue;
                }

                const [a, b] = atlas[textureID];
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

    router.load(this, this.keybinds.debug);

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

            context.reload();
        }, { id: contextID });
    }, { permanent: true });

    renderer.events.on(Renderer.EVENT.CONTEXT_DESTROY, (contextID) => {
        mapManager.events.unsubscribe(MapManager.EVENT.MAP_CREATE, contextID);
    }, { permanent: true });
}