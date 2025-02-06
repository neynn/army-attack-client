import { State } from "../../../source/state/state.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { PositionComponent } from "../../components/position.js";
import { DirectionSystem } from "../../systems/direction.js";
import { MorphSystem } from "../../systems/morph.js";

export const ControllerSelectedState = function() {}

ControllerSelectedState.prototype = Object.create(State.prototype);
ControllerSelectedState.prototype.constructor = ControllerSelectedState;

ControllerSelectedState.prototype.updateCursorSprite = function(gameContext, controller) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(controller.spriteID);

    if(controller.hover.isHoveringOnEntity()) {
        controller.updateHoverSprite(gameContext);
        return;
    }

    if(!controller.hover.isHoveringOnNode()) {
        sprite.hide();
        return;
    }

    spriteManager.updateSprite(controller.spriteID, controller.config.sprites.move["1-1"]);
    sprite.show();
}

ControllerSelectedState.prototype.updateEntity = function(gameContext, controller) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntityID = controller.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    if(!selectedEntity) {
        return;
    }

    const positionComponent = selectedEntity.getComponent(PositionComponent);
    
    if(controller.hover.tileX !== positionComponent.tileX) {
        DirectionSystem.lookHorizontal(selectedEntity, controller.hover.tileX < positionComponent.tileX);
        MorphSystem.morphHorizontal(gameContext, selectedEntity);
    }
}

ControllerSelectedState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const { client, world } = gameContext;
    const { actionQueue, entityManager } = world;
    const { soundPlayer } = client;
    const controller = stateMachine.getContext();
    const selectedEntityID = controller.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

    if(mouseEntity) {
        const mouseEntityID = mouseEntity.getID();
        const isAttackable = controller.isEntityAttackable(gameContext, mouseEntity);

        if(isAttackable) {
            actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, mouseEntityID));
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    } else {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, selectedEntityID, x, y));
    }

    controller.onDeselectEntity(gameContext, selectedEntity);
    stateMachine.setNextState(CONTROLLER_STATES.IDLE);
}

ControllerSelectedState.prototype.onUpdate = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();

    controller.regulateSpritePosition(gameContext);
    this.updateEntity(gameContext, controller);
    controller.updateAttackers(gameContext);
    this.updateCursorSprite(gameContext, controller);
}