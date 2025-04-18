import { SpriteManager } from "../../../../source/sprite/spriteManager.js";
import { Autotiler } from "../../../../source/tile/autotiler.js";
import { ArmyCamera } from "../../../armyCamera.js";
import { ArmyEntity } from "../../armyEntity.js";
import { ArmyMap } from "../../armyMap.js";

export const AttackRangeOverlay = function() {
    this.state = AttackRangeOverlay.STATE.ACTIVE;
    this.isLocked = false;
    this.lastTarget = null;
}

AttackRangeOverlay.STATE = {
    NONE: 0,
    INACTIVE: 1,
    ACTIVE: 2
};

AttackRangeOverlay.prototype.toggle = function(gameContext, camera) {
    if(this.isLocked) {
        return this.state;
    }

    switch(this.state) {
        case AttackRangeOverlay.STATE.INACTIVE: {
            this.state = AttackRangeOverlay.STATE.ACTIVE;
            break;
        }
        case AttackRangeOverlay.STATE.ACTIVE: {
            this.state = AttackRangeOverlay.STATE.INACTIVE;
            
            if(this.lastTarget !== null) {
                this.hide(gameContext, camera);
                this.lastTarget = null;
            }
            break;
        }
    }

    return this.state;
}

AttackRangeOverlay.prototype.show = function(gameContext, entity, camera) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const { tileManager, spriteManager } = gameContext;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.RANGE);
    const { range } = attackComponent;
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { spriteID } = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    spriteManager.swapLayer(spriteID, SpriteManager.LAYER.TOP);

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

            camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.RANGE, tileID, j, i);
        }
    }
}

AttackRangeOverlay.prototype.hide = function(gameContext, camera) {
    const { spriteManager, world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.lastTarget);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);

    if(entity) {
        const { spriteID } = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        
        spriteManager.swapLayer(spriteID, SpriteManager.LAYER.MIDDLE);
    }
}

AttackRangeOverlay.prototype.update = function(gameContext, entity, camera) {
    if(this.state !== AttackRangeOverlay.STATE.ACTIVE || this.isLocked) {
        return;
    }

    if(entity !== null) {
        const entityID = entity.getID();

        if(entityID !== this.lastTarget) {
            if(this.lastTarget !== null) {
                this.hide(gameContext, camera);
            }

            this.show(gameContext, entity, camera);
            this.lastTarget = entityID;
        }
    } else {
        this.hide(gameContext, camera);
        this.lastTarget = null;
    }
}

AttackRangeOverlay.prototype.unlock = function() {
    this.isLocked = false;
}

AttackRangeOverlay.prototype.lock = function(gameContext, camera) {
    this.isLocked = true;

    if(this.lastTarget !== null)  {
        this.hide(gameContext, camera);
        this.lastTarget = null;
    }
}
