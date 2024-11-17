import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { HealthComponent } from "./components/health.js";
import { MoveComponent } from "./components/move.js";
import { PositionComponent } from "./components/position.js";
import { ReviveComponent } from "./components/revive.js";
import { SubTypeComponent } from "./components/subType.js";
import { TeamComponent } from "./components/team.js";
import { ACTION_TYPES, CONTEXT_STATES, CONTROLLER_TYPES, ENTITY_ARCHETYPES, GAME_EVENTS, SYSTEM_TYPES } from "./enums.js";
import { ActionQueue } from "./source/action/actionQueue.js";
import { GameContext } from "./source/gameContext.js";
import { MainMenuState } from "./states/context/mainMenu.js";
import { MapEditorState } from "./states/context/mapEditor.js";
import { StoryModeState } from "./states/context/storyMode.js";
import { VersusModePlayState } from "./states/context/versus/versusModePlay.js";
import { VersusModeState } from "./states/context/versusMode.js";
import { VersusModeLobbyState } from "./states/context/versus/versusModeLobby.js";
import { ConquerSystem } from "./systems/conquer.js";
import { DownSystem } from "./systems/down.js";
import { PlaceSystem } from "./systems/place.js";
import { StoryModePlayState } from "./states/context/story/storyModePlay.js";
import { StoryModeIntroState } from "./states/context/story/storyModeIntro.js";
import { MoveSystem } from "./systems/move.js";
import { Renderer } from "./source/renderer.js";
import { PlayerController } from "./init/playerController.js";
import { SpriteComponent } from "./components/sprite.js";
import { Socket } from "./source/client/network/socket.js";
import { BuildingArchetype, ConstructionArchetype, DecoArchetype, DefenseArchetype, HFEArchetype, TownArchetype, UnitArchetype } from "./init/entities.js";

export const ArmyContext = function() {
    GameContext.call(this, 60);
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.prototype.loadResources = function(resources) {
    this.client.musicPlayer.load(resources.music);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.settings.socket);
    this.mapLoader.load(resources.maps, resources.settings.mapLoader);
    this.spriteManager.load(resources.sprites);
    this.tileManager.load(resources.tiles, resources.tileMeta);
    this.uiManager.load(resources.uiConfig, resources.icons, resources.fonts);
    this.entityManager.load(
        resources.entities,
        resources.traits,
        {
            "Health": HealthComponent,
            "Construction": ConstructionComponent,
            "Revive": ReviveComponent
        },
        {
            "Health": HealthComponent,
            "Attack": AttackComponent,
            "Construction": ConstructionComponent,
            "Move": MoveComponent,
            "SubType": SubTypeComponent,
            "Revive": ReviveComponent,
            "Armor": ArmorComponent
        }
    );

    this.controllerManager.registerController(CONTROLLER_TYPES.PLAYER, PlayerController);

    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.UNIT, new UnitArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.DEFENSE, new DefenseArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.DECO, new DecoArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.BUILDING, new BuildingArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.HFE, new HFEArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.TOWN, new TownArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.CONSTRUCTION, new ConstructionArchetype());

    this.systemManager.registerSystem(SYSTEM_TYPES.DOWN, DownSystem);
    this.systemManager.registerSystem(SYSTEM_TYPES.MOVE, MoveSystem);

    this.settings = resources.settings;
    this.config = resources.config;
    this.config.tileConversions = this.parseConversions();
}

ArmyContext.prototype.initialize = function() {
    this.actionQueue.setMaxSize(20);
    this.actionQueue.setMaxRequests(20);
    
    this.actionQueue.registerAction(ACTION_TYPES.MOVE, new MoveAction());
    this.actionQueue.registerAction(ACTION_TYPES.ATTACK, new AttackAction());

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_PROCESS, "CONTEXT", (request) => {
        console.log(request, "IS VALID");
    });

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_INVALID, "CONTEXT", (request) => {
        this.client.soundPlayer.playSound("sound_error", 0.5);
        console.log(request, "IS INVALID");
    });

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_VALID, "CONTEXT", (request) => {
        if(this.client.isOnline()) {
            console.log("TO SERVER!");
            this.client.socket.messageRoom(GAME_EVENTS.ENTITY_ACTION, request);
        } else {
            console.log("TO CLIENT!");
            this.actionQueue.queueAction(request);
        }
    });

    this.states.addState(CONTEXT_STATES.MAIN_MENU, new MainMenuState());
    this.states.addState(CONTEXT_STATES.STORY_MODE, new StoryModeState());
    this.states.addState(CONTEXT_STATES.VERSUS_MODE, new VersusModeState());
    this.states.addState(CONTEXT_STATES.EDIT_MODE, new MapEditorState());

    this.states.initializeSubstates(CONTEXT_STATES.STORY_MODE);
    this.states.addSubstate(CONTEXT_STATES.STORY_MODE, CONTEXT_STATES.STORY_MODE_INTRO, new StoryModeIntroState());
    this.states.addSubstate(CONTEXT_STATES.STORY_MODE, CONTEXT_STATES.STORY_MODE_PLAY, new StoryModePlayState());

    this.states.initializeSubstates(CONTEXT_STATES.VERSUS_MODE);
    this.states.addSubstate(CONTEXT_STATES.VERSUS_MODE, CONTEXT_STATES.VERSUS_MODE_LOBBY, new VersusModeLobbyState());
    this.states.addSubstate(CONTEXT_STATES.VERSUS_MODE, CONTEXT_STATES.VERSUS_MODE_PLAY, new VersusModePlayState());

    this.client.soundPlayer.loadAllSounds();
    
    this.client.socket.events.subscribe(Socket.EVENT_CONNECTED_TO_SERVER, "CONTEXT", (socketID) => {
        console.log(`${socketID} is connected to the server!`);
    });

    this.client.socket.events.subscribe(Socket.EVENT_DISCONNECTED_FROM_SERVER, "CONTEXT", (reason) => {
        console.log(`${reason} is disconnected from the server!`);
    });

    this.states.setNextState(CONTEXT_STATES.MAIN_MENU);
    this.renderer.createCamera("ARMY_CAMERA", Renderer.CAMERA_TYPE_2D, 0, 0, 500, 500);    
    this.renderer.resizeDisplay(window.innerWidth, window.innerHeight);
}

ArmyContext.prototype.onEntityCreate = function(entity) {
    PlaceSystem.placeEntity(this, entity);

    const saveData = this.saveEntity(entity.id);

    console.log(saveData);
}

ArmyContext.prototype.onEntityDestroy = function(entity) {
    const spriteComponent = entity.getComponent(SpriteComponent);

    this.spriteManager.destroySprite(spriteComponent.spriteID);

    PlaceSystem.removeEntity(this, entity);
}

ArmyContext.prototype.initializeTilemap = function(mapID) {
    const gameMap = this.mapLoader.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    const layerTypes = this.getConfig("layerTypes");
    const tileTypes = this.getConfig("tileTypes");
    const teamTypes = this.getConfig("teamTypes");
    const teamLayerID = layerTypes.team.layerID;
    const typeLayerID = layerTypes.type.layerID;

    gameMap.updateTiles((index, tileX, tileY) => {
        const team = gameMap.getTile(teamLayerID, tileX, tileY);
        const type = gameMap.getTile(typeLayerID, tileX, tileY);

        if(tileTypes[type] === undefined) {
            console.warn(`TileType ${type} does not exist!`);
        } 

        if(teamTypes[team] === undefined) {
            console.warn(`TeamType ${team} does not exist!`);  
        }
    });

    gameMap.updateTiles((index, tileX, tileY) => {
        const teamID = gameMap.getTile(teamLayerID, tileX, tileY);
        
        ConquerSystem.updateBorder(this, tileX, tileY);
        ConquerSystem.convertTileGraphics(this, tileX, tileY, teamID);
    });

    return true;
}

ArmyContext.prototype.saveEntity = function(entityID) {
    const entity = this.entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);
    const savedComponents = this.entityManager.saveComponents(entity);

    return {
        "id": entityID,
        "type": entity.config.id,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "team": teamComponent.teamID,
        "components": savedComponents
    }
}

ArmyContext.prototype.parseConversions = function() {
    const { tileManager } = this;
    const conversions = this.getConfig("tileConversions");
    const newConversions = {};

    for(const setID in conversions) {
        const set = conversions[setID];

        for(const frameID in set) {
            const config = {};
            const mainID = tileManager.getTileID(setID, frameID);

            if(mainID === null) {
                continue;
            }

            const teamConversions = set[frameID];

            for(const teamID in teamConversions) {
                const [tileSetID, tileFrameID] = teamConversions[teamID];
                const tileID = tileManager.getTileID(tileSetID, tileFrameID);

                if(teamID !== null) {
                    config[teamID] = tileID;
                }
            }

            newConversions[mainID] = config;
        }
    }

    return newConversions;
}