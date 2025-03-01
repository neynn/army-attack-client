import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { Autotiler } from "../../source/tile/autotiler.js";
import { ArmyCamera } from "../armyCamera.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";

export const RangeShow = function() {
    this.isActive = true;
    this.lastTarget = null;
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

RangeShow.prototype.setLastTarget = function(entityID) {
    this.lastTarget = entityID;
}

RangeShow.prototype.show = function(gameContext, entity, camera) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const { tileManager, spriteManager } = gameContext;
    const { meta } = tileManager;
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

    this.setLastTarget(entityID);
}

RangeShow.prototype.reset = function(gameContext, camera) {
    if(this.lastTarget === null) {
        return;
    }
    
    const { spriteManager, world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.lastTarget);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);

    if(entity) {
        const { spriteID } = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        
        spriteManager.swapLayer(SpriteManager.LAYER.MIDDLE, spriteID);
    }

    this.setLastTarget(null);
}