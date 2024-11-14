import { CONTROLLER_STATES } from "../enums.js";
import { tileToPosition_center } from "../source/camera/helpers.js";
import { Cursor } from "../source/client/cursor.js";
import { Controller } from "../source/controller/controller.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";
import { ControllerBuildState } from "../states/controller/build.js";
import { ControllerSelectedState } from "../states/controller/selected.js";
import { ControllerIdleState } from "../states/controller/idle.js";
import { componentSetup } from "./componentSetup.js";

export const PlayerController = function(id) {
    Controller.call(this, id);
}

PlayerController.prototype = Object.create(Controller.prototype);
PlayerController.prototype.constructor = PlayerController;

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

PlayerController.prototype.addMoveEvent = function(gameContext, sprite) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.MOVE, this.id, (deltaX, deltaY) => {
        const viewportTile = gameContext.getMouseTile();
        const centerPosition = tileToPosition_center(viewportTile.x, viewportTile.y);

        sprite.setPosition(centerPosition.x, centerPosition.y);
    });
}

PlayerController.prototype.initialize = function(gameContext, payload) {
    const { spriteManager } = gameContext;
    const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER_TOP);
    const { x, y } = tileToPosition_center(0, 0);

    controllerSprite.setPosition(x, y);

    const controllerComponent = componentSetup.setupControllerComponent();
    const spriteComponent = componentSetup.setupSpriteComponent(controllerSprite);
    const teamComponent = componentSetup.setupTeamComponent(payload);

    this.addComponent(controllerComponent);
    this.addComponent(teamComponent);
    this.addComponent(spriteComponent);

    this.addClickEvent(gameContext);
    this.addDragEvent(gameContext);
    this.addMoveEvent(gameContext, controllerSprite);

    this.states.addState(CONTROLLER_STATES.IDLE, new ControllerIdleState());
    this.states.addState(CONTROLLER_STATES.BUILD, new ControllerBuildState());
    this.states.addState(CONTROLLER_STATES.SELECTED, new ControllerSelectedState());

    this.states.setNextState(CONTROLLER_STATES.IDLE);
}