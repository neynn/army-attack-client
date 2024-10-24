import { ControllerComponent } from "../../components/controller.js";
import { PositionComponent } from "../../components/position.js";
import { CONTROLLER_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { DirectionSystem } from "../../systems/direction.js";
import { SelectSystem } from "../../systems/select.js";
import { TeamSystem } from "../../systems/team.js";
import { MorphSystem } from "../../systems/morph.js";
import { createMoveRequest } from "../../actions/moveAction.js";

export const ControllerEntitySelectedState = function() {
    State.call(this);
}

ControllerEntitySelectedState.prototype = Object.create(State.prototype);
ControllerEntitySelectedState.prototype.constructor = ControllerEntitySelectedState;

ControllerEntitySelectedState.prototype.onEventEnter = function(stateMachine, gameContext, viewportTile) {
    const controller = stateMachine.getContext();
    const { entityManager, client, actionQueue } = gameContext;
    const { soundPlayer } = client;
    const controllerComponent = controller.getComponent(ControllerComponent);
    const selectedEntityID = controllerComponent.selectedEntity;
    const entity = entityManager.getEntity(selectedEntityID);

    if(!viewportTile.isOccupied()) {
        const { x, y } = gameContext.getViewportTilePosition();

        actionQueue.addAction(createMoveRequest(selectedEntityID, x, y));
    } else {
        const tileEntityID = viewportTile.getFirstEntity();
        const tileEntity = gameContext.entityManager.getEntity(tileEntityID);
        const isFriendly = TeamSystem.isEntityFriendly(gameContext, controller, tileEntity);
        const isControlled = TeamSystem.isControlled(controller, tileEntity);
    
        if(!isFriendly) {
            //start an attack with all units in range.
            //do not care about controllers with friendliness.
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    }

    SelectSystem.deselectEntity(entity, gameContext);
    stateMachine.setNextState(CONTROLLER_STATES.IDLE);
}

ControllerEntitySelectedState.prototype.update = function(stateMachine, gameContext) {
    const { entityManager } = gameContext;
    const controller = stateMachine.getContext();
    const controllerComponent = controller.getComponent(ControllerComponent);
    const selectedEntity = entityManager.getEntity(controllerComponent.selectedEntity);
    const selectedEntityPositionComponent = selectedEntity.getComponent(PositionComponent);
    const { x, y } = gameContext.getViewportTilePosition();

    if(x !== selectedEntityPositionComponent.tileX) {
        DirectionSystem.lookHorizontal(selectedEntity, x < selectedEntityPositionComponent.tileX);
        MorphSystem.morphHorizontal(selectedEntity);
    }
}