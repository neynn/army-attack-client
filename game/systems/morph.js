import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { ENTITY_EVENTS } from "../enums.js";

export const MorphSystem = function() {}

MorphSystem.updateSprite = function(entity, spriteKey) {
    const spriteID = entity.config.sprites[spriteKey];

    if(!spriteID) {
        return false;
    }

    entity.events.emit(ENTITY_EVENTS.SPRITE_UPDATE, spriteID);
}

MorphSystem.morphHorizontal = function(entity) {
    const spriteComponent = entity.getComponent(SpriteComponent);
    const directionComponent = entity.getComponent(DirectionComponent);

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        spriteComponent.isFlipped = true;
    } else {
        spriteComponent.isFlipped = false;
    }

    entity.events.emit(ENTITY_EVENTS.SPRITE_UPDATE);
}

MorphSystem.morphDirectional = function(entity, southTypeID, northTypeID) {
    const spriteComponent = entity.getComponent(SpriteComponent);
    const directionComponent = entity.getComponent(DirectionComponent);

    if(northTypeID === undefined && southTypeID === undefined) {
        return false;
    }

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        spriteComponent.isFlipped = true;
    } else {
        spriteComponent.isFlipped = false;
    }

    if(directionComponent.directionY === DirectionComponent.DIRECTION_NORTH) {
        MorphSystem.updateSprite(entity, northTypeID);
    } else {
        MorphSystem.updateSprite(entity, southTypeID);
    }

    return true;
}

MorphSystem.toAim = function(entity) {
    MorphSystem.morphDirectional(entity, "aim", "aim_ne");
}

MorphSystem.toIdle = function(entity) {
    MorphSystem.updateSprite(entity, "idle");
}

MorphSystem.toFire = function(entity) {
    MorphSystem.morphDirectional(entity, "fire", "fire_ne");
}

MorphSystem.toMove = function(entity) {
    MorphSystem.morphDirectional(entity, "move", "move_ne");
}

MorphSystem.toHit = function(entity) {
    MorphSystem.updateSprite(entity, "hit");
}

MorphSystem.toDown = function(entity) {
    MorphSystem.updateSprite(entity, "downed");
}