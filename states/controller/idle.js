import { createAttackRequest } from "../../actions/attackAction.js";
import { CONTROLLER_EVENTS, CONTROLLER_STATES } from "../../enums.js";
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

ControllerIdleState.prototype.onEventEnter = function(stateMachine, gameContext, viewportTile) {
    const controller = stateMachine.getContext();
    const { entityManager, actionQueue } = gameContext;

    if(!viewportTile.isOccupied()) {
        return;
    }

    const entityID = viewportTile.getFirstEntity();
    const entity = entityManager.getEntity(entityID);
    const isEnemy = TeamSystem.isEntityEnemy(gameContext, entity, controller);
    const isTargetable = TargetSystem.isTargetable(entity);
    const isControlled = TeamSystem.isControlled(controller, entity);

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
            SelectSystem.selectEntity(entity, gameContext);
            stateMachine.setNextState(CONTROLLER_STATES.ENTITY_SELECTED);
        }

        return;
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { actionQueue } = gameContext;

    if(actionQueue.isRunning()) {
        return;
    }

    ControllerSystem.updateAttackers(gameContext);
}