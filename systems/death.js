import { PositionComponent } from "../components/position.js";
import { SizeComponent } from "../components/size.js";
import { SpriteComponent } from "../components/sprite.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";

export const DeathSystem = function() {}

DeathSystem.playDeathAnimation = function(gameContext, entity) {
    const { spriteManager, client } = gameContext;
    const { soundPlayer } = client;
    const positionComponent = entity.getComponent(PositionComponent);
    const deathAnimation = spriteManager.createSprite(entity.config.sprites.death, SpriteManager.LAYER_MIDDLE);

    deathAnimation.setLooping(false);
    deathAnimation.setPosition(positionComponent.positionX, positionComponent.positionY);

    soundPlayer.playRandom(entity.config.sounds.death);
}

DeathSystem.destroyEntity = function(gameContext, entityID) {
    const { entityManager, mapLoader, spriteManager } = gameContext;
    const entity = entityManager.getEntity(entityID);
    const activeMap = mapLoader.getActiveMap();

    if(!entity || !activeMap) {
        return false;
    }
    
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