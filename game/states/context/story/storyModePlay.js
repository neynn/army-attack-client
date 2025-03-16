import { saveTemplateAsFile } from "../../../../helpers.js";
import { State } from "../../../../source/state/state.js";
import { ArmyActorFactory } from "../../../init/armyActorFactory.js";
import { SpawnSystem } from "../../../systems/spawn.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

const initStoryMode = async function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;

    const player = world.createActor(gameContext, {
        "type": ArmyActorFactory.TYPE.PLAYER,
        "team": "Allies"
    }, ArmyActorFactory.TYPE.PLAYER);

    const enemy = world.createActor(gameContext, {
        "type": ArmyActorFactory.TYPE.ENEMY,
        "team": "Crimson"
    }, ArmyActorFactory.TYPE.ENEMY);

    player.setMaxActions(1);
    enemy.setMaxActions(1);

    turnManager.setActorOrder(gameContext, [ArmyActorFactory.TYPE.PLAYER, ArmyActorFactory.TYPE.ENEMY]);

    const worldMap = await world.createMapByID(gameContext, "oasis");

    if(!worldMap) {
        return false;
    }

    const camera = player.getCamera();

    camera.bindViewport();

    gameContext.playerID = player.getID();

    worldMap.reload(gameContext);

    return true;
}

StoryModePlayState.prototype.onEnter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.parseUI("STORY_MODE", gameContext);

    console.time();

    const isReady = await initStoryMode(gameContext);

    if(!isReady) {
        return;
    }

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_battery",
        "tileX": 4,
        "tileY": 4,
        "team": "Crimson",
        "owner": ArmyActorFactory.TYPE.ENEMY
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_tank",
        "tileX": 4,
        "tileY": 3,
        "team": "Crimson",
        "owner": ArmyActorFactory.TYPE.ENEMY
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_commando",
        "tileX": 4,
        "tileY": 5,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "michie_war_machine",
        "tileX": 5,
        "tileY": 5,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_commando",
        "tileX": 5,
        "tileY": 3,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "red_artillery",
        "tileX": 2,
        "tileY": 3,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "blue_bootcamp_construction",
        "tileX": 2,
        "tileY": 9,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_infantry",
        "tileX": 7,
        "tileY": 3,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_battletank",
        "tileX": 3,
        "tileY": 5,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "tileX": 3,
        "tileY": 4,
        "team": "Allies",
        "owner": ArmyActorFactory.TYPE.PLAYER
    });

    const rmap = gameContext.versusMode.pickRandomMap(gameContext);
    const reve = gameContext.versusMode.getEventSpawns(rmap);

    for(const e of reve) {
        SpawnSystem.createEntity(gameContext, e);
    }
    
    const s = gameContext.saveSnapshot();
    //saveTemplateAsFile("test.json", JSON.stringify(s, null, 2));
    console.log(s, gameContext);

    console.timeEnd();
}

StoryModePlayState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME");
}