import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";

export const SpriteSystem = function() {}

SpriteSystem.FLIP_STATE_UNFLIPPED = 0;
SpriteSystem.FLIP_STATE_FLIPPED = 1;

SpriteSystem.alignSpritePosition = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);
    const { spriteID } = spriteComponent;
    const sprite = spriteManager.getSprite(spriteID);
    const { positionX, positionY } = positionComponent;

    sprite.setPosition(positionX, positionY);
}

SpriteSystem.flipSprite = function(gameContext, entity, flipState) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const { spriteID, isFlippable } = spriteComponent;

    if(!isFlippable) {
        return;
    }

    const sprite = spriteManager.getSprite(spriteID);

    switch(flipState) {
        case SpriteSystem.FLIP_STATE_UNFLIPPED: {
            sprite.unflip();
            break;
        }
        case SpriteSystem.FLIP_STATE_FLIPPED: {
            sprite.flip();
            break;
        }
        default: {
            console.warn(`Unknown flip state ${flipState}`);
            break;
        }
    }
}

SpriteSystem.changeSprite = function(gameContext, entity, sheetID, animationID) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const { spriteID } = spriteComponent;
    
    if(sheetID !== undefined) {
        spriteManager.updateSprite(spriteID, sheetID, animationID);
    }
}