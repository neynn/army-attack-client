import { State } from "../../../../source/state/state.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { ConstructionSystem } from "../../../systems/construction.js";
import { MoveSystem } from "../../../systems/move.js";
import { PathfinderSystem } from "../../../systems/pathfinder.js";
import { PlayerCursor } from "../playerCursor.js";
import { Player } from "../player.js";

export const PlayerIdleState = function() {}

PlayerIdleState.prototype = Object.create(State.prototype);
PlayerIdleState.prototype.constructor = PlayerIdleState;

PlayerIdleState.prototype.onUpdate = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const player = stateMachine.getContext();
    const isShowable = !actionQueue.isRunning() && player.inputQueue.isEmpty();

    if(isShowable) {
        player.updateAttackers(gameContext); 
    } else {
        player.clearAttackers();
    }

    updateCursor(gameContext, player);

    player.updateRangeIndicator(gameContext);
    player.hover.autoAlignSprite(gameContext, player.camera);
}

PlayerIdleState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case Player.EVENT.CLICK: {
            const { x, y } = eventData;

            onClick(gameContext, stateMachine, x, y);
            break;
        }
    }
}

const selectEntity = function(gameContext, player, entity) {
    const entityID = entity.getID();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const enableTileID = player.getOverlayID(gameContext, player.config.overlays.enable);
    const attackTileID = player.getOverlayID(gameContext, player.config.overlays.attack);

    AnimationSystem.playSelect(gameContext, entity);

    player.hover.updateNodes(gameContext, nodeList);
    player.camera.updateMoveOverlay(gameContext, nodeList, enableTileID, attackTileID);
    player.states.setNextState(gameContext, Player.STATE.SELECTED, { "entityID": entityID });
}

const onClick = function(gameContext, stateMachine, tileX, tileY) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const mouseEntity = world.getTileEntity(tileX, tileY);
    const player = stateMachine.getContext();

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const isAttackable = mouseEntity.isAttackableByTeam(gameContext, player.teamID);

    if(isAttackable) {
        player.queueAttack(gameContext, entityID);
        return;
    }

    if(!player.hasEntity(entityID)) {
        return;
    }

    const constructionRequest = ConstructionSystem.onInteract(gameContext, mouseEntity);

    if(constructionRequest) {
        player.inputQueue.enqueueLast(constructionRequest);
    }

    if(!actionQueue.isRunning() && MoveSystem.isMoveable(mouseEntity)) {
        selectEntity(gameContext, player, mouseEntity);
    }
}

const updateCursor = function(gameContext, player) {
    if(player.hover.state !== PlayerCursor.STATE.HOVER_ON_ENTITY) {
        player.hover.hideSprite(gameContext);
        return;
    }

    const hoveredEntity = player.hover.getEntity(gameContext);
    const typeID = player.attackers.size > 0 ? Player.SPRITE_TYPE.ATTACK : Player.SPRITE_TYPE.SELECT;
    const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
    const spriteID = player.getSpriteType(typeID, spriteKey);

    player.hover.updateSprite(gameContext, spriteID);
}