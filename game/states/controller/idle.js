import { State } from "../../../source/state/state.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { ConstructionSystem } from "../../systems/construction.js";
import { DeathSystem } from "../../systems/death.js";
import { HealthSystem } from "../../systems/health.js";
import { SpawnSystem } from "../../systems/spawn.js";

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

    const entityID = mouseEntity.getID();
    const isAttackable = controller.isEntityAttackable(gameContext, mouseEntity);
    const isAlive = HealthSystem.isAlive(mouseEntity);
    const isControlled = controller.hasEntity(entityID);

    if(isAttackable && isAlive) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
        return;
    }

    if(!isControlled) {
        return;
    }

    if(ConstructionSystem.isConstruction(mouseEntity)) {
        if(ConstructionSystem.isComplete(mouseEntity)) {
            if(!actionQueue.isRunning()) {
                const result = ConstructionSystem.getConstructionResult(controller, mouseEntity);
            
                //TODO: Open GUI and check if the controller has enough materials/resources.
                DeathSystem.destroyEntity(gameContext, entityID);
                SpawnSystem.createEntity(gameContext, result);
            }
        } else {
            actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.CONSTRUCTION, entityID));
        }

        return;
    }

    if(actionQueue.isRunning()) {
        return;
    }

    const isMoveable = controller.isEntityMoveable(mouseEntity);

    if(isMoveable) {
        controller.showSelectEntity(gameContext, mouseEntity);
        stateMachine.setNextState(CONTROLLER_STATES.SELECTED);
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