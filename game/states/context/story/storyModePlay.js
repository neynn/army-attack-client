import { saveTemplateAsFile } from "../../../../helpers.js";
import { State } from "../../../../source/state/state.js";
import { ACTION_TYPES } from "../../../enums.js";
import { SpawnSystem } from "../../../systems/spawn.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(stateMachine) {
    console.time();
    const gameContext = stateMachine.getContext();
    const { uiManager, world } = gameContext;
    const { actionQueue } = world;

    const controller = world.createController(gameContext, {
        "type": "Player",
        "team": "Allies",
        "id": "neyn"
    });

    const worldMap = await world.createMapByID(gameContext, "oasis");

    if(!worldMap) {
        return;
    }

    const camera = controller.getCamera();
    //camera.centerWorld();
    camera.bindViewport();

    //console.log(VersusSystem.pickRandomMap(gameContext, 2));

    gameContext.player = controller.getID();

    worldMap.reload(gameContext);

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
        "tileX": 4,
        "tileY": 5,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "michie_war_machine",
        "tileX": 5,
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
        "tileX": 5,
        "tileY": 3,
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
        "tileX": 7,
        "tileY": 3,
        "team": "Allies",
        "owner": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_bulldozer",
        "tileX": 3,
        "tileY": 5,
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
        "tileX": 3,
        "tileY": 4,
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