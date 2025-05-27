import { State } from "../../../../source/state/state.js";
import { AnimationSystem } from "../../../systems/animation.js";
import { Player } from "../player.js";
import { PlayerCursor } from "../playerCursor.js";

export const PlayerSellState = function() {}

PlayerSellState.prototype = Object.create(State.prototype);
PlayerSellState.prototype.constructor = PlayerSellState;

PlayerSellState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const player = stateMachine.getContext();

    this.showSellableObjects(gameContext, player);
    player.rangeVisualizer.disable(gameContext);
}

PlayerSellState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    this.hideSellableObjects(gameContext, player);
    player.rangeVisualizer.enable();
}

PlayerSellState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    
    //player.rangeVisualizer.update(gameContext, player);
    this.updateCursor(gameContext, player);

    player.hover.autoAlignSprite(gameContext);
}

PlayerSellState.prototype.hideSellableObjects = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = player;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            AnimationSystem.stopSell(gameContext, entity);
        }
    }
}

PlayerSellState.prototype.showSellableObjects = function(gameContext, player) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = player;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            AnimationSystem.playSell(gameContext, entity);
        }
    }
}

PlayerSellState.prototype.updateCursor = function(gameContext, player) {
    const { hover } = player;
    const { state } = hover;

    switch(state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoveredEntity = hover.getEntity(gameContext);
            const spriteKey = `${hoveredEntity.config.dimX}-${hoveredEntity.config.dimY}`;
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.ATTACK, spriteKey);

            hover.updateSprite(gameContext, spriteID);
            break;
        }
        default: {
            const spriteID = player.getSpriteType(Player.SPRITE_TYPE.ATTACK, "1-1");

            hover.updateSprite(gameContext, spriteID);
            break;
        }
    }
}   