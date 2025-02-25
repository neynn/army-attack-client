import { EntityManager } from "../../../source/entity/entityManager.js";
import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { Autotiler } from "../../../source/tile/autotiler.js";
import { ArmyCamera } from "../../armyCamera.js";
import { CAMERA_TYPES } from "../../enums.js";
import { ArmyEntity } from "../armyEntity.js";
import { ArmyMap } from "../armyMap.js";

export const RangeShow = function() {
    this.isActive = true;
    this.entityID = EntityManager.INVALID_ID;
}

RangeShow.prototype.toggle = function(gameContext, entity) {
    this.isActive = !this.isActive;

    if(this.isActive) {
        if(entity) {
            this.show(gameContext, entity);
        }
    } else {
        this.reset(gameContext);
    }
}

RangeShow.prototype.isEnabled = function() {
    return this.isActive;
}

RangeShow.prototype.show = function(gameContext, entity) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const { renderer, tileManager, spriteManager } = gameContext;
    const { meta } = tileManager;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const entityID = entity.getID();
    const autotiler = meta.getAutotilerByID(ArmyMap.AUTOTILER.RANGE);
    const { range } = attackComponent;
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { spriteID } = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    spriteManager.swapLayer(SpriteManager.LAYER.TOP, spriteID);

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range + entity.config.dimX - 1;
    const endY = tileY + range + entity.config.dimY - 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const tileID = autotiler.run(j, i, (x, y) => {
                if(x >= startX && x <= endX && y >= startY && y <= endY) {
                    return Autotiler.RESPONSE.VALID;
                } 

                return Autotiler.RESPONSE.INVALID;
            });

            camera.addToOverlay(ArmyCamera.OVERLAY_TYPE.RANGE, tileID, j, i);
        }
    }

    this.entityID = entityID;
}

RangeShow.prototype.reset = function(gameContext) {
    const { renderer, spriteManager, world } = gameContext;
    const { entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const entity = entityManager.getEntity(this.entityID);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);

    if(entity) {
        const { spriteID } = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        
        spriteManager.swapLayer(SpriteManager.LAYER.MIDDLE, spriteID);
    }

    this.entityID = EntityManager.INVALID_ID;
}