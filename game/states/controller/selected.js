import { State } from "../../../source/state/state.js";
import { ACTION_TYPES } from "../../enums.js";
import { PlayerController } from "../../init/controller/player.js";
import { ArmyEntity } from "../../init/armyEntity.js";

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

    const positionComponent = selectedEntity.getComponent(ArmyEntity.COMPONENT.POSITION);
    
    if(controller.hover.tileX !== positionComponent.tileX) {
        selectedEntity.lookHorizontal(controller.hover.tileX < positionComponent.tileX);
        selectedEntity.updateSpriteHorizontal(gameContext, selectedEntity);
    }
}

ControllerSelectedState.prototype.onEvent = function(stateMachine, gameContext) {
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
    stateMachine.setNextState(PlayerController.STATE.IDLE);
}

ControllerSelectedState.prototype.onUpdate = function(gameContext, stateMachine) {
    const controller = stateMachine.getContext();

    controller.regulateSpritePosition(gameContext);
    this.updateEntity(gameContext, controller);
    controller.updateAttackers(gameContext);
    this.updateCursorSprite(gameContext, controller);
}