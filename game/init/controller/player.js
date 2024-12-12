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
    this.nodeList = new Map();
    this.attackers = new Set();
    this.tileX = -1;
    this.tileY = -1;
}

PlayerController.prototype = Object.create(EntityController.prototype);
PlayerController.prototype.constructor = PlayerController;

PlayerController.prototype.getHoveredEntity = function() {
    return this.hoveredEntity;
}

PlayerController.prototype.updateHoverSprite = function(gameContext) {
    const { spriteManager, world } = gameContext;
    const { entityManager } = world;
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(!this.hoveredEntity) {
        sprite.hide();
        return;
    }

    const hoverEntity = entityManager.getEntity(this.hoveredEntity);
    const spriteKey = `${hoverEntity.config.dimX}-${hoverEntity.config.dimY}`;
    const spriteTypeID = this.attackers.size > 0 ? "attack" : "select"; 
    const spriteType = this.config.sprites[spriteTypeID][spriteKey];

    if(spriteType) {
        spriteManager.updateSprite(spriteComponent.spriteID, spriteType);
        sprite.show();
    }
}

PlayerController.prototype.regulateSpritePosition = function(gameContext, entityID = null) {
    const { spriteManager, renderer, world } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const spriteComponent = this.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);

    if(entityID !== null) {
        const entity = entityManager.getEntity(entityID);
        const positionComponent = entity.getComponent(PositionComponent);
        const centerPosition = camera.transformTileToPositionCenter(positionComponent.tileX, positionComponent.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    } else {
        const centerPosition = camera.transformTileToPositionCenter(this.tileX, this.tileY);

        sprite.setPosition(centerPosition.x, centerPosition.y); 
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
            this.states.eventEnter(gameContext);
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
    const { world } = gameContext;
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);

    if(!mouseEntity) {
        this.hoveredEntity = null;
    } else {
        const mouseEntityID = mouseEntity.getID();
        this.hoveredEntity = mouseEntityID;
    }

    this.tileX = x;
    this.tileY = y;
    this.states.update(gameContext);
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