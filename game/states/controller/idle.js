import { State } from "../../../source/state/state.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
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
    const { world } = gameContext;
    const { actionQueue } = world;
    const controller = stateMachine.getContext();
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const entityID = mouseEntity.getID();
    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(isEnemy && isTargetable) {     
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, entityID));
        return;
    }

    const isControlled = ControllerSystem.isControlled(entityID, controller);
    const isAlive = HealthSystem.isAlive(mouseEntity);

    if(!isControlled || !isAlive) {
        return;
    }

    //Add eventManager to the gameContext. the event manager gets filled with, well, events, which are just functions, like the actionQueue
    //The eventManager instantly processed events.
    if(ConstructionSystem.isConstruction(mouseEntity)) {
        if(ConstructionSystem.isComplete(mouseEntity)) {
            const result = ConstructionSystem.getConstructionResult(controller, mouseEntity);
            
            //TODO: Open GUI and check if the controller has enough materials/resources.
            world.destroyEntity(entityID);
            world.createEntity(gameContext, result);
        } else {
            actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.CONSTRUCTION, entityID));
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
    const { world } = gameContext;
    const { actionQueue } = world;
    const controller = stateMachine.getContext();

    controller.updateCursorPositionDefault(gameContext);
    controller.updateCursorSpriteIdle(gameContext);

    if(actionQueue.isRunning()) {
        ControllerSystem.resetAttackerOverlays(gameContext);
    } else {
        ControllerSystem.updateAttackers(gameContext, controller);   
    }
}