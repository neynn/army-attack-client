import { State } from "../../../../source/state/state.js";
import { ArmyCamera } from "../../../armyCamera.js";
import { ACTION_TYPE } from "../../../enums.js";
import { ArmyEntity } from "../../../init/armyEntity.js";
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

    this.showBlockedEntities(gameContext, player);
    this.updateCursor(gameContext, player);

    player.clearAttackers();
    player.inputQueue.clear();
    player.attackRangeOverlay.disable(gameContext, player.camera);
}

PlayerFireMissionState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    this.missionID = null;

    player.attackRangeOverlay.enable();
    player.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.FIRE_MISSION);
}

PlayerFireMissionState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover, camera } = player;

    hover.alignSprite(gameContext, camera);
}

PlayerFireMissionState.prototype.onEvent = function(gameContext, stateMachine, eventID) {
    switch(eventID) {
        case Player.EVENT.CLICK: {
            this.onClick(gameContext, stateMachine);
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

PlayerFireMissionState.prototype.onClick = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;
    const { tileX, tileY } = hover;
    const isValid = FireMissionSystem.isValid(gameContext, this.missionID, tileX, tileY);

    if(isValid) {
        this.queueFireMission(gameContext, player, tileX, tileY);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    } else {
        const { client } = gameContext;
        const { soundPlayer } = client;
        
        soundPlayer.play("sound_error", 0.5);
    }
}

PlayerFireMissionState.prototype.showBlockedEntities = function(gameContext, player) {
    const { world, tileManager } = gameContext;
    const { entityManager } = world;
    const { camera } = player;
    const tileID = tileManager.getTileID("cursor", "Disabled");

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.FIRE_MISSION);

    entityManager.forAllEntities((entityID, entity) => {
        const isTargetable = FireMissionSystem.isTargetable(entity);

        if(!isTargetable) {
            const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
            const { tileX, tileY } = positionComponent;
            const endX = tileX + entity.config.dimX;
            const endY = tileY + entity.config.dimY;

            for(let i =  tileY; i < endY; i++) {
                for(let j = tileX; j < endX; j++) {
                    camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.FIRE_MISSION, tileID, j, i);
                }
            }
        }
    });
}