import { createAttackRequest } from "../../actions/attackAction.js";
import { ControllerComponent } from "../../components/controller.js";
import { CONTROLLER_EVENTS, CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
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
    const controllerComponent = controller.getComponent(ControllerComponent);

    if(actionQueue.isRunning()) {
        return;
    }

    if(!viewportTile.isOccupied()) {
        //check if debris is on the tile and try removing it.
        return;
    }

    const entityID = viewportTile.getFirstEntity();
    const entity = entityManager.getEntity(entityID);
    const isFriendly = TeamSystem.isEntityFriendly(gameContext, controller, entity);
    const isControlled = TeamSystem.isControlled(controller, entity);

    if(!isFriendly) {
        
        actionQueue.addAction(createAttackRequest(entityID));

        if(isControlled) {
            console.error("We're fucked! :D");
            //This should not happen except in debug modes.
            return;
        }

        //actually, we should not care about controllers with friendliness.
        //start an attack with all units in range.
        return;
    }

    //if its controlled, the controller can generally interact with the entity.
    //however, an entity needs to be selectable so that the controller can move on to the selected state.
    if(isControlled) {
        const isSelectable = SelectSystem.isSelectable(entity);
        entity.states.onEventEnter(gameContext, CONTROLLER_EVENTS.CLICK);

        if(isSelectable) {
            SelectSystem.selectEntity(entity, gameContext);
            stateMachine.setNextState(CONTROLLER_STATES.ENTITY_SELECTED);
        }
    }
}

ControllerIdleState.prototype.update = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();
}