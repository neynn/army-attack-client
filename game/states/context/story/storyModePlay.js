import { saveTemplateAsFile } from "../../../../helpers.js";
import { State } from "../../../../source/state/state.js";
import { SpawnSystem } from "../../../systems/spawn.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(stateMachine) {
    console.time();
    const gameContext = stateMachine.getContext();
    const { uiManager, world } = gameContext;

    const controller = world.createController(gameContext, {
        "type": "Player",
        "team": "Allies"
    }, "neyn");

    const worldMap = await world.createMapByID(gameContext, "oasis");

    if(!worldMap) {
        return;
    }

    const camera = controller.getCamera();
    //camera.centerWorld();
    camera.bindViewport();

    //console.log(VersusSystem.pickRandomMap(gameContext, 2));

    gameContext.playerID = controller.getID();

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

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "tileX": 3,
        "tileY": 4,
        "team": "Allies",
        "owner": "neyn"
    });

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

    uiManager.unparseUI("PLAY_GAME");
}