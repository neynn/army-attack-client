import { createAttackRequest } from "../../actions/attackAction.js";
import { createMoveRequest } from "../../actions/moveAction.js";
import { State } from "../../source/state/state.js";
import { StateMachine } from "../../source/state/stateMachine.js";

export const StoryModeState = function() {
    State.call(this);
    this.states = new StateMachine(this);
}

StoryModeState.prototype = Object.create(State.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.enter = async function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, spriteManager, controller, entityManager, mapLoader, actionQueue } = gameContext;
    const MAP = "pvp_valleys";

    const map2D = await gameContext.loadMap(MAP);
    
    if(!map2D) {
        console.error("Error loading map!");
        return;
    }

    uiManager.parseUI("STORY_MODE", gameContext);
    
    gameContext.initializeController({ "team": "1", "master": "neyn" });

    gameContext.initializeTilemap(MAP);

    const blueGuardtower = gameContext.initializeEntity({ 
        "type": "blue_guardtower",
        "tileX": 0,
        "tileY": 3,
        "team": "1",
        "master": "neyn"
    });
    const redBattletank = gameContext.initializeEntity({ 
        "type": "red_battletank",
        "tileX": 4,
        "tileY": 1,
        "team": "0",
        "master": null
    });
    const blueCommando = gameContext.initializeEntity({ 
        "type": "blue_commando",
        "tileX": 1,
        "tileY": 3,
        "team": "1",
        "master": "neyn"
    });
    const blueEliteInfantry = gameContext.initializeEntity({ 
        "type": "blue_elite_infantry",
        "tileX": 6,
        "tileY": 5,
        "team": "1",
        "master": "neyn",
        "components": {
            "Move": {
                "range": 15
            }
        }
    });
    const battleTank = gameContext.initializeEntity({ 
        "type": "blue_elite_battletank",
        "tileX": 0,
        "tileY": 1,
        "team": "1",
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

    actionQueue.addAction(createMoveRequest(battleTank.id, 7, 1));
    actionQueue.addAction(createMoveRequest(battleTank.id, 3, 0));
    actionQueue.addAction(createAttackRequest(redBattletank.id));
    actionQueue.addAction(createAttackRequest(redBattletank.id));
}

StoryModeState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, controller } = gameContext;

    uiManager.unparseUI("PLAY_GAME", gameContext);
    controller.states.reset();
}   