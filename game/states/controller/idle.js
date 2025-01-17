import { State } from "../../../source/state/state.js";
import { ConstructionComponent } from "../../components/construction.js";
import { HealthComponent } from "../../components/health.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { ConstructionSystem } from "../../systems/construction.js";

export const ControllerIdleState = function() {}

ControllerIdleState.prototype = Object.create(State.prototype);
ControllerIdleState.prototype.constructor = ControllerIdleState;

ControllerIdleState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const controller = stateMachine.getContext();
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const controllerID = controller.getID();
    const entityID = mouseEntity.getID();
    const isAttackable = controller.isEntityAttackable(gameContext, mouseEntity);
    const healthComponent = mouseEntity.getComponent(HealthComponent);
    const isControlled = controller.hasEntity(entityID);

    if(isAttackable && healthComponent.isAlive()) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
        return;
    }

    if(!isControlled) {
        return;
    }

    if(mouseEntity.hasComponent(ConstructionComponent)) {
        ConstructionSystem.onInteract(gameContext, mouseEntity, controllerID);
    }

    if(!actionQueue.isRunning()) {
        const isMoveable = controller.isEntityMoveable(mouseEntity);

        if(isMoveable) {
            controller.showSelectEntity(gameContext, mouseEntity);
            stateMachine.setNextState(CONTROLLER_STATES.SELECTED);
        }
    }
}

ControllerIdleState.prototype.onUpdate = function(stateMachine, gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const controller = stateMachine.getContext();

    controller.regulateSpritePosition(gameContext);

    if(actionQueue.isRunning()) {
        controller.resetAllAttackers(gameContext, controller);
    } else {
        controller.updateAttackers(gameContext);   
    }

    controller.updateHoverSprite(gameContext);
}