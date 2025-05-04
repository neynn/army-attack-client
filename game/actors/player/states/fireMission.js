import { State } from "../../../../source/state/state.js";
import { ACTION_TYPE } from "../../../enums.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { FireMissionSystem } from "../../../systems/fireMission.js";
import { Player } from "../player.js";

export const PlayerFireMissionState = function() {
    this.missionID = null;
}

PlayerFireMissionState.prototype = Object.create(State.prototype);
PlayerFireMissionState.prototype.constructor = PlayerFireMissionState;

PlayerFireMissionState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const { missionID } = transition;
    const player = stateMachine.getContext();

    if(missionID) {
        this.missionID = missionID;
    }

    AnimationSystem.revertToIdle(gameContext, player.attackers);

    this.updateCursor(gameContext, player);

    player.clearAttackers();
    player.inputQueue.clear();
    player.attackRangeOverlay.disable(gameContext, player.camera);
}

PlayerFireMissionState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    this.missionID = null;
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

            this.onClick(gameContext, stateMachine, x, y);
            break;
        }
    }
}

PlayerFireMissionState.prototype.updateCursor = function(gameContext, player) {
    const fireMission = gameContext.fireCallTypes[this.missionID];

    if(!fireMission) {
        return;
    }

    const { sprites } = fireMission;

    if(sprites) {
        player.hover.updateSprite(gameContext, sprites.cursor);
    }
}

PlayerFireMissionState.prototype.queueFireMission = function(gameContext, player, tileX, tileY) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const request = actionQueue.createRequest(ACTION_TYPE.FIRE_MISSION, this.missionID, tileX, tileY);
    
    if(request) {
        player.inputQueue.enqueueLast(request);
    }
}

PlayerFireMissionState.prototype.onClick = function(gameContext, stateMachine, tileX, tileY) {
    const player = stateMachine.getContext();
    const isValid = FireMissionSystem.isValid(gameContext, this.missionID, tileX, tileY);

    if(isValid) {
        this.queueFireMission(gameContext, player, tileX, tileY);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    }
}