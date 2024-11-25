import { CONTROLLER_STATES } from "../../enums.js";
import { tileToPosition_center } from "../../source/camera/helpers.js";
import { Cursor } from "../../source/client/cursor.js";
import { Controller } from "../../source/controller/controller.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { ControllerBuildState } from "../../states/controller/build.js";
import { ControllerSelectedState } from "../../states/controller/selected.js";
import { ControllerIdleState } from "../../states/controller/idle.js";
import { componentSetup } from "../componentSetup.js";
import { PositionComponent } from "../../components/position.js";
import { SpriteComponent } from "../../components/sprite.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";

export const PlayerController = function(id) {
    Controller.call(this, id);
    this.moveSprite = "cursor_select_1x1";
    this.selectSprites = {
        "1-1": "cursor_select_1x1",
        "2-1": "cursor_select_2x1",
        "2-2": "cursor_select_2x2",
        "3-2": "cursor_select_3x2",
        "3-3": "cursor_select_3x3",
        "4-1": "cursor_select_4x1",
        "4-2": "cursor_select_4x2",
        "4-4": "cursor_select_4x4"
    };
    this.attackSprites = {
        "1-1": "cursor_attack_1x1",
        "2-1": "cursor_attack_2x1",
        "2-2": "cursor_attack_2x2",
        "3-2": "cursor_attack_3x2",
        "3-3": "cursor_attack_3x3",
        "4-1": "cursor_attack_4x1",
        "4-2": "cursor_attack_4x2",
        "4-4": "cursor_attack_4x4"
    };
    this.powerupSprites = {
        "1-1": "cursor_powerup_1x1",
        "2-2": "cursor_powerup_2x2",
        "3-1": "cursor_powerup_3x1",
        "3-3": "cursor_powerup_3x3",
        "6-1": "cursor_powerup_6x1"
    };
    this.hoveredEntity = null;
    this.selectedEntity = null;
    this.nodeList = [];
    this.attackers = new Set();
}

PlayerController.prototype = Object.create(Controller.prototype);
PlayerController.prototype.constructor = PlayerController;

PlayerController.prototype.updateCursorSpriteSelected = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(!this.selectedEntity) {
        return;
    }

    sprite.show();

    if(!this.hoveredEntity) {
        const { x, y } = gameContext.getMouseTile();
        const targetIndex = PathfinderSystem.getTargetIndex(this.nodeList, x ,y);

        if(targetIndex === -1) {
            sprite.hide();
        } else {
            spriteManager.updateSprite(spriteComponent.spriteID, this.moveSprite);
        }

        return;
    }

    this.updateCursorSpriteDefault(gameContext);
}

PlayerController.prototype.updateCursorSpriteIdle = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(!this.hoveredEntity) {
        sprite.hide();
        return;
    } 

    this.updateCursorSpriteDefault(gameContext);
    sprite.show();
}

PlayerController.prototype.updateCursorSpriteDefault = function(gameContext) {
    const { spriteManager, entityManager } = gameContext;
    const spriteComponent = this.getComponent(SpriteComponent);
    const hoverEntity = entityManager.getEntity(this.hoveredEntity);
    const spriteKey = `${hoverEntity.config.dimX}-${hoverEntity.config.dimY}`;

    if(this.attackers.size > 0) {
        const spriteType = this.attackSprites[spriteKey];

        if(spriteType) {
            spriteManager.updateSprite(spriteComponent.spriteID, spriteType);
        }
    } else {
        const spriteType = this.selectSprites[spriteKey];

        if(spriteType) {
            spriteManager.updateSprite(spriteComponent.spriteID, spriteType);
        }
    }
}

PlayerController.prototype.updateCursorPositionAirstrike = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteComponent = this.getComponent(SpriteComponent);
    const { x, y } = gameContext.getMouseTile();
    const centerPosition = tileToPosition_center(x, y);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    sprite.setPosition(centerPosition.x, centerPosition.y);
}

PlayerController.prototype.updateCursorPositionDefault = function(gameContext) {
    const { spriteManager, entityManager } = gameContext;
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(!this.hoveredEntity) {
        const { x, y } = gameContext.getMouseTile();
        const centerPosition = tileToPosition_center(x, y);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    } else {
        const hoverEntity = entityManager.getEntity(this.hoveredEntity);
        const positionComponent = hoverEntity.getComponent(PositionComponent);
        const centerPosition = tileToPosition_center(positionComponent.tileX, positionComponent.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    }
}

PlayerController.prototype.updateCursorHoverData = function(gameContext) {
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = gameContext.getTileEntity(x, y);

    if(!mouseEntity) {
        this.hoveredEntity = null;
    } else {
        const mouseEntityID = mouseEntity.getID();
        this.hoveredEntity = mouseEntityID;
    }
}

PlayerController.prototype.addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const camera = gameContext.getCameraAtMouse();

        if(camera) {
            camera.dragViewport(deltaX, deltaY);
        }
    });
}

PlayerController.prototype.addClickEvent = function(gameContext) {
    const { client, uiManager } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = uiManager.getCollidedElements(cursor.position.x, cursor.position.y, cursor.radius);

        if(clickedElements.length === 0) {
            this.states.onEventEnter(gameContext);
        }
    });
}

PlayerController.prototype.initialize = function(gameContext, payload) {
    const { spriteManager } = gameContext;
    const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER_TOP);
    const { x, y } = tileToPosition_center(0, 0);

    controllerSprite.setPosition(x, y);

    const spriteComponent = componentSetup.setupSpriteComponent(controllerSprite);
    const teamComponent = componentSetup.setupTeamComponent(payload);

    this.addComponent(teamComponent);
    this.addComponent(spriteComponent);

    this.addClickEvent(gameContext);
    this.addDragEvent(gameContext);

    this.states.addState(CONTROLLER_STATES.IDLE, new ControllerIdleState());
    this.states.addState(CONTROLLER_STATES.BUILD, new ControllerBuildState());
    this.states.addState(CONTROLLER_STATES.SELECTED, new ControllerSelectedState());

    this.states.setNextState(CONTROLLER_STATES.IDLE);
}

PlayerController.prototype.update = function(gameContext) {
    this.updateCursorHoverData(gameContext);
    this.states.update(gameContext);
}

PlayerController.prototype.selectEntity = function(entityID) {
    this.selectedEntity = entityID;
}

PlayerController.prototype.deselectEntity = function() {
    this.selectedEntity = null;
}

PlayerController.prototype.getSelectedEntity = function() {
    return this.selectedEntity;
}

PlayerController.prototype.setNodeList = function(nodeList) {
    this.nodeList = nodeList;
}

PlayerController.prototype.getNodeList = function() {
    return this.nodeList;
}

PlayerController.prototype.clearNodeList = function() {
    this.nodeList = [];
}

PlayerController.prototype.setAttackers = function(attackers) {
    this.attackers = attackers;
}

PlayerController.prototype.clearAttackers = function() {
    this.attackers.clear();
}

PlayerController.prototype.getAttackers = function() {
    return this.attackers;
}