import { createAttackRequest } from "../../../actions/attackAction.js";
import { createMoveRequest } from "../../../actions/moveAction.js";
import { CAMERAS, CONTROLLER_TYPES } from "../../../enums.js";
import { MapParser } from "../../../source/map/mapParser.js";
import { State } from "../../../source/state/state.js";

export const StoryModePlayState = function() {
    State.call(this);
}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.enter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, actionQueue, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERAS.ARMY_CAMERA);
    const MAP = "pvp_valleys";
    const success = await gameContext.parseMap(MAP, (id, data, meta) => MapParser.parseMap2D(id, data, meta, true));

    if(!success) {
        console.error("Error loading map!");
        return;
    }

    uiManager.parseUI("STORY_MODE", gameContext);
    
    gameContext.createController({
        "type": CONTROLLER_TYPES.PLAYER,
        "team": 1
    }, "neyn");

    gameContext.initializeTilemap(MAP);
    camera.centerOnMap();
    camera.bindViewport();

    gameContext.createEntity({ 
        "type": "blue_guardtower",
        "tileX": 0,
        "tileY": 3,
        "team": 1
    }, "neyn");

    gameContext.createEntity({ 
        "type": "blue_elite_battery",
        "tileX": 4,
        "tileY": 3,
        "team": 0
    }, null);

    gameContext.createEntity({ 
        "type": "blue_commando",
        "tileX": 1,
        "tileY": 3,
        "team": 1
    }, "neyn");

    gameContext.createEntity({ 
        "type": "red_artillery",
        "tileX": 2,
        "tileY": 3,
        "team": 1
    }, "neyn");

    gameContext.createEntity({ 
        "type": "blue_elite_infantry",
        "tileX": 6,
        "tileY": 5,
        "team": 1,
        "components": {
            "Move": {
                "range": 15
            }
        }
    }, "neyn");

    gameContext.createEntity({ 
        "type": "red_bulldozer",
        "tileX": 3,
        "tileY": 1,
        "team": 1
    }, "neyn");

    const redBattletank = gameContext.createEntity({ 
        "type": "red_battletank",
        "tileX": 4,
        "tileY": 1,
        "team": 0
    }, null);

    const battleTank = gameContext.createEntity({ 
        "type": "blue_elite_battletank",
        "tileX": 0,
        "tileY": 1,
        "team": 1,
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
    }, "neyn");

    actionQueue.addRequest(createMoveRequest(battleTank.id, 7, 1));
    actionQueue.addRequest(createMoveRequest(battleTank.id, 3, 0));
    //actionQueue.addRequest(createAttackRequest(redBattletank.id));
}

StoryModePlayState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
}   