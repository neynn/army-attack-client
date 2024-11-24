import { createAttackRequest } from "../../actions/attackAction.js";
import { createConstructionRequest } from "../../actions/constructionAction.js";
import { ConstructionComponent } from "../../components/construction.js";
import { ControllerComponent } from "../../components/controller.js";
import { CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { ConstructionSystem } from "../../systems/construction.js";
import { ControllerSystem } from "../../systems/controller.js";
import { HealthSystem } from "../../systems/health.js";
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

    const entityID = mouseEntity.getID();
    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(isEnemy && isTargetable) {     
        actionQueue.addRequest(createAttackRequest(entityID));
        return;
    }

    const isControlled = ControllerSystem.isControlled(entityID, controller);
    const isAlive = HealthSystem.isAlive(mouseEntity);

    if(!isControlled || !isAlive) {
        return;
    }

    if(ConstructionSystem.isConstruction(mouseEntity)) {
        if(ConstructionSystem.isComplete(mouseEntity)) {
            //TODO open "complete_construction" interface.
        } else {
            actionQueue.addRequest(createConstructionRequest(entityID));
        }

        return;
    }

    if(actionQueue.isRunning()) {
        return;
    }

    const isMoveable = ControllerSystem.isMoveable(mouseEntity, controller);

    if(isMoveable) {
        ControllerSystem.selectEntity(gameContext, controller, mouseEntity);
            
        stateMachine.setNextState(CONTROLLER_STATES.SELECTED);
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const { actionQueue } = gameContext;
    const controller = stateMachine.getContext();

    if(actionQueue.isRunning()) {
        ControllerSystem.resetAttackerOverlays(gameContext);
        return;
    }

    ControllerSystem.updateAttackers(gameContext, controller);
}