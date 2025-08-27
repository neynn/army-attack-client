import { GameContext } from "../source/gameContext.js";
import { ACTION_TYPE, getTeamID, getTeamName, TEAM_ID, TILE_TYPE } from "./enums.js";
import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { HealthComponent } from "./components/health.js";
import { MoveComponent } from "./components/move.js";
import { PositionComponent } from "./components/position.js";
import { TeamComponent } from "./components/team.js";
import { MainMenuState } from "./states/context/mainMenu.js";
import { MapEditorState } from "./states/context/mapEditor.js";
import { StoryModeState } from "./states/context/storyMode.js";
import { VersusModeState } from "./states/context/versusMode.js";
import { AvianComponent } from "./components/avian.js";
import { ConstructionAction } from "./actions/constructionAction.js";
import { ReviveableComponent } from "./components/reviveable.js";
import { CounterAttackAction } from "./actions/counterAttackAction.js";
import { CounterMoveAction } from "./actions/counterMoveAction.js";
import { ArmyEntity } from "./init/armyEntity.js";
import { SpriteComponent } from "./components/sprite.js";
import { ProductionComponent } from "./components/production.js";
import { DirectionComponent } from "./components/direction.js";
import { TileManager } from "../source/tile/tileManager.js";
import { Renderer } from "../source/renderer.js";
import { Logger } from "../source/logger.js";
import { ArmyEventHandler } from "./armyEventHandler.js";
import { FireMissionAction } from "./actions/fireMissionAction.js";
import { TownComponent } from "./components/town.js";
import { ClearDebrisAction } from "./actions/clearDebrisAction.js";
import { HealAction } from "./actions/healAction.js";

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
    this.debrisTypes = {};
    this.shopItemTypes = {};

    this.eventHandler = new ArmyEventHandler();
    this.modeID = ArmyContext.GAME_MODE.NONE;
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

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
    this.debrisTypes = resources.debris;
    this.fireCallTypes = resources.fireCalls;
    this.tileFormConditions = resources.tileFormConditions;
    this.settings = resources.settings;
    this.editorConfig = resources.editor;
    this.keybinds = resources.keybinds;
    this.shopItemTypes = resources.shopItems;

    this.transform2D.setSize(resources.settings.tileWidth, resources.settings.tileHeight);

    this.world.actionQueue.registerAction(ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.COUNTER_MOVE, new CounterMoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.FIRE_MISSION, new FireMissionAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.CLEAR_DEBRIS, new ClearDebrisAction());
    this.world.actionQueue.registerAction(ACTION_TYPE.HEAL, new HealAction());

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
    this.world.entityManager.registerComponent(ArmyEntity.COMPONENT.TOWN, TownComponent);

    this.eventHandler.createEvents();
    this.eventHandler.addEventExecutor(this);
    
    this.states.addState(ArmyContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(ArmyContext.STATE.STORY_MODE, new StoryModeState());
    this.states.addState(ArmyContext.STATE.VERSUS_MODE, new VersusModeState());
    this.states.addState(ArmyContext.STATE.EDIT_MODE, new MapEditorState());
    this.states.setNextState(this, ArmyContext.STATE.MAIN_MENU);
}

ArmyContext.prototype.setGameMode = function(modeID) {
    const EVENT_TABLE = {};

    for(const eventID in ArmyEventHandler.TYPE) {
        EVENT_TABLE[ArmyEventHandler.TYPE[eventID]] = 1;
    }

    switch(modeID) {
        case ArmyContext.GAME_MODE.NONE: {
            this.modeID = ArmyContext.GAME_MODE.NONE;
            this.eventHandler.mode = ArmyEventHandler.MODE.NONE;
            break;
        }
        case ArmyContext.GAME_MODE.STORY: {
            this.modeID = ArmyContext.GAME_MODE.STORY;
            this.eventHandler.mode = ArmyEventHandler.MODE.STORY;
            this.world.eventBus.setEmitableTable(EVENT_TABLE);
            break;
        }
        case ArmyContext.GAME_MODE.EDIT: {
            this.modeID = ArmyContext.GAME_MODE.EDIT;
            this.eventHandler.mode = ArmyEventHandler.MODE.NONE;
            break;
        }
        case ArmyContext.GAME_MODE.VERSUS: {
            this.modeID = ArmyContext.GAME_MODE.VERSUS;
            this.eventHandler.mode = ArmyEventHandler.MODE.VERSUS;
            break;
        }
    }

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

ArmyContext.prototype.addDebug = function() {
    const { router } = this.client;

    router.load(this, this.keybinds.debug);

    router.on("DEBUG_MAP", () => Renderer.DEBUG.MAP = !Renderer.DEBUG.MAP);
    router.on("DEBUG_CONTEXT", () => Renderer.DEBUG.CONTEXT = !Renderer.DEBUG.CONTEXT);
    router.on("DEBUG_INTERFACE", () => Renderer.DEBUG.INTERFACE = !Renderer.DEBUG.INTERFACE);
    router.on("DEBUG_SPRITES", () => Renderer.DEBUG.SPRITES = !Renderer.DEBUG.SPRITES);
    router.on("EXPORT_LOGS", () => Logger.exportLogs(Logger.EXPORT_CODE_ALL));
}

ArmyContext.prototype.getConversionID = function(tileID, teamID) {
    const teamConversions = this.tileConversions[getTeamName(teamID)];

    if(!teamConversions) {
        return TileManager.TILE_ID.EMPTY;
    }

    const convertedID = teamConversions[tileID];
    
    if(!convertedID) {
        return TileManager.TILE_ID.EMPTY;
    }

    return convertedID;
} 

ArmyContext.prototype.getAnimationForm = function(tileID) {
    const tileMeta = this.tileManager.getMeta(tileID);

    if(!tileMeta) {
        return null;
    }

    const { graphics } = tileMeta;
    const [atlas, texture] = graphics;
    const setForm = this.tileFormConditions[atlas];

    if(!setForm) {
        return null;
    }

    const animationForm = setForm[texture];

    if(!animationForm) {
        return null;
    }

    return animationForm;
}

ArmyContext.prototype.getTileType = function(id) {
    switch(id) {
        case TILE_TYPE.GROUND: return this.tileTypes.Ground;
        case TILE_TYPE.MOUNTAIN: return this.tileTypes.Mountain;
        case TILE_TYPE.SEA: return this.tileTypes.Sea;
        case TILE_TYPE.SHORE: return this.tileTypes.Shore;
        default: return this.tileTypes.Error;
    }
}

ArmyContext.prototype.getTeamType = function(id) {
    switch(id) {
        case TEAM_ID.CRIMSON: return this.teamTypes.Crimson;
        case TEAM_ID.ALLIES: return this.teamTypes.Allies;
        case TEAM_ID.NEUTRAL: return this.teamTypes.Neutral;
        case TEAM_ID.VERSUS: return this.teamTypes.Versus;
        default: return this.teamTypes.Neutral;
    }
}

ArmyContext.prototype.getAllianceType = function(allianceName) {
    const alliance = this.allianceTypes[allianceName];

    if(!alliance) {
        return this.allianceTypes.Error;
    }

    return alliance;
}

ArmyContext.prototype.getAlliance = function(teamA, teamB) {
    const teamID = getTeamID(teamA);
    const teamType = this.getTeamType(teamID);
    const allianceID = teamType.alliances[teamB];
    const alliance = this.getAllianceType(allianceID);

    return alliance;
}

ArmyContext.prototype.getFireMissionType = function(name) {
    const fireMission = this.fireCallTypes[name];

    if(!fireMission) {
        return null; //TODO: Stub
    }

    return fireMission;
}