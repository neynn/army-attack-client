import { State } from "../../../../source/state/state.js";
import { ArmyContext } from "../../../armyContext.js";
import { DebugSystem } from "../../../systems/debug.js";
import { ActorSystem } from "../../../systems/actor.js";
import { MapSystem } from "../../../systems/map.js";
import { SpawnSystem } from "../../../systems/spawn.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

const initStoryMode = async function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;

    const player = ActorSystem.createStoryPlayer(gameContext, "Allies");
    const enemy = ActorSystem.createStoryEnemy(gameContext, "Crimson");

    player.setMaxActions(1);
    enemy.setMaxActions(1);

    turnManager.setActorOrder(gameContext, [ActorSystem.STORY_ID.PLAYER, ActorSystem.STORY_ID.ENEMY]);

    const worldMap = await MapSystem.createMapByID(gameContext, "oasis");

    if(!worldMap) {
        return false;
    }

    const camera = player.getCamera();
    
    camera.bindViewport();
    worldMap.reload(gameContext);

    return true;
}

StoryModePlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    console.time();
    
    //uiManager.parseUI("STORY_MODE", gameContext);

    const isReady = await initStoryMode(gameContext);

    if(!isReady) {
        return;
    }

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_battery",
        "tileX": 4,
        "tileY": 4,
        "team": "Crimson",
        "owners": ActorSystem.STORY_ID.ENEMY
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_infantry",
        "tileX": 7,
        "tileY": 7,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_commandobunker",
        "tileX": 6,
        "tileY": 4,
        "team": "Crimson",
        "owners": ActorSystem.STORY_ID.ENEMY
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_tank",
        "tileX": 4,
        "tileY": 3,
        "team": "Crimson",
        "owners": ActorSystem.STORY_ID.ENEMY
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_commando",
        "tileX": 4,
        "tileY": 5,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_commando_ultimate",
        "tileX": 5,
        "tileY": 5,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_commando",
        "tileX": 5,
        "tileY": 3,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "red_artillery",
        "tileX": 2,
        "tileY": 3,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "blue_bootcamp_construction",
        "tileX": 2,
        "tileY": 9,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_infantry",
        "tileX": 7,
        "tileY": 3,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_battletank",
        "tileX": 3,
        "tileY": 5,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "tileX": 3,
        "tileY": 4,
        "team": "Allies",
        "owners": ActorSystem.STORY_ID.PLAYER
    });

    //DebugSystem.spawnFullEntities(gameContext);

    console.timeEnd();

    gameContext.states.eventEnter(gameContext, ArmyContext.EVENT.STORY_SAVE, null);
}

StoryModePlayState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME");
}