import { Factory } from "../../source/factory/factory.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";

import { CAMERA_TYPES } from "../enums.js";
import { ControllerBuildState } from "../states/controller/build.js";
import { ControllerIdleState } from "../states/controller/idle.js";
import { ControllerSelectedState } from "../states/controller/selected.js";
import { PlayerController } from "./controller/player.js";

export const ArmyControllerFactory = function() {
    Factory.call(this, "ARMY_CONTROLLER_FACOTRY");
}

ArmyControllerFactory.TYPE = {
    "PLAYER": "Player"
};

ArmyControllerFactory.prototype = Object.create(Factory.prototype);
ArmyControllerFactory.prototype.constructor = ArmyControllerFactory;

ArmyControllerFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, renderer } = gameContext;
    const { type, id, team } = config;

    const controllerType = this.getType(type);

    if(!controllerType) {
        return null;
    }

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
        
            controller.states.addState(PlayerController.STATE.IDLE, new ControllerIdleState());
            controller.states.addState(PlayerController.STATE.BUILD, new ControllerBuildState());
            controller.states.addState(PlayerController.STATE.SELECTED, new ControllerSelectedState());
            controller.states.setNextState(PlayerController.STATE.IDLE);

            controller.setConfig(controllerType);

            return controller;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}