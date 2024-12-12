import { State } from "../../../source/state/state.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { TeamSystem } from "../../systems/team.js";
import { ControllerSystem } from "../../systems/controller.js";
import { SpriteComponent } from "../../components/sprite.js";
import { PositionComponent } from "../../components/position.js";
import { DirectionSystem } from "../../systems/direction.js";
import { MorphSystem } from "../../systems/morph.js";

export const ControllerSelectedState = function() {
    State.call(this);
}

ControllerSelectedState.prototype = Object.create(State.prototype);
ControllerSelectedState.prototype.constructor = ControllerSelectedState;

ControllerSelectedState.prototype.onEventEnter = function(stateMachine, gameContext) {
    const { client, world } = gameContext;
    const { actionQueue, entityManager } = world;
    const { soundPlayer } = client;

    const controller = stateMachine.getContext();
    const selectedEntityID = controller.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

    if(mouseEntity) {
        const mouseEntityID = mouseEntity.getID();
        const isEnemy = TeamSystem.isEntityEnemy(gameContext, controller, mouseEntity);

        if(isEnemy) {
            actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.ATTACK, mouseEntityID));
        } else {
            soundPlayer.playSound("sound_error", 0.5);
        }
    } else {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.MOVE, selectedEntityID, x, y));
    }

    ControllerSystem.deselectEntity(gameContext, controller, selectedEntity);
    
    stateMachine.setNextState(CONTROLLER_STATES.IDLE);
}

ControllerSelectedState.prototype.updateCursorSprite = function(gameContext, controller) {
    const { spriteManager } = gameContext;
    const spriteComponent = controller.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const hoveredEntity = controller.getHoveredEntity();

    if(controller.getSelectedCount() === 0) {
        return;
    }

    if(hoveredEntity) {
        controller.updateHoverSprite(gameContext);
        return;
    }
    
    const nodeKey = `${controller.tileX}-${controller.tileY}`;
    const nodeList = controller.getNodeList();

    if(!nodeList.has(nodeKey)) {
        sprite.hide();
        return;
    }

    spriteManager.updateSprite(spriteComponent.spriteID, controller.config.sprites.move["1-1"]);
    sprite.show();
}

ControllerSelectedState.prototype.updateEntity = function(gameContext, controller) {
    const { world } = gameContext;
    const { entityManager } = world;
    const selectedEntityID = controller.getFirstSelected();
    const selectedEntity = entityManager.getEntity(selectedEntityID);

    if(!selectedEntity) {
        return;
    }

    const positionComponent = selectedEntity.getComponent(PositionComponent);
    
    if(controller.tileX !== positionComponent.tileX) {
        DirectionSystem.lookHorizontal(selectedEntity, controller.tileX < positionComponent.tileX);
        MorphSystem.morphHorizontal(selectedEntity);
    }
}

ControllerSelectedState.prototype.update = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();
    const hoveredEntity = controller.getHoveredEntity();

    controller.regulateSpritePosition(gameContext, hoveredEntity);
    
    this.updateEntity(gameContext, controller);
    ControllerSystem.updateAttackers(gameContext, controller);

    this.updateCursorSprite(gameContext, controller);
}