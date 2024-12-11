import { State } from "../../../source/state/state.js";

import { ACTION_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { TeamSystem } from "../../systems/team.js";
import { ControllerSystem } from "../../systems/controller.js";
import { SpriteComponent } from "../../components/sprite.js";

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

    if(controller.hasNoSelection()) {
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

ControllerSelectedState.prototype.update = function(stateMachine, gameContext) {
    const controller = stateMachine.getContext();
    const hoveredEntity = controller.getHoveredEntity();

    controller.regulateSpritePosition(gameContext, hoveredEntity);
    
    ControllerSystem.updateSelectedEntity(gameContext, controller);
    ControllerSystem.updateAttackers(gameContext, controller);

    this.updateCursorSprite(gameContext, controller);
}