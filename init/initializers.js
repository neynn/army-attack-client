import { CONTROLLER_STATES, CONTEXT_STATES, ACTION_TYPES, ENTITY_EVENTS } from "../enums.js";
import { ImageSheet } from "../source/graphics/imageSheet.js";
import { tileToPosition_center } from "../source/camera/helpers.js";
import { ControllerBuildState } from "../states/controller/build.js";
import { ControllerIdleState } from "../states/controller/idle.js";
import { ControllerEntitySelectedState } from "../states/controller/entitySelected.js";
import { Cursor } from "../source/client/cursor.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";
import { ArmyTile } from "./armyTile.js";
import { MainMenuState } from "../states/gameContext/mainMenu.js";
import { MapEditorState } from "../states/gameContext/mapEditor.js";
import { StoryModeState } from "../states/gameContext/storyMode.js";
import { VersusModeLobbyState } from "../states/gameContext/versusModeLobby.js";
import { MoveAction } from "../actions/moveAction.js";
import { VersusModeState } from "../states/gameContext/versusMode.js";
import { PlaceSystem } from "../systems/place.js";
import { componentSetup } from "./components.js";
import { ConquerSystem } from "../systems/conquer.js";
import { entityFactory } from "./entityFactory.js";
import { HealthComponent } from "../components/health.js";
import { ConstructionComponent } from "../components/construction.js";
import { MoveComponent } from "../components/move.js";
import { AttackComponent } from "../components/attack.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { SubTypeComponent } from "../components/subType.js";
import { AttackAction } from "../actions/attackAction.js";
import { Camera } from "../source/camera/camera.js";

export const initializeTilemap = function(gameContext, mapID) {
    const { mapLoader } = gameContext;
    const gameMap = mapLoader.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    const settings = gameContext.getConfig("settings");
    const tileTypes = gameContext.getConfig("tileTypes");
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
        ConquerSystem.updateBorder(gameContext, tileX, tileY);
        ConquerSystem.convertTileGraphics(gameContext, tileX, tileY, tile.team);
    });

    return true;
}

export const saveEntity = function(gameContext, entityID) {
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);
    const savedComponents = entityManager.saveComponents(entity);

    return {
        "type": entity.config.id,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "team": teamComponent.teamID,
        "master": teamComponent.masterID,
        "components": savedComponents
    }
}

export const initializeEntity = function(gameContext, entitySetup, externalID) {
    const { entityManager, spriteManager } = gameContext;
    const { type } = entitySetup;
    const typeConfig = entityManager.getEntityType(type);

    if(!typeConfig) {
        console.warn(`EntityType ${type} does not exist! Returning null...`);
        return null;
    }

    const { sprites, archetype } = typeConfig;

    if(!entityFactory.isBuildable(archetype)) {
        console.warn(`Archetype ${archetype} does not exist! Returning null...`);
        return null;
    }
    
    const entity = entityManager.createEntity(type, externalID);
    const entitySprite = spriteManager.createSprite(sprites.idle, SpriteManager.LAYER_MIDDLE, ImageSheet.DEFAULT_ANIMATION_ID);

    entityFactory.buildEntity(gameContext, entity, entitySprite, typeConfig, entitySetup);
    entityManager.enableEntity(entity.id); 
    PlaceSystem.placeEntity(gameContext, entity);

    console.log(saveEntity(gameContext, entity.id));

    return entity;
}

export const initializeController = function(gameContext, controllerConfig) {
    const { client, controller, spriteManager, renderer } = gameContext;
    const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER_TOP, ImageSheet.DEFAULT_ANIMATION_ID);
    const { x, y } = tileToPosition_center(0, 0);

    controllerSprite.setPosition(x, y);

    const controllerComponent = componentSetup.setupControllerComponent();
    const spriteComponent = componentSetup.setupSpriteComponent(controllerSprite);
    const teamComponent = componentSetup.setupTeamComponent(controllerConfig);

    controller.addComponent(controllerComponent);
    controller.addComponent(teamComponent);
    controller.addComponent(spriteComponent);

    client.cursor.events.subscribe(Cursor.MOVE, "INIT", (deltaX, deltaY) => {
        const viewportTile = gameContext.getViewportTilePosition();
        const centerPosition = tileToPosition_center(viewportTile.x, viewportTile.y);

        controllerSprite.setPosition(centerPosition.x, centerPosition.y);
    });

    controller.states.addState(CONTROLLER_STATES.IDLE, new ControllerIdleState());
    controller.states.addState(CONTROLLER_STATES.BUILD, new ControllerBuildState());
    controller.states.addState(CONTROLLER_STATES.ENTITY_SELECTED, new ControllerEntitySelectedState());
    controller.states.setNextState(CONTROLLER_STATES.IDLE);
}

export const initializeGameContext = function(gameContext) {
    const { states, actionQueue, client, mapLoader, entityManager, renderer } = gameContext;
    const { soundPlayer, socket } = client;

    states.addState(CONTEXT_STATES.MAIN_MENU, new MainMenuState());
    states.addState(CONTEXT_STATES.EDIT_MODE, new MapEditorState());
    states.addState(CONTEXT_STATES.STORY_MODE, new StoryModeState());
    states.addState(CONTEXT_STATES.VERSUS_MODE_LOBBY, new VersusModeLobbyState());
    states.addState(CONTEXT_STATES.VERSUS_MODE, new VersusModeState())

    actionQueue.setMaxSize(20);
    actionQueue.setMaxRequests(20);
    actionQueue.registerAction(ACTION_TYPES.MOVE, new MoveAction());
    actionQueue.registerAction(ACTION_TYPES.ATTACK, new AttackAction());

    renderer.events.subscribe(Camera.EVENT_VIEWPORT_LOAD, "INIT", (width, height) => renderer.centerViewport(width / 2, height / 2));

    soundPlayer.loadAllSounds();

    entityManager.setSaveableComponents({
        "Health": HealthComponent,
        "Construction": ConstructionComponent
    });

    entityManager.setLoadableComponents({
        "Health": HealthComponent,
        "Attack": AttackComponent,
        "Construction": ConstructionComponent,
        "Move": MoveComponent,
        "SubType": SubTypeComponent
    });

    states.setNextState(CONTEXT_STATES.MAIN_MENU);
}
