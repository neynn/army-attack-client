import { State } from "../../../source/state/state.js";
import { HealthComponent } from "../../components/health.js";

import { ACTION_TYPES } from "../../enums.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { PlayerController } from "../../init/controller/player.js";
import { ConstructionSystem } from "../../systems/construction.js";

export const ControllerIdleState = function() {}

ControllerIdleState.prototype = Object.create(State.prototype);
ControllerIdleState.prototype.constructor = ControllerIdleState;

ControllerIdleState.prototype.onEvent = function(stateMachine, gameContext) {
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
    const healthComponent = mouseEntity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isControlled = controller.hasEntity(entityID);

    if(isAttackable && healthComponent.isAlive()) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
        return;
    }

    if(!isControlled) {
        return;
    }

    if(mouseEntity.hasComponent(ArmyEntity.COMPONENT.CONSTRUCTION)) {
        ConstructionSystem.onInteract(gameContext, mouseEntity, controllerID);
    }

    if(!actionQueue.isRunning()) {
        const isMoveable = controller.isEntityMoveable(mouseEntity);

        if(isMoveable) {
            controller.onSelectEntity(gameContext, mouseEntity);
            stateMachine.setNextState(PlayerController.STATE.SELECTED);
        }
    }
}

ControllerIdleState.prototype.onUpdate = function(gameContext, stateMachine) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const controller = stateMachine.getContext();

    controller.regulateSpritePosition(gameContext);

    if(actionQueue.isRunning()) {
        controller.resetAllAttackers(gameContext);
    } else {
        controller.updateAttackers(gameContext);   
    }

    controller.updateHoverSprite(gameContext);
}