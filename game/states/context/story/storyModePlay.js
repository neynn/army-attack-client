import { MapParser } from "../../../../source/map/mapParser.js";
import { State } from "../../../../source/state/state.js";
import { World } from "../../../../source/world.js";

import { ACTION_TYPES, CAMERA_TYPES, CONTROLLER_TYPES } from "../../../enums.js";
import { ConquerSystem } from "../../../systems/conquer.js";

export const StoryModePlayState = function() {
    State.call(this);
}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.enter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, world, renderer } = gameContext;
    const { actionQueue } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const MAP = "pvp_valleys";
    const code = await world.parseMap(MAP, MapParser.parseMap2D);

    if(code !== World.CODE_PARSE_MAP_SUCCESS) {
        return;
    }

    world.createController(gameContext, {
        "type": CONTROLLER_TYPES.PLAYER,
        "team": 1,
        "id": "neyn"
    });
    
    ConquerSystem.reloadGraphics(gameContext, MAP);

    camera.centerWorld();

    camera.bindViewport();
    
    uiManager.parseUI("STORY_MODE", gameContext);
    
    world.createEntity(gameContext, { 
        "type": "blue_guardtower",
        "mode": "story",
        "tileX": 0,
        "tileY": 3,
        "team": 1,
        "master": "neyn"
    });

    world.createEntity(gameContext, { 
        "type": "blue_elite_battery",
        "mode": "story",
        "tileX": 4,
        "tileY": 3,
        "team": 0,
        "master": null
    });

    world.createEntity(gameContext, { 
        "type": "blue_commando",
        "mode": "story",
        "tileX": 1,
        "tileY": 3,
        "team": 1,
        "master": "neyn"
    });

    world.createEntity(gameContext, {
        "type": "red_artillery",
        "mode": "story",
        "tileX": 2,
        "tileY": 3,
        "team": 1,
        "master": "neyn"
    });

    world.createEntity(gameContext, {
        "type": "blue_bootcamp_construction",
        "mode": "story",
        "tileX": 2,
        "tileY": 9,
        "team": 1,
        "master": "neyn"
    });

    world.createEntity(gameContext, { 
        "type": "blue_elite_infantry",
        "mode": "story",
        "tileX": 6,
        "tileY": 5,
        "team": 1,
        "master": "neyn",
        "components": {
            "Move": {
                "range": 15
            }
        }
    });

    world.createEntity(gameContext, { 
        "type": "red_bulldozer",
        "mode": "story",
        "tileX": 3,
        "tileY": 1,
        "team": 1,
        "master": "neyn"
    });

    const redBattletank = world.createEntity(gameContext, { 
        "type": "red_battletank",
        "mode": "story",
        "tileX": 4,
        "tileY": 1,
        "team": 0,
        "master": null
    });

    const battleTank = world.createEntity(gameContext, { 
        "type": "blue_elite_battletank",
        "mode": "story",
        "tileX": 0,
        "tileY": 1,
        "team": 1,
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

StoryModePlayState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}   