import { EntityManager } from "../../../../source/entity/entityManager.js";
import { State } from "../../../../source/state/state.js";
import { ArmyCamera } from "../../../armyCamera.js";
import { ACTION_TYPE } from "../../../enums.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { LookSystem } from "../../../systems/look.js";
import { ArmyEntity } from "../../../init/armyEntity.js";
import { PlayerCursor } from "../playerCursor.js";
import { Player } from "../player.js";

export const PlayerSelectedState = function() {}

PlayerSelectedState.prototype = Object.create(State.prototype);
PlayerSelectedState.prototype.constructor = PlayerSelectedState;

PlayerSelectedState.prototype.onExit = function(gameContext, stateMachine) {
    deselectEntity(gameContext, stateMachine);
}

PlayerSelectedState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.updateAttackers(gameContext);
    updateEntity(gameContext, player);
    updateCursor(gameContext, player);
    player.updateRangeIndicator(gameContext);
    player.hover.autoAlignSprite(gameContext, player.camera);
}

PlayerSelectedState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case Player.EVENT.CLICK: {
            const { x, y } = eventData;

            onClick(gameContext, stateMachine, x, y);
            break;
        }
    }
}

const updateEntity = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntity = entityManager.getEntity(player.selectedEntityID);

    if(!selectedEntity) {
        return;
    }

    const hoverTileX = player.hover.tileX;
    const { tileX } = selectedEntity.getComponent(ArmyEntity.COMPONENT.POSITION);
    
    if(hoverTileX !== tileX) {
        LookSystem.lookHorizontal(selectedEntity, hoverTileX < tileX);

        selectedEntity.updateSpriteHorizontal(gameContext, selectedEntity);
    }
}

const updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    if(state === PlayerCursor.STATE.HOVER_ON_ENTITY) {
        const hoveredEntity = hover.getEntity(gameContext);
        const typeID = player.attackers.size > 0 ? Player.SPRITE_TYPE.ATTACK : Player.SPRITE_TYPE.SELECT;
        const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
        const spriteID = player.getSpriteType(typeID, spriteKey);

        hover.updateSprite(gameContext, spriteID);
        return;
    }

    if(state === PlayerCursor.STATE.HOVER_ON_NODE) {
        const spriteID = player.getSpriteType(Player.SPRITE_TYPE.MOVE, "1-1");

        hover.updateSprite(gameContext, spriteID);
        return;
    }

    hover.hideSprite(gameContext);
}

const deselectEntity = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { entityManager } = world;
    const player = stateMachine.getContext();
    const entity = entityManager.getEntity(player.selectedEntityID);

    if(entity) {
        AnimationSystem.stopSelect(gameContext, entity);
    }

    player.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    player.hover.clearNodes();
    player.selectedEntityID = EntityManager.ID.INVALID;
}

const onClick = function(gameContext, stateMachine, tileX, tileY) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { soundPlayer } = client;
    const mouseEntity = world.getTileEntity(tileX, tileY);
    const player = stateMachine.getContext();

    if(mouseEntity) {
        const isAttackable = mouseEntity.isAttackableByTeam(gameContext, player.teamID);

        if(isAttackable) {
            const entityID = mouseEntity.getID();

            player.queueAttack(gameContext, entityID);
        } else {
            soundPlayer.play("sound_error", 0.5); 
        }
    } else {
        const request = actionQueue.createRequest(ACTION_TYPE.MOVE, player.selectedEntityID, tileX, tileY);

        if(request) {
            player.inputQueue.enqueueLast(request);
        }
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}