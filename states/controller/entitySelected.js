import { ControllerComponent } from "../../components/controller.js";
import { CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { SelectSystem } from "../../systems/select.js";
import { TeamSystem } from "../../systems/team.js";
import { createMoveRequest } from "../../actions/moveAction.js";
import { createAttackRequest } from "../../actions/attackAction.js";
import { ControllerSystem } from "../../systems/controller.js";

export const ControllerEntitySelectedState = function() {
    State.call(this);
}

ControllerEntitySelectedState.prototype = Object.create(State.prototype);
ControllerEntitySelectedState.prototype.constructor = ControllerEntitySelectedState;

ControllerEntitySelectedState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const { entityManager, client, actionQueue } = gameContext;
    const { soundPlayer } = client;

    const controller = stateMachine.getContext();
    const controllerComponent = controller.getComponent(ControllerComponent);
    const selectedEntityID = controllerComponent.selectedEntity;
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = gameContext.getTileEntity(x, y);

    if(mouseEntity) {
        const mouseEntityID = mouseEntity.getID();
        const isEnemy = TeamSystem.isEntityEnemy(gameContext, controller, mouseEntity);

        if(isEnemy) {
            actionQueue.addAction(createAttackRequest(mouseEntityID));
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    } else {
        actionQueue.addAction(createMoveRequest(selectedEntityID, x, y));
    }

    SelectSystem.deselectEntity(gameContext, controller, selectedEntity);
    
    stateMachine.setNextState(CONTROLLER_STATES.IDLE);
}

ControllerEntitySelectedState.prototype.update = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();

    ControllerSystem.clearAttackers(gameContext, controller);
    ControllerSystem.updateSelectedEntity(gameContext, controller);
    ControllerSystem.updateAttackers(gameContext, controller);
}