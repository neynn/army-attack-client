import { Cursor } from "../../../source/client/cursor.js";
import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { EntityController } from "../../../source/controller/entityController.js";

import { CAMERA_TYPES, CONTROLLER_STATES } from "../../enums.js";
import { ControllerBuildState } from "../../states/controller/build.js";
import { ControllerSelectedState } from "../../states/controller/selected.js";
import { ControllerIdleState } from "../../states/controller/idle.js";
import { PositionComponent } from "../../components/position.js";
import { SpriteComponent } from "../../components/sprite.js";
import { ResourceComponent } from "../../components/resource.js";
import { TeamComponent } from "../../components/team.js";

export const PlayerController = function(id) {
    EntityController.call(this, id);
    this.hoveredEntity = null;
    this.selectedEntity = null;
    this.nodeList = new Map();
    this.attackers = new Set();
}

PlayerController.prototype = Object.create(EntityController.prototype);
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
        const nodeKey = `${x}-${y}`;

        if(this.nodeList.has(nodeKey)) {
            spriteManager.updateSprite(spriteComponent.spriteID, this.config.sprites.move["1-1"]);
        } else {
            sprite.hide();
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
    const { spriteManager, world } = gameContext;
    const { entityManager } = world;
    const spriteComponent = this.getComponent(SpriteComponent);
    const hoverEntity = entityManager.getEntity(this.hoveredEntity);
    const spriteKey = `${hoverEntity.config.dimX}-${hoverEntity.config.dimY}`;

    if(this.attackers.size > 0) {
        const spriteType = this.config.sprites.attack[spriteKey];

        if(spriteType) {
            spriteManager.updateSprite(spriteComponent.spriteID, spriteType);
        }
    } else {
        const spriteType = this.config.sprites.select[spriteKey];

        if(spriteType) {
            spriteManager.updateSprite(spriteComponent.spriteID, spriteType);
        }
    }
}

PlayerController.prototype.updateCursorPositionAirstrike = function(gameContext) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const spriteComponent = this.getComponent(SpriteComponent);
    const { x, y } = gameContext.getMouseTile();
    const centerPosition = camera.transformTileToPositionCenter(x, y);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    sprite.setPosition(centerPosition.x, centerPosition.y);
}

PlayerController.prototype.updateCursorPositionDefault = function(gameContext) {
    const { spriteManager, renderer, world } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(!this.hoveredEntity) {
        const { x, y } = gameContext.getMouseTile();
        const centerPosition = camera.transformTileToPositionCenter(x, y);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    } else {
        const hoverEntity = entityManager.getEntity(this.hoveredEntity);
        const positionComponent = hoverEntity.getComponent(PositionComponent);
        const centerPosition = camera.transformTileToPositionCenter(positionComponent.tileX, positionComponent.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    }
}

PlayerController.prototype.updateCursorHoverData = function(gameContext) {
    const { world } = gameContext;
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

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

PlayerController.prototype.onCreate = function(gameContext, payload) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER_TOP);
    const { x, y } = camera.transformTileToPositionCenter(0, 0);

    controllerSprite.setPosition(x, y);

    const spriteComponent = SpriteComponent.create(controllerSprite);
    const teamComponent = TeamComponent.create(payload);
    const resourceComponent = ResourceComponent.create();

    this.addComponent(teamComponent);
    this.addComponent(spriteComponent);
    this.addComponent(resourceComponent);

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
    this.nodeList.clear();
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