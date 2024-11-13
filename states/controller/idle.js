import { createAttackRequest } from "../../actions/attackAction.js";
import { CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { ControllerSystem } from "../../systems/controller.js";
import { SelectSystem } from "../../systems/select.js";
import { TargetSystem } from "../../systems/target.js";
import { TeamSystem } from "../../systems/team.js";

export const ControllerIdleState = function() {
    State.call(this);
}

ControllerIdleState.prototype = Object.create(State.prototype);
ControllerIdleState.prototype.constructor = ControllerIdleState;

ControllerIdleState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();
    const { entityManager, actionQueue } = gameContext;
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const isControlled = controller.hasEntity(entityID);
    const entity = entityManager.getEntity(entityID);
    const isEnemy = TeamSystem.isEntityEnemy(gameContext, entity, controller);
    const isTargetable = TargetSystem.isTargetable(entity);

    if(isEnemy && isTargetable) {        
        actionQueue.addAction(createAttackRequest(entityID));
        return;
    }

    if(actionQueue.isRunning()) {
        return;
    }

    if(isControlled) {
        const isSelectable = SelectSystem.isSelectable(entity);

        if(isSelectable) {
            SelectSystem.selectEntity(gameContext, controller, entity);
            
            stateMachine.setNextState(CONTROLLER_STATES.ENTITY_SELECTED);
        }

        return;
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { actionQueue } = gameContext;
    const controller = stateMachine.getContext();

    if(actionQueue.isRunning()) {
        return;
    }
    
    ControllerSystem.clearAttackers(gameContext, controller);
    ControllerSystem.updateAttackers(gameContext, controller);
}