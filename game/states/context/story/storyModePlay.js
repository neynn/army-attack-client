import { saveTemplateAsFile } from "../../../../helpers.js";
import { State } from "../../../../source/state/state.js";
import { ACTION_TYPES, CAMERA_TYPES } from "../../../enums.js";
import { SpawnSystem } from "../../../systems/spawn.js";
import { VersusSystem } from "../../../systems/versus.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(stateMachine) {
    console.time();
    const gameContext = stateMachine.getContext();
    const { uiManager, world, renderer } = gameContext;
    const { actionQueue } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const worldMap = await world.createMapByID(gameContext, "mtn");

    if(!worldMap) {
        return;
    }

    console.log(VersusSystem.pickRandomMap(gameContext, 2));
    
    const controller = world.createController(gameContext, {
        "type": "Player",
        "team": "Allies",
        "id": "neyn"
    });

    //camera.centerWorld();
    camera.bindViewport();

    gameContext.player = controller.getID();

    worldMap.reloadGraphics(gameContext);

    uiManager.parseUI("STORY_MODE", gameContext);

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_guardtower",
        "tileX": 4,
        "tileY": 4,
        "team": "Crimson",
        "owner": null
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_battlefortress",
        "tileX": 6,
        "tileY": 8,
        "team": "Crimson",
        "owner": null
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_commando",
        "tileX": 6,
        "tileY": 5,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "michie_war_machine",
        "tileX": 7,
        "tileY": 5,
        "team": "Allies",
        "owner": "neyn"
    });

    const battery = SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battery",
        "tileX": 4,
        "tileY": 3,
        "team": "Crimson",
        "owner": null
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_commando",
        "tileX": 13,
        "tileY": 10,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "red_artillery",
        "tileX": 2,
        "tileY": 3,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "blue_bootcamp_construction",
        "tileX": 2,
        "tileY": 9,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_infantry",
        "tileX": 8,
        "tileY": 6,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_bulldozer",
        "tileX": 3,
        "tileY": 1,
        "team": "Allies",
        "owner": "neyn"
    });

    const redBattletank = SpawnSystem.createEntity(gameContext, { 
        "type": "red_battletank",
        "tileX": 4,
        "tileY": 1,
        "team": "Crimson",
        "owner": null
    });

    const battleTank = SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "tileX": 0,
        "tileY": 1,
        "team": "Allies",
        "owner": "neyn"
    });

    actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, battleTank.id, 7, 1));
    actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, battleTank.id, 3, 0));

    /*
    const s = gameContext.saveSnapshot();
    saveTemplateAsFile("test.json", JSON.stringify(s));
    console.log(s, gameContext);
    */

    console.timeEnd();
}

StoryModePlayState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}