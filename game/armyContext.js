import { ActionQueue } from "../source/action/actionQueue.js";
import { GameContext } from "../source/gameContext.js";
import { Socket } from "../source/network/socket.js";

import { ACTION_TYPES, CAMERA_TYPES, CAMERAS, CONTEXT_STATES, CONTROLLER_TYPES, ENTITY_ARCHETYPES, SYSTEM_TYPES } from "./enums.js";
import { AttackAction } from "./actions/attackAction.js";
import { MoveAction } from "./actions/moveAction.js";
import { ArmorComponent } from "./components/armor.js";
import { AttackComponent } from "./components/attack.js";
import { ConstructionComponent } from "./components/construction.js";
import { HealthComponent } from "./components/health.js";
import { MoveComponent } from "./components/move.js";
import { PositionComponent } from "./components/position.js";
import { ReviveComponent } from "./components/revive.js";
import { UnitTypeComponent } from "./components/unitType.js";
import { TeamComponent } from "./components/team.js";
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
import { SpriteComponent } from "./components/sprite.js";
import { DefenseArchetype } from "./init/archetype/defense.js";
import { DecoArchetype } from "./init/archetype/deco.js";
import { BuildingArchetype } from "./init/archetype/building.js";
import { HFEArchetype } from "./init/archetype/hfe.js";
import { TownArchetype } from "./init/archetype/town.js";
import { ConstructionArchetype } from "./init/archetype/construction.js";
import { PlayerController } from "./init/controller/player.js";
import { UnitArchetype } from "./init/archetype/unit.js";
import { EditorController } from "./init/controller/editor.js";
import { AvianComponent } from "./components/avian.js";
import { BulldozeComponent } from "./components/bulldoze.js";
import { UnitBusterComponent } from "./components/unitBuster.js";
import { ConstructionAction } from "./actions/constructionAction.js";
import { ArmyCamera } from "./armyCamera.js";

export const ArmyContext = function() {
    GameContext.call(this, 60);
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.prototype.onResourcesLoad = function(resources) {
    this.config.tileConversions = this.parseConversions();
}

ArmyContext.prototype.initialize = function() {
    this.actionQueue.setMaxSize(20);
    this.actionQueue.setMaxRequests(20);
    
    this.actionQueue.registerAction(ACTION_TYPES.MOVE, new MoveAction());
    this.actionQueue.registerAction(ACTION_TYPES.ATTACK, new AttackAction());
    this.actionQueue.registerAction(ACTION_TYPES.CONSTRUCTION, new ConstructionAction());
    
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.UNIT, new UnitArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.DEFENSE, new DefenseArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.DECO, new DecoArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.BUILDING, new BuildingArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.HFE, new HFEArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.TOWN, new TownArchetype());
    this.entityManager.registerArchetype(ENTITY_ARCHETYPES.CONSTRUCTION, new ConstructionArchetype());

    this.controllerManager.registerController(CONTROLLER_TYPES.PLAYER, PlayerController);
    this.controllerManager.registerController(CONTROLLER_TYPES.EDITOR, EditorController);

    this.systemManager.registerSystem(SYSTEM_TYPES.DOWN, DownSystem);
    this.systemManager.registerSystem(SYSTEM_TYPES.MOVE, MoveSystem);

    this.renderer.registerCamera(CAMERA_TYPES.ARMY_ATTACK, ArmyCamera);

    this.entityManager.registerComponentReference("Health", HealthComponent);
    this.entityManager.registerComponentReference("Construction", ConstructionComponent);
    this.entityManager.registerComponentReference("Revive", ReviveComponent);
    this.entityManager.registerComponentReference("Attack", AttackComponent);
    this.entityManager.registerComponentReference("Move", MoveComponent);
    this.entityManager.registerComponentReference("UnitType", UnitTypeComponent);
    this.entityManager.registerComponentReference("Armor", ArmorComponent);
    this.entityManager.registerComponentReference("Avian", AvianComponent);
    this.entityManager.registerComponentReference("Bulldoze", BulldozeComponent);
    this.entityManager.registerComponentReference("UnitBuster", UnitBusterComponent);

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
    
    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_RUN, "DEBUG", (request, priority) => {
        console.log(request, "IS PROCESSING", priority);
    });

    this.actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_INVALID, "DEBUG", (request, messengerID, priority) => {
        this.client.soundPlayer.playSound("sound_error", 0.5);
        console.log(request, "IS INVALID", messengerID, priority);
    });

    this.client.socket.events.subscribe(Socket.EVENT_CONNECTED_TO_SERVER, "DEBUG", (socketID) => {
        console.log(`${socketID} is connected to the server!`);
    });

    this.client.socket.events.subscribe(Socket.EVENT_DISCONNECTED_FROM_SERVER, "DEBUG", (reason) => {
        console.log(`${reason} is disconnected from the server!`);
    });

    this.renderer.createCamera(CAMERAS.ARMY_CAMERA, CAMERA_TYPES.ARMY_ATTACK, 0, 0, 500, 500).loadTileDimensions(96, 96); 
    this.renderer.resizeDisplay(window.innerWidth, window.innerHeight);
    this.switchState(CONTEXT_STATES.MAIN_MENU);
}

ArmyContext.prototype.onMapLoad = function(gameMap) {
    const { width, height, meta } = gameMap;
    const { music } = meta;

    this.renderer.getCamera(CAMERAS.ARMY_CAMERA).loadWorld(width, height);

    if(music) {
        this.client.musicPlayer.loadTrack(music);
        this.client.musicPlayer.swapTrack(music);
    }
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
    const gameMap = this.mapManager.getLoadedMap(mapID);

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