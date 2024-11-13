import { createAttackRequest } from "../../actions/attackAction.js";
import { CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { ControllerSystem } from "../../systems/controller.js";
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
    const entity = entityManager.getEntity(entityID);
    const isEnemy = TeamSystem.isEntityEnemy(gameContext, entity, controller);
    const isTargetable = TargetSystem.isTargetable(entity);
    const isSelectable = ControllerSystem.isSelectable(entity, controller);

    if(isEnemy && isTargetable) {     
        actionQueue.addAction(createAttackRequest(entityID));
        return;
    }

    if(actionQueue.isRunning()) {
        return;
    }

    if(isSelectable) {
        ControllerSystem.selectEntity(gameContext, controller, entity);
            
        stateMachine.setNextState(CONTROLLER_STATES.ENTITY_SELECTED);
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { actionQueue } = gameContext;
    const controller = stateMachine.getContext();

    if(actionQueue.isRunning()) {
        ControllerSystem.resetAttackerOverlay(gameContext, controller);
        return;
    }

    ControllerSystem.updateAttackers(gameContext, controller);
}