import { State } from "../../../source/state/state.js";

import { CONTROLLER_STATES } from "../../enums.js";
import { TeamSystem } from "../../systems/team.js";
import { createMoveRequest } from "../../actions/moveAction.js";
import { createAttackRequest } from "../../actions/attackAction.js";
import { ControllerSystem } from "../../systems/controller.js";

export const ControllerSelectedState = function() {
    State.call(this);
}

ControllerSelectedState.prototype = Object.create(State.prototype);
ControllerSelectedState.prototype.constructor = ControllerSelectedState;

ControllerSelectedState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const { entityManager, client, actionQueue } = gameContext;
    const { soundPlayer } = client;

    const controller = stateMachine.getContext();
    const selectedEntityID = controller.getSelectedEntity();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = gameContext.getTileEntity(x, y);

    if(mouseEntity) {
        const mouseEntityID = mouseEntity.getID();
        const isEnemy = TeamSystem.isEntityEnemy(gameContext, controller, mouseEntity);

        if(isEnemy) {
            actionQueue.addRequest(createAttackRequest(mouseEntityID));
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    } else {
        actionQueue.addRequest(createMoveRequest(selectedEntityID, x, y));
    }

    ControllerSystem.deselectEntity(gameContext, controller, selectedEntity);
    
    stateMachine.setNextState(CONTROLLER_STATES.IDLE);
}

ControllerSelectedState.prototype.update = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();

    controller.updateCursorPositionDefault(gameContext);
    controller.updateCursorSpriteSelected(gameContext);
    
    ControllerSystem.updateSelectedEntity(gameContext, controller);
    ControllerSystem.updateAttackers(gameContext, controller);
}