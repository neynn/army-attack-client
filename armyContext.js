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
import { ACTION_TYPES, CONTEXT_STATES, CONTROLLER_STATES, GAME_EVENTS } from "./enums.js";
import { ArmyTile } from "./init/armyTile.js";
import { componentSetup } from "./init/components.js";
import { entityFactory } from "./init/entityFactory.js";
import { ActionQueue } from "./source/action/actionQueue.js";
import { Camera } from "./source/camera/camera.js";
import { tileToPosition_center } from "./source/camera/helpers.js";
import { Cursor } from "./source/client/cursor.js";
import { GameContext } from "./source/gameContext.js";
import { SpriteManager } from "./source/graphics/spriteManager.js";
import { ControllerBuildState } from "./states/controller/build.js";
import { ControllerEntitySelectedState } from "./states/controller/entitySelected.js";
import { ControllerIdleState } from "./states/controller/idle.js";
import { MainMenuState } from "./states/gameContext/mainMenu.js";
import { MapEditorState } from "./states/gameContext/mapEditor.js";
import { StoryModeState } from "./states/gameContext/storyMode.js";
import { VersusModeState } from "./states/gameContext/versusMode.js";
import { VersusModeLobbyState } from "./states/gameContext/versusModeLobby.js";
import { ConquerSystem } from "./systems/conquer.js";
import { PlaceSystem } from "./systems/place.js";

export const ArmyContext = function() {
    GameContext.call(this);
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.prototype.initializeContext = function() {
    this.states.addState(CONTEXT_STATES.MAIN_MENU, new MainMenuState());
    this.states.addState(CONTEXT_STATES.EDIT_MODE, new MapEditorState());
    this.states.addState(CONTEXT_STATES.STORY_MODE, new StoryModeState());
    this.states.addState(CONTEXT_STATES.VERSUS_MODE_LOBBY, new VersusModeLobbyState());
    this.states.addState(CONTEXT_STATES.VERSUS_MODE, new VersusModeState())

    this.actionQueue.setMaxSize(20);
    this.actionQueue.setMaxRequests(20);
    this.actionQueue.registerAction(ACTION_TYPES.MOVE, new MoveAction());
    this.actionQueue.registerAction(ACTION_TYPES.ATTACK, new AttackAction());

    this.renderer.events.subscribe(Camera.EVENT_VIEWPORT_LOAD, this.id, (width, height) => this.renderer.centerViewport(width / 2, height / 2));

    this.client.soundPlayer.loadAllSounds();

    this.entityManager.setSaveableComponents({
        "Health": HealthComponent,
        "Construction": ConstructionComponent,
        "Revive": ReviveComponent
    });

    this.entityManager.setLoadableComponents({
        "Health": HealthComponent,
        "Attack": AttackComponent,
        "Construction": ConstructionComponent,
        "Move": MoveComponent,
        "SubType": SubTypeComponent,
        "Revive": ReviveComponent,
        "Armor": ArmorComponent
    });

    this.states.setNextState(CONTEXT_STATES.MAIN_MENU);
}

ArmyContext.prototype.initializeController = function(config) {
    const { controller } = this;
    const controllerSprite = this.spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER_TOP);
    const { x, y } = tileToPosition_center(0, 0);

    controllerSprite.setPosition(x, y);

    const controllerComponent = componentSetup.setupControllerComponent();
    const spriteComponent = componentSetup.setupSpriteComponent(controllerSprite);
    const teamComponent = componentSetup.setupTeamComponent(config);

    controller.addComponent(controllerComponent);
    controller.addComponent(teamComponent);
    controller.addComponent(spriteComponent);

    this.client.cursor.events.subscribe(Cursor.MOVE, this.id, (deltaX, deltaY) => {
        const viewportTile = this.getViewportTilePosition();
        const centerPosition = tileToPosition_center(viewportTile.x, viewportTile.y);

        controllerSprite.setPosition(centerPosition.x, centerPosition.y);
    });

    controller.states.addState(CONTROLLER_STATES.IDLE, new ControllerIdleState());
    controller.states.addState(CONTROLLER_STATES.BUILD, new ControllerBuildState());
    controller.states.addState(CONTROLLER_STATES.ENTITY_SELECTED, new ControllerEntitySelectedState());

    controller.states.setNextState(CONTROLLER_STATES.IDLE);
}

ArmyContext.prototype.initializeEntity = function(entitySetup, externalID) {
    const { type } = entitySetup;
    const typeConfig = this.entityManager.getEntityType(type);

    if(!typeConfig) {
        console.warn(`EntityType ${type} does not exist! Returning null...`);
        return null;
    }

    const { sprites, archetype } = typeConfig;

    if(!entityFactory.isBuildable(archetype)) {
        console.warn(`Archetype ${archetype} does not exist! Returning null...`);
        return null;
    }
    
    const entity = this.entityManager.createEntity(type, externalID);
    const entitySprite = this.spriteManager.createSprite(sprites.idle, SpriteManager.LAYER_MIDDLE);

    entityFactory.buildEntity(this, entity, entitySprite, typeConfig, entitySetup);
    PlaceSystem.placeEntity(this, entity);

    this.entityManager.enableEntity(entity.id); 

    const saveData = this.saveEntity(entity.id);

    console.log(saveData);

    return entity;
}

ArmyContext.prototype.initializeTilemap = function(mapID) {
    const gameMap = this.mapLoader.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    const settings = this.getConfig("settings");
    const tileTypes = this.getConfig("tileTypes");
    const { teamLayerID, typeLayerID } = settings;

    gameMap.loadTiles((map, tileX, tileY, index) => {
        const tile = new ArmyTile();
        const team = map.getLayerTile(teamLayerID, tileX, tileY);
        const type = map.getLayerTile(typeLayerID, tileX, tileY);
        const tileType = tileTypes[type];
        
        if(tileType) {
            const { passability, autoCapture, hasBorder } = tileType;

            tile.hasAutoCapture = autoCapture;
            tile.hasBorder = hasBorder;
            tile.passability = passability;
        } else {
            console.error(`TileType ${type} at [${tileX},${tileY}] does not exist!`);
        }

        tile.team = team;
        
        return tile;
    });

    gameMap.updateTiles((tile, tileX, tileY, index) => {
        ConquerSystem.updateBorder(this, tileX, tileY);
        ConquerSystem.convertTileGraphics(this, tileX, tileY, tile.team);
    });

    return true;
}

ArmyContext.prototype.initializeActionQueue = function() {
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
        "type": entity.config.id,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "team": teamComponent.teamID,
        "master": teamComponent.masterID,
        "components": savedComponents
    }
}