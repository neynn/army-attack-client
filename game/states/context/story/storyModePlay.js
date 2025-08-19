import { State } from "../../../../source/state/state.js";
import { ArmyContext } from "../../../armyContext.js";
import { DebugSystem } from "../../../systems/debug.js";
import { ActorSystem } from "../../../systems/actor.js";
import { MapSystem } from "../../../systems/map.js";
import { SpawnSystem } from "../../../systems/spawn.js";
import { DefaultTypes } from "../../../defaultTypes.js";
import { ACTOR_ID, TEAM_TYPE } from "../../../enums.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.initStoryMode = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;

    const player = ActorSystem.createStoryPlayer(gameContext, TEAM_TYPE.ALLIES);
    const enemy = ActorSystem.createStoryEnemy(gameContext, TEAM_TYPE.CRIMSON);

    player.setMaxActions(1);
    enemy.setMaxActions(1);

    turnManager.setActorOrder(gameContext, [ACTOR_ID.STORY_PLAYER, ACTOR_ID.STORY_ENEMY]);

    const entities = [
        DefaultTypes.createSpawnConfig("blue_battery", TEAM_TYPE.CRIMSON, ACTOR_ID.STORY_ENEMY, 4, 4),
        DefaultTypes.createSpawnConfig("blue_infantry", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 7, 7),
        DefaultTypes.createSpawnConfig("red_commandobunker", TEAM_TYPE.CRIMSON, ACTOR_ID.STORY_ENEMY, 6, 4),
        DefaultTypes.createSpawnConfig("red_tank", TEAM_TYPE.CRIMSON, ACTOR_ID.STORY_ENEMY, 4, 3),
        DefaultTypes.createSpawnConfig("blue_elite_commando", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 4, 5),
        DefaultTypes.createSpawnConfig("blue_commando_ultimate", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 5),
        DefaultTypes.createSpawnConfig("blue_commando", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 3),
        DefaultTypes.createSpawnConfig("red_artillery", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 2, 3),
        DefaultTypes.createSpawnConfig("blue_bootcamp_construction", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 2, 9),
        DefaultTypes.createSpawnConfig("blue_elite_infantry", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 7, 3),
        DefaultTypes.createSpawnConfig("red_battletank", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 3, 5),
        DefaultTypes.createSpawnConfig("blue_elite_battletank", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 3, 4),
        DefaultTypes.createSpawnConfig("blue_guardtower", TEAM_TYPE.ALLIES, ACTOR_ID.STORY_PLAYER, 5, 4)
    ];

    MapSystem.createMapByID(gameContext, "oasis").then((worldMap) => {
        console.time();
        worldMap.reload(gameContext);
        worldMap.clearClouds(gameContext, 2, 2, 10, 10);
        worldMap.addDebris(1, 2, 2);
        worldMap.addDebris(1, 3, 2);
        worldMap.addDebris(1, 4, 2);

        for(let i = 0; i < entities.length; i++) {
            SpawnSystem.createEntity(gameContext, entities[i]);
        }

        gameContext.states.eventEnter(gameContext, ArmyContext.EVENT.STORY_SAVE, null);
        console.timeEnd();
    });
}

StoryModePlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.createUIByID("STORY_MODE", gameContext);
    this.initStoryMode(gameContext);
    //DebugSystem.spawnFullEntities(gameContext);
}

StoryModePlayState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyUI("PLAY_GAME");
}