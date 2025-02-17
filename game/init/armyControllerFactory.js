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

ArmyControllerFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, renderer } = gameContext;
    const { type, id, team } = config;
    const controllerType = this.getType(type);

    switch(type) {
        case ArmyControllerFactory.TYPE.PLAYER: {
            const controller = new PlayerController(id);
            const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
            const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.TOP);
            const { x, y } = camera.transformTileToPositionCenter(0, 0);
            const spriteID = controllerSprite.getID();
            
            controllerSprite.setPosition(x, y);
        
            controller.spriteID = spriteID;
            controller.teamID = team ?? null;
            controller.addClickEvent(gameContext);
            controller.addDragEvent(gameContext);
            controller.setConfig(controllerType);
            controller.setState(PlayerController.STATE.IDLE);
            
            return controller;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}