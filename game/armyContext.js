import { RequestQueue } from "../source/action/requestQueue.js";
import { GameContext } from "../source/gameContext.js";
import { Socket } from "../source/network/socket.js";
import { World } from "../source/world.js";
import { EventEmitter } from "../source/events/eventEmitter.js";
import { NETWORK_EVENTS } from "../source/network/events.js";

import { ACTION_TYPES, CAMERA_TYPES, CONTEXT_STATES, CONTROLLER_TYPES } from "./enums.js";
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
import { DecayComponent } from "./components/decay.js";
import { CounterComponent } from "./components/counter.js";
import { ResourceComponent } from "./components/resource.js";
import { ArmyCamera } from "./armyCamera.js";
import { SpawnSystem } from "./systems/spawn.js";

export const ArmyContext = function() {
    GameContext.call(this, 60);
}

ArmyContext.prototype = Object.create(GameContext.prototype);
ArmyContext.prototype.constructor = ArmyContext;

ArmyContext.prototype.onResourcesLoad = function(resources) {
    this.world.config.tileConversions = this.parseConversions();
}

ArmyContext.prototype.initialize = function() {    
    this.world.actionQueue.registerHandler(ACTION_TYPES.MOVE, new MoveAction());
    this.world.actionQueue.registerHandler(ACTION_TYPES.ATTACK, new AttackAction());
    this.world.actionQueue.registerHandler(ACTION_TYPES.CONSTRUCTION, new ConstructionAction());
    
    this.world.entityManager.registerArchetype("Unit", new UnitArchetype());
    this.world.entityManager.registerArchetype("Defense", new DefenseArchetype());
    this.world.entityManager.registerArchetype("Deco", new DecoArchetype());
    this.world.entityManager.registerArchetype("Building", new BuildingArchetype());
    this.world.entityManager.registerArchetype("HFE", new HFEArchetype());
    this.world.entityManager.registerArchetype("Town", new TownArchetype());
    this.world.entityManager.registerArchetype("Construction", new ConstructionArchetype());

    this.world.controllerManager.registerController(CONTROLLER_TYPES.PLAYER, PlayerController);
    this.world.controllerManager.registerController(CONTROLLER_TYPES.EDITOR, EditorController);

    this.world.entityManager.registerComponent("Health", HealthComponent);
    this.world.entityManager.registerComponent("Construction", ConstructionComponent);
    this.world.entityManager.registerComponent("Decay", DecayComponent);
    this.world.entityManager.registerComponent("Attack", AttackComponent);
    this.world.entityManager.registerComponent("Move", MoveComponent);
    this.world.entityManager.registerComponent("UnitSize", UnitSizeComponent);
    this.world.entityManager.registerComponent("Armor", ArmorComponent);
    this.world.entityManager.registerComponent("Avian", AvianComponent);
    this.world.entityManager.registerComponent("Bulldoze", BulldozeComponent);
    this.world.entityManager.registerComponent("UnitBuster", UnitBusterComponent);
    this.world.entityManager.registerComponent("Counter", CounterComponent);
    this.world.entityManager.registerComponent("Resource", ResourceComponent);

    this.states.addState(CONTEXT_STATES.MAIN_MENU, new MainMenuState());
    this.states.addState(CONTEXT_STATES.STORY_MODE, new StoryModeState());
    this.states.addState(CONTEXT_STATES.VERSUS_MODE, new VersusModeState());
    this.states.addState(CONTEXT_STATES.EDIT_MODE, new MapEditorState());

    this.client.soundPlayer.loadAllSounds();
    
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT_QUEUE_ERROR, "DEBUG", (error) => console.log(error));
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT_EXECUTION_RUNNING, "DEBUG", (item) => console.log(item, "IS PROCESSING"));
    this.world.actionQueue.events.subscribe(RequestQueue.EVENT_EXECUTION_ERROR, "DEBUG", (executionItem) => {
        this.client.soundPlayer.playSound("sound_error", 0.5);
        console.log(executionItem, "IS INVALID");
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

ArmyContext.prototype.parseConversions = function() {
    const conversions = this.world.getConfig("tileConversions");
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

    return newConversions;
}

ArmyContext.prototype.saveSnapshot = function() {
    const entities = [];
    const controllers = [];

    this.world.controllerManager.controllers.forEach(controller => {
        const controllerID = controller.getID();
        const savedComponents = this.world.entityManager.saveComponents(controller);

        controllers.push({
            "id": controllerID,
            "components": savedComponents
        });
    });

    this.world.entityManager.entities.forEach(entity => {
        const entityID = entity.getID();
        const positionComponent = entity.getComponent(PositionComponent);
        const teamComponent = entity.getComponent(TeamComponent);
        const savedComponents = this.world.entityManager.saveComponents(entity);
        const masterID = this.world.controllerManager.getMaster(entityID);

        entities.push({
            "type": entity.config.id,
            "tileX": positionComponent.tileX,
            "tileY": positionComponent.tileY,
            "team": teamComponent.teamID,
            "master": masterID,
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

ArmyContext.prototype.createArmyCamera = function() {
    const camera = new ArmyCamera();
    const settings = this.world.getConfig("settings");
    
    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight);
    this.renderer.addCamera(CAMERA_TYPES.ARMY_CAMERA, camera);

    return camera;
}

ArmyContext.prototype.getArmyCamera = function() {
    return this.renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
}

ArmyContext.prototype.destroyArmyCamera = function() {
    this.renderer.removeCamera(CAMERA_TYPES.ARMY_CAMERA);
}