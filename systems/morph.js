import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { ENTITY_EVENTS } from "../enums.js";

export const MorphSystem = function() {}

MorphSystem.updateSprite = function(entity, spriteTypeID) {
    if(!entity.config.sprites[spriteTypeID]) {
        return false;
    }

    const spriteComponent = entity.getComponent(SpriteComponent);
    const spriteType = entity.config.sprites[spriteTypeID];

    if(spriteType === spriteComponent.spriteType) {
        return false;
    }

    spriteComponent.spriteType = spriteType;

    entity.events.emit(ENTITY_EVENTS.SPRITE_UPDATE);
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
        if(!entity.config.sprites[northTypeID]) {
            return false;
        }

        spriteComponent.spriteType = entity.config.sprites[northTypeID];
    } else {
        if(!entity.config.sprites[southTypeID]) {
            return false;
        }

        spriteComponent.spriteType = entity.config.sprites[southTypeID];
    }

    entity.events.emit(ENTITY_EVENTS.SPRITE_UPDATE);
}