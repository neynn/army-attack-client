import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";

export const SpriteSystem = function() {}

SpriteSystem.alignSpritePosition = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);
    const { spriteID } = spriteComponent;
    const sprite = spriteManager.getSprite(spriteID);
    const { positionX, positionY } = positionComponent;

    sprite.setPosition(positionX, positionY);
}

SpriteSystem.changeSprite = function(gameContext, entity, sheetID, animationID) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const { spriteID, isFlipped } = spriteComponent;
    const sprite = spriteManager.getSprite(spriteID);
            
    sprite.flip(isFlipped);
    
    if(sheetID !== undefined) {
        spriteManager.updateSprite(spriteID, sheetID, animationID);
    }
}