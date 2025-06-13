import { State } from "../../../../source/state/state.js";
import { ArmyContext } from "../../../armyContext.js";
import { DebugSystem } from "../../../systems/debug.js";
import { ActorSystem } from "../../../systems/actor.js";
import { MapSystem } from "../../../systems/map.js";
import { SpawnSystem } from "../../../systems/spawn.js";
import { DefaultTypes } from "../../../defaultTypes.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.initStoryMode = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;

    const player = ActorSystem.createStoryPlayer(gameContext, "Allies");
    const enemy = ActorSystem.createStoryEnemy(gameContext, "Crimson");

    player.setMaxActions(1);
    enemy.setMaxActions(1);

    turnManager.setActorOrder(gameContext, [ActorSystem.STORY_ID.PLAYER, ActorSystem.STORY_ID.ENEMY]);

    const entities = [
        DefaultTypes.createSpawnConfig("blue_battery", "Crimson", ActorSystem.STORY_ID.ENEMY, 4, 4),
        DefaultTypes.createSpawnConfig("blue_infantry", "Allies", ActorSystem.STORY_ID.PLAYER, 7, 7),
        DefaultTypes.createSpawnConfig("red_commandobunker", "Crimson", ActorSystem.STORY_ID.ENEMY, 6, 4),
        DefaultTypes.createSpawnConfig("red_tank", "Crimson", ActorSystem.STORY_ID.ENEMY, 4, 3),
        DefaultTypes.createSpawnConfig("blue_elite_commando", "Allies", ActorSystem.STORY_ID.PLAYER, 4, 5),
        DefaultTypes.createSpawnConfig("blue_commando_ultimate", "Allies", ActorSystem.STORY_ID.PLAYER, 5, 5),
        DefaultTypes.createSpawnConfig("blue_commando", "Allies", ActorSystem.STORY_ID.PLAYER, 5, 3),
        DefaultTypes.createSpawnConfig("red_artillery", "Allies", ActorSystem.STORY_ID.PLAYER, 2, 3),
        DefaultTypes.createSpawnConfig("blue_bootcamp_construction", "Allies", ActorSystem.STORY_ID.PLAYER, 2, 9),
        DefaultTypes.createSpawnConfig("blue_elite_infantry", "Allies", ActorSystem.STORY_ID.PLAYER, 7, 3),
        DefaultTypes.createSpawnConfig("red_battletank", "Allies", ActorSystem.STORY_ID.PLAYER, 3, 5),
        DefaultTypes.createSpawnConfig("blue_elite_battletank", "Allies", ActorSystem.STORY_ID.PLAYER, 3, 4)
    ];

    MapSystem.createMapByID(gameContext, "oasis").then((worldMap) => {
        worldMap.reload(gameContext);
        worldMap.clearClouds(gameContext, 2, 2, 10, 10);
        worldMap.addDebris(1, 2, 2);
        worldMap.addDebris(1, 3, 2);
        worldMap.addDebris(1, 4, 2);

        for(let i = 0; i < entities.length; i++) {
            SpawnSystem.createEntity(gameContext, entities[i]);
        }

        gameContext.states.eventEnter(gameContext, ArmyContext.EVENT.STORY_SAVE, null);
    });
}

StoryModePlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    console.time();
    //uiManager.createUIByID("STORY_MODE", gameContext);
    this.initStoryMode(gameContext);
    //DebugSystem.spawnFullEntities(gameContext);
    console.timeEnd();
}

StoryModePlayState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyUI("PLAY_GAME");
}