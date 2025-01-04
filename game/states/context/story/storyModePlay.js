import { State } from "../../../../source/state/state.js";

import { ACTION_TYPES, CAMERA_TYPES, CONTROLLER_TYPES } from "../../../enums.js";
import { MapSystem } from "../../../systems/map.js";
import { SpawnSystem } from "../../../systems/spawn.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, world, renderer } = gameContext;
    const { actionQueue } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const MAP = "pvp_valleys";
    const worldMap = await MapSystem.loadMapByID(gameContext, MAP);

    if(!worldMap) {
        return;
    }

    const controller = world.createController(gameContext, {
        "type": CONTROLLER_TYPES.PLAYER,
        "team": "Allies",
        "id": "neyn"
    });
    
    MapSystem.reloadGraphics(gameContext, controller, MAP);

    camera.centerWorld();

    camera.bindViewport();
    
    uiManager.parseUI("STORY_MODE", gameContext);
    
    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_guardtower",
        "mode": "story",
        "tileX": 4,
        "tileY": 4,
        "team": "Allies",
        "master": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battery",
        "mode": "story",
        "tileX": 4,
        "tileY": 3,
        "team": "Crimson",
        "master": null
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_commando",
        "mode": "story",
        "tileX": 1,
        "tileY": 3,
        "team": "Allies",
        "master": "neyn"
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "red_artillery",
        "mode": "story",
        "tileX": 2,
        "tileY": 3,
        "team": "Allies",
        "master": "neyn"
    });

    SpawnSystem.createEntity(gameContext, {
        "type": "blue_bootcamp_construction",
        "mode": "story",
        "tileX": 2,
        "tileY": 9,
        "team": "Allies",
        "master": "neyn"
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_infantry",
        "mode": "story",
        "tileX": 6,
        "tileY": 5,
        "team": "Allies",
        "master": "neyn",
        "components": {
            "Move": {
                "range": 50
            }
        }
    });

    SpawnSystem.createEntity(gameContext, { 
        "type": "red_bulldozer",
        "mode": "story",
        "tileX": 3,
        "tileY": 1,
        "team": "Allies",
        "master": "neyn"
    });

    const redBattletank = SpawnSystem.createEntity(gameContext, { 
        "type": "red_battletank",
        "mode": "story",
        "tileX": 4,
        "tileY": 1,
        "team": "Crimson",
        "master": null
    });

    const battleTank = SpawnSystem.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "mode": "story",
        "tileX": 0,
        "tileY": 1,
        "team": "Allies",
        "master": "neyn",
        "components": {
            "Move": {
                range: 10
            },
            "Health": {
                health: 99,
                maxHealth: 99
            },
            "Attack": {
                damage: 3
            }
        }
    });

    actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, battleTank.id, 7, 1));
    actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, battleTank.id, 3, 0));

    const s = gameContext.saveSnapshot();
    console.log(s);
}

StoryModePlayState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}