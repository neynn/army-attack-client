import { RequestQueue } from "../source/action/requestQueue.js";
import { GameContext } from "../source/gameContext.js";
import { Socket } from "../source/network/socket.js";
import { World } from "../source/world.js";
import { NETWORK_EVENTS } from "../source/network/events.js";

import { ACTION_TYPES, CONTEXT_STATES } from "./enums.js";
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
import { PlayerController } from "./init/controller/player.js";
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
import { ArmyEntityFactory } from "./init/armyEntity.js";
import { CameraContext } from "../source/camera/cameraContext.js";
import { Cursor } from "../source/client/cursor.js";

export const ArmyContext = function() {
    GameContext.call(this, 60);
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.prototype.initialize = function(resources) {
    this.updateConversions();

    this.world.actionQueue.registerActionHandler(ACTION_TYPES.MOVE, new MoveAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.ATTACK, new AttackAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.CONSTRUCTION, new ConstructionAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.COUNTER_ATTACK, new CounterAttackAction());
    this.world.actionQueue.registerActionHandler(ACTION_TYPES.COUNTER_MOVE, new CounterMoveAction());

    this.world.entityManager.registerComponent("Health", HealthComponent);
    this.world.entityManager.registerComponent("Construction", ConstructionComponent);
    this.world.entityManager.registerComponent("Reviveable", ReviveableComponent);
    this.world.entityManager.registerComponent("Attack", AttackComponent);
    this.world.entityManager.registerComponent("Move", MoveComponent);
    this.world.entityManager.registerComponent("UnitSize", UnitSizeComponent);
    this.world.entityManager.registerComponent("Armor", ArmorComponent);
    this.world.entityManager.registerComponent("Avian", AvianComponent);
    this.world.entityManager.registerComponent("Bulldoze", BulldozeComponent);
    this.world.entityManager.registerComponent("Counter", CounterComponent);
    this.world.entityManager.registerComponent("Resource", ResourceComponent);

    this.world.entityManager.registerFactory("Army", new ArmyEntityFactory().load(resources.entities));
    this.world.entityManager.selectFactory("Army");
    
    this.world.controllerManager.registerController("Player", PlayerController);
    
    this.states.addState(CONTEXT_STATES.MAIN_MENU, new MainMenuState());
    this.states.addState(CONTEXT_STATES.STORY_MODE, new StoryModeState());
    this.states.addState(CONTEXT_STATES.VERSUS_MODE, new VersusModeState());
    this.states.addState(CONTEXT_STATES.EDIT_MODE, new MapEditorState());

    this.client.soundPlayer.loadAllSounds();
    
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT.QUEUE_ERROR, "DEBUG", (error) => console.log(error));
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT.EXECUTION_RUNNING, "DEBUG", (item) => console.log(item, "IS PROCESSING"));
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT.EXECUTION_ERROR, "DEBUG",  (request, actionType) => {
        if(actionType.errorSound) {
            this.client.soundPlayer.playSound(actionType.errorSound, 0.5);
        }

        console.log(request, "IS INVALID");
    });

    this.client.socket.events.subscribe(Socket.EVENT_CONNECTED_TO_SERVER, "DEBUG", (socketID) => {
        this.client.socket.emit(NETWORK_EVENTS.REGISTER, { "user-id": "neyn!" }, (response) => console.log(response));
        console.log(`${socketID} is connected to the server!`);
    });

    this.client.socket.events.subscribe(Socket.EVENT_DISCONNECTED_FROM_SERVER, "DEBUG", (reason) => {
        console.log(`${reason} is disconnected from the server!`);
    });

    this.world.events.subscribe(World.EVENT_CONTROLLER_CREATE, "DEBUG", (controller) => console.log(controller, "HAS BEEN CREATED"));
    this.world.events.subscribe(World.EVENT_CONTROLLER_DESTROY, "DEBUG", (controller) => console.log(controller, "HAS BEEN DESTROYED"));
    this.world.events.subscribe(World.EVENT_ENTITY_DESTROY, "DEBUG", (entity) => console.log(entity, "HAS BEEN DESTROYED"));
    this.world.events.subscribe(World.EVENT_ENTITY_CREATE, "DEBUG", (entity) => console.log(entity, "HAS BEEN CREATED"));
    this.world.events.subscribe(World.EVENT_MAP_LOAD, "DEBUG", (worldMap) => console.log(worldMap, "HAS BEEN LOADED"));

    this.switchState(CONTEXT_STATES.MAIN_MENU);
}

ArmyContext.prototype.updateConversions = function() {
    const conversions = this.world.getConfig("TileConversions");
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

    this.world.config["TileConversions"] = newConversions;
}

ArmyContext.prototype.saveSnapshot = function() {
    const components = ["Position", "Health", "Attack"];
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
        const positionComponent = entity.getComponent(PositionComponent);
        const teamComponent = entity.getComponent(TeamComponent);
        const savedComponents = this.world.entityManager.saveComponents(entity, components);
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

ArmyContext.prototype.getCameraControllerFocus = function(cameraID) {
    const camera = this.renderer.getCamera(cameraID);

    if(!camera) {
        return null;
    }

    const focusID = camera.getFocus();
    const controller = this.world.controllerManager.getController(focusID);

    return controller;
}

ArmyContext.prototype.createCamera = function(cameraID) {
    const camera = new ArmyCamera();
    const settings = this.world.getConfig("Settings");
    const context = this.renderer.addCamera(cameraID, camera);

    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight);
    context.initRenderer(640, 360);
    context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
    
    this.world.events.subscribe(World.EVENT_MAP_LOAD, cameraID, (worldMap) => {
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

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, "HI", () => {
        x = !x;
        let mode = x ? CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT : CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
        this.renderer.getContext(cameraID).setDisplayMode(mode);
    });
    */
    return context;
}

ArmyContext.prototype.destroyCamera = function(cameraID) {
    this.renderer.removeCamera(cameraID);
    this.world.events.unsubscribe(World.EVENT_MAP_LOAD, cameraID);
}