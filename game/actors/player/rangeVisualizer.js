import { SpriteManager } from "../../../source/sprite/spriteManager.js";
import { Autotiler } from "../../../source/tile/autotiler.js";
import { ArmyCamera } from "../../armyCamera.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { ArmyMap } from "../../init/armyMap.js";

export const RangeVisualizer = function(camera) {
    this.camera = camera;
    this.state = RangeVisualizer.STATE.ACTIVE;
    this.isEnabled = true;
    this.lastTarget = null;
}

RangeVisualizer.STATE = {
    NONE: 0,
    INACTIVE: 1,
    ACTIVE: 2
};

RangeVisualizer.prototype.toggle = function(gameContext) {
    if(!this.isEnabled) {
        return this.state;
    }

    switch(this.state) {
        case RangeVisualizer.STATE.INACTIVE: {
            this.state = RangeVisualizer.STATE.ACTIVE;
            break;
        }
        case RangeVisualizer.STATE.ACTIVE: {
            this.state = RangeVisualizer.STATE.INACTIVE;
            
            if(this.lastTarget !== null) {
                this.hide(gameContext);
                this.lastTarget = null;
            }
            break;
        }
    }

    return this.state;
}

RangeVisualizer.prototype.show = function(gameContext, entity) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent) {
        return;
    }

    const { tileManager } = gameContext;
    const autotiler = tileManager.getAutotilerByID(ArmyMap.AUTOTILER.RANGE);
    const { range } = attackComponent;
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    spriteComponent.swapLayer(gameContext, SpriteManager.LAYER.TOP);

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

            this.camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.RANGE, tileID, j, i);
        }
    }
}

RangeVisualizer.prototype.hide = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(this.lastTarget);

    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);

    if(entity) {
        const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        
        spriteComponent.swapLayer(gameContext, SpriteManager.LAYER.MIDDLE);
    }
}

RangeVisualizer.prototype.update = function(gameContext, player) {
    if(!this.isEnabled || this.state !== RangeVisualizer.STATE.ACTIVE) {
        return;
    }

    const entity = player.hover.getEntity(gameContext);

    if(entity !== null) {
        const entityID = entity.getID();

        if(entityID !== this.lastTarget) {
            if(this.lastTarget !== null) {
                this.hide(gameContext);
            }

            this.show(gameContext, entity);
            this.lastTarget = entityID;
        }
    } else {
        this.hide(gameContext);
        this.lastTarget = null;
    }
}

RangeVisualizer.prototype.enable = function() {
    if(!this.isEnabled) {
        this.isEnabled = true;
    }
}

RangeVisualizer.prototype.disable = function(gameContext) {
    if(this.isEnabled) {
        this.isEnabled = false;

        if(this.lastTarget !== null)  {
            this.hide(gameContext);
            this.lastTarget = null;
        }
    }
}
