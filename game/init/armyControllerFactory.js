import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { CAMERA_TYPES } from "../enums.js";
import { PlayerController } from "./controller/player.js";

export const ArmyControllerFactory = function() {
    Factory.call(this, "ARMY_CONTROLLER_FACOTRY");
}

ArmyControllerFactory.TYPE = {
    PLAYER: "Player"
};

ArmyControllerFactory.prototype = Object.create(Factory.prototype);
ArmyControllerFactory.prototype.constructor = ArmyControllerFactory;

ArmyControllerFactory.prototype.addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const context = gameContext.getContextAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

ArmyControllerFactory.prototype.addClickEvent = function(gameContext, controller) {
    const { client, uiManager } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_CLICK, this.id, () => {
        const clickedElements = uiManager.getCollidedElements(cursor.positionX, cursor.positionY, cursor.radius);

        if(clickedElements.length === 0) {
            controller.onClick(gameContext);
        }
    });
}

ArmyControllerFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, renderer } = gameContext;
    const { type, id, team } = config;
    const controllerType = this.getType(type);

    switch(type) {
        case ArmyControllerFactory.TYPE.PLAYER: {
            const controller = new PlayerController(id);
            const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
            const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.UI);
            const { x, y } = camera.transformTileToPositionCenter(0, 0);
            const spriteID = controllerSprite.getID();
            
            controllerSprite.setPosition(x, y);
        
            controller.spriteID = spriteID;
            controller.teamID = team ?? null;
            controller.setConfig(controllerType);
            controller.setState(PlayerController.STATE.IDLE);
            
            this.addClickEvent(gameContext, controller);
            this.addDragEvent(gameContext);

            return controller;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}