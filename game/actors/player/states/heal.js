import { State } from "../../../../source/state/state.js";
import { ACTION_TYPE } from "../../../enums.js";
import { Player } from "../player.js";
import { PlayerCursor } from "../playerCursor.js";

export const PlayerHealState = function() {}

PlayerHealState.prototype = Object.create(State.prototype);
PlayerHealState.prototype.constructor = PlayerHealState;

PlayerHealState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.rangeVisualizer.disable(gameContext);
}

PlayerHealState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.rangeVisualizer.enable();
}

PlayerHealState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;

    this.updateCursor(gameContext, player);
    hover.autoAlignSprite(gameContext);
}

PlayerHealState.prototype.onEvent = function(gameContext, stateMachine, eventID) {
    switch(eventID) {
        case Player.EVENT.CLICK: {
            this.onClick(gameContext, stateMachine);
            break;
        }
    }
}

PlayerHealState.prototype.onClick = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;
    const { tileX, tileY, currentTarget } = hover;
    const isValid = this.isValid(gameContext, player, tileX, tileY);

    if(isValid) {
        this.queueHeal(gameContext, player, currentTarget);
    } else {
        const { client } = gameContext;
        const { soundPlayer } = client;
        
        soundPlayer.play("sound_error", 0.5);
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}

PlayerHealState.prototype.queueHeal = function(gameContext, player, entityID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const playerID = player.getID();
    const request = actionQueue.createRequest(ACTION_TYPE.HEAL, entityID, playerID);
    
    if(request) {
        player.inputQueue.enqueueLast(request);
    }
}

PlayerHealState.prototype.isValid = function(gameContext, player, tileX, tileY) {
    return false;
}

PlayerHealState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.REPAIR, spriteKey);

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.REPAIR, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
    }
}   