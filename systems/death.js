import { PositionComponent } from "../components/position.js";
import { SizeComponent } from "../components/size.js";
import { SpriteComponent } from "../components/sprite.js";

export const DeathSystem = function() {}

DeathSystem.destroyEntity = function(gameContext, entityID) {
    const { entityManager, mapLoader, spriteManager } = gameContext;
    const entity = entityManager.getEntity(entityID);
    const activeMap = mapLoader.getActiveMap();

    if(!entity || !activeMap) {
        return false;
    }

    const { config } = entity;
    const { sprites } = config;

    for(const spriteID in sprites) {
        const spriteType = sprites[spriteID];
        spriteManager.removeSpriteReference(spriteType)
    }

    //TODO: Children don't lose their reference!!! Real nice, how about details?
    
    const positionComponent = entity.getComponent(PositionComponent);
    const sizeComponent = entity.getComponent(SizeComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    const { tileX, tileY } = positionComponent;
    const { sizeX, sizeY } = sizeComponent;

    activeMap.removePointers(tileX, tileY, sizeX, sizeY, entityID);
    entityManager.removeEntity(entityID);
    spriteManager.removeSprite(spriteComponent.spriteID);

    return true;
}