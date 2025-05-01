import { State } from "../../../../source/state/state.js";
import { ACTION_TYPE } from "../../../enums.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { FireMissionSystem } from "../../../systems/fireMission.js";
import { Player } from "../player.js";

export const PlayerFireMissionState = function() {}

PlayerFireMissionState.prototype = Object.create(State.prototype);
PlayerFireMissionState.prototype.constructor = PlayerFireMissionState;

PlayerFireMissionState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    AnimationSystem.revertToIdle(gameContext, player.attackers);

    updateCursor(gameContext, player);
    player.clearAttackers();
    player.inputQueue.clear();
    player.attackRangeOverlay.disable(gameContext, player.camera);
}

PlayerFireMissionState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.selectedFireMissionID = null;
    player.attackRangeOverlay.enable();
}

PlayerFireMissionState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.hover.alignSprite(gameContext, player.camera);
}

PlayerFireMissionState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case Player.EVENT.CLICK: {
            const { x, y } = eventData;

            onClick(gameContext, stateMachine, x, y);
            break;
        }
    }
}

const updateCursor = function(gameContext, player) {
    const fireMission = gameContext.fireCallTypes[player.selectedFireMissionID];

    if(!fireMission) {
        return;
    }

    const { sprites } = fireMission;

    if(sprites) {
        player.hover.updateSprite(gameContext, sprites.cursor);
    }
}

const queueFireMission = function(gameContext, player, tileX, tileY) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const request = actionQueue.createRequest(ACTION_TYPE.FIRE_MISSION, player.selectedFireMissionID, tileX, tileY);
    
    if(request) {
        player.inputQueue.enqueueLast(request);
    }
}

const onClick = function(gameContext, stateMachine, tileX, tileY) {
    const player = stateMachine.getContext();
    const isValid = FireMissionSystem.isValid(gameContext, player.selectedFireMissionID, tileX, tileY);

    if(isValid) {
        queueFireMission(gameContext, player, tileX, tileY);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    }
}