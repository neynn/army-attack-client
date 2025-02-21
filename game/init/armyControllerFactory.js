import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { CAMERA_TYPES } from "../enums.js";
import { PlayerController } from "./player/player.js";

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

ArmyControllerFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, renderer, client } = gameContext;
    const { router } = client;
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
            
            this.addDragEvent(gameContext);

            router.load(gameContext, controllerType.binds);
            router.on(PlayerController.COMMAND.TOGGLE_RANGE, () => controller.toggleRangeShow(gameContext));
            router.on(PlayerController.COMMAND.CLICK, () => controller.onClick(gameContext));

            return controller;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}