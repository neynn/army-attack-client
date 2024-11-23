import { createAttackRequest } from "../../actions/attackAction.js";
import { ControllerComponent } from "../../components/controller.js";
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
    const { actionQueue } = gameContext;
    const controller = stateMachine.getContext();
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(isEnemy && isTargetable) {     
        const entityID = mouseEntity.getID();
        actionQueue.addRequest(createAttackRequest(entityID));
        return;
    }

    if(actionQueue.isRunning()) {
        return;
    }

    const isSelectable = ControllerSystem.isSelectable(mouseEntity, controller);

    if(isSelectable) {
        ControllerSystem.selectEntity(gameContext, controller, mouseEntity);
            
        stateMachine.setNextState(CONTROLLER_STATES.SELECTED);
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { actionQueue } = gameContext;
    const controller = stateMachine.getContext();

    if(actionQueue.isRunning()) {
        const controllerComponent = controller.getComponent(ControllerComponent);
        ControllerSystem.resetAttackerOverlays(gameContext, controllerComponent.attackers);
        return;
    }

    ControllerSystem.updateAttackers(gameContext, controller);
}