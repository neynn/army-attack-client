import { EntityManager } from "../../../../source/entity/entityManager.js";
import { ArmyCamera } from "../../../armyCamera.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { LookSystem } from "../../../systems/look.js";
import { ArmyEntity } from "../../../init/armyEntity.js";
import { PlayerCursor } from "../playerCursor.js";
import { Player } from "../player.js";
import { MoveAction } from "../../../actions/moveAction.js";
import { PlayerState } from "./playerState.js";
import { AttackSystem } from "../../../systems/attack.js";

export const PlayerSelectedState = function() {
    this.entityID = EntityManager.ID.INVALID;
}

PlayerSelectedState.prototype = Object.create(PlayerState.prototype);
PlayerSelectedState.prototype.constructor = PlayerSelectedState;

PlayerSelectedState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const player = stateMachine.getContext();
    const { entityID } = transition;

    player.rangeVisualizer.enable();

    this.entityID = entityID;
}

PlayerSelectedState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
        
    this.deselectEntity(gameContext, player);

    player.attackVisualizer.resetAttackers(gameContext);
}

PlayerSelectedState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    const { hover } = player;

    player.attackVisualizer.updateAttackers(gameContext, player);
    this.updateEntity(gameContext, player);
    this.updateCursor(gameContext, player);
    player.rangeVisualizer.update(gameContext, player);
    hover.alignSpriteAuto(gameContext);
}

PlayerSelectedState.prototype.updateEntity = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntity = entityManager.getEntity(this.entityID);

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

PlayerSelectedState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const typeID = player.attackVisualizer.isAnyAttacking() ? Player.SPRITE_TYPE.ATTACK : Player.SPRITE_TYPE.SELECT;
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = player.getSpriteType(typeID, spriteKey);
    
            hover.updateSprite(gameContext, spriteID);
            break;
        }
        case PlayerCursor.STATE.HOVER_ON_NODE: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.MOVE, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            hover.hideSprite(gameContext);
            break;
        }
    }
}

PlayerSelectedState.prototype.deselectEntity = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.entityID);

    if(entity) {
        AnimationSystem.stopSelect(gameContext, entity);
    }

    player.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    player.hover.clearNodes();

    this.entityID = EntityManager.ID.INVALID;
}

PlayerSelectedState.prototype.onClick = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const player = stateMachine.getContext();
    const { hover } = player;
    const { state, tileX, tileY, currentTarget } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const mouseEntity = hover.getEntity(gameContext);
            const isAttackable = AttackSystem.isAttackableByTeam(gameContext, mouseEntity, player.teamID);

            if(isAttackable) {
                player.queueAttack(currentTarget);
            } else {
                soundPlayer.play(player.config.sounds.error, 0.5); 
            }

            break;
        }
        case PlayerCursor.STATE.HOVER_ON_NODE: {
            const playerID = player.getID();
            const request = MoveAction.createRequest(playerID, this.entityID, tileX, tileY);

            player.inputQueue.enqueueLast(request);
            break;
        }
        default: {
            soundPlayer.play(player.config.sounds.error, 0.5); 
            break;
        }
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}