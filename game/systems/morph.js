import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { SpriteSystem } from "./sprite.js";

export const MorphSystem = function() {}

MorphSystem.morphHorizontal = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(SpriteComponent);
    const directionComponent = entity.getComponent(DirectionComponent);

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        spriteComponent.isFlipped = true;
    } else {
        spriteComponent.isFlipped = false;
    }

    SpriteSystem.changeSprite(gameContext, entity);
}

MorphSystem.morphDirectional = function(gameContext, entity, southTypeID, northTypeID) {
    const spriteComponent = entity.getComponent(SpriteComponent);
    const directionComponent = entity.getComponent(DirectionComponent);

    if(northTypeID === undefined && southTypeID === undefined) {
        return;
    }

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        spriteComponent.isFlipped = true;
    } else {
        spriteComponent.isFlipped = false;
    }

    if(directionComponent.directionY === DirectionComponent.DIRECTION_NORTH) {
        MorphSystem.updateSprite(gameContext, entity, northTypeID);
    } else {
        MorphSystem.updateSprite(gameContext, entity, southTypeID);
    }
}

MorphSystem.updateSprite = function(gameContext, entity, spriteKey) {
    const spriteID = entity.config.sprites[spriteKey];

    if(!spriteID) {
        return;
    }

    SpriteSystem.changeSprite(gameContext, entity, spriteID);
}

MorphSystem.toAim = function(gameContext, entity) {
    MorphSystem.morphDirectional(gameContext, entity, "aim", "aim_ne");
}

MorphSystem.toIdle = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "idle");
}

MorphSystem.toFire = function(gameContext, entity) {
    MorphSystem.morphDirectional(gameContext, entity, "fire", "fire_ne");
}

MorphSystem.toMove = function(gameContext, entity) {
    MorphSystem.morphDirectional(gameContext, entity, "move", "move_ne");
}

MorphSystem.toHit = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "hit");
}

MorphSystem.toDown = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "downed");
}