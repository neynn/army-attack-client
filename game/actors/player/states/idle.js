import { AnimationSystem } from "../../../systems/animation.js";
import { ConstructionSystem } from "../../../systems/construction.js";
import { MoveSystem } from "../../../systems/move.js";
import { PathfinderSystem } from "../../../systems/pathfinder.js";
import { PlayerCursor } from "../playerCursor.js";
import { Player } from "../player.js";
import { ClearDebrisAction } from "../../../actions/clearDebrisAction.js";
import { PlayerState } from "./playerState.js";
import { AttackSystem } from "../../../systems/attack.js";

export const PlayerIdleState = function() {}

PlayerIdleState.prototype = Object.create(PlayerState.prototype);
PlayerIdleState.prototype.constructor = PlayerIdleState;

PlayerIdleState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.rangeVisualizer.enable();
}

PlayerIdleState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.attackVisualizer.resetAttackers(gameContext);
}

PlayerIdleState.prototype.onUpdate = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const player = stateMachine.getContext();
    const isShowable = !actionQueue.isRunning() && player.inputQueue.isEmpty();

    if(isShowable) {
        player.attackVisualizer.updateAttackers(gameContext, player); 
    } else {
        player.attackVisualizer.clearOverlay();
    }

    this.updateCursor(gameContext, player);

    player.rangeVisualizer.update(gameContext, player);
    player.hover.alignSpriteAuto(gameContext);
}

PlayerIdleState.prototype.selectEntity = function(gameContext, player, entity) {
    const { tileManager } = gameContext;

    const entityID = entity.getID();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const enableTileID = tileManager.getTileIDByArray(player.config.overlays.enable);
    const attackTileID = tileManager.getTileIDByArray(player.config.overlays.attack);

    AnimationSystem.playSelect(gameContext, entity);

    player.hover.updateNodes(gameContext, nodeList);
    player.camera.updateMoveOverlay(gameContext, nodeList, enableTileID, attackTileID);
    player.states.setNextState(gameContext, Player.STATE.SELECTED, { "entityID": entityID });
}

PlayerIdleState.prototype.queueClearDebris = function(player, tileX, tileY) {
    const playerID = player.getID();
    const request = ClearDebrisAction.createRequest(playerID, tileX, tileY);
    
    player.inputQueue.enqueueLast(request);
}

PlayerIdleState.prototype.onClick = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { actionQueue } = world;

    const player = stateMachine.getContext();
    const { hover } = player;
    const { state, currentTarget, tileX, tileY } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const playerID = player.getID();
            const mouseEntity = hover.getEntity(gameContext);
            const isAttackable = AttackSystem.isAttackableByTeam(gameContext, mouseEntity, player.teamID);

            if(isAttackable) {
                player.queueAttack(currentTarget);
                return;
            }
        
            if(!player.hasEntity(currentTarget)) {
                return;
            }
        
            const constructionRequest = ConstructionSystem.onInteract(gameContext, mouseEntity, playerID);
        
            if(constructionRequest) {
                player.inputQueue.enqueueLast(constructionRequest);
                return;
            }
        
            if(!actionQueue.isRunning() && MoveSystem.isMoveable(mouseEntity)) {
                this.selectEntity(gameContext, player, mouseEntity);
            }

            break;
        }
        case PlayerCursor.STATE.HOVER_ON_DEBRIS: {
            this.queueClearDebris(player, tileX, tileY);
            break;
        }
    }
}

PlayerIdleState.prototype.updateCursor = function(gameContext, player) {
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
        case PlayerCursor.STATE.HOVER_ON_DEBRIS: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.DEBRIS, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            hover.hideSprite(gameContext);
            break;
        }
    }
}