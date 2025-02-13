import { DirectionComponent } from "../components/direction.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpriteSystem } from "./sprite.js";

export const MorphSystem = function() {}

MorphSystem.morphHorizontal = function(gameContext, entity) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        SpriteSystem.flipSprite(gameContext, entity, SpriteSystem.FLIP_STATE_FLIPPED);
    } else {
        SpriteSystem.flipSprite(gameContext, entity, SpriteSystem.FLIP_STATE_UNFLIPPED);
    }
}

MorphSystem.morphDirectional = function(gameContext, entity, southTypeID, northTypeID) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(northTypeID === undefined && southTypeID === undefined) {
        return;
    }

    if(directionComponent.directionX === DirectionComponent.DIRECTION_WEST) {
        SpriteSystem.flipSprite(gameContext, entity, SpriteSystem.FLIP_STATE_FLIPPED);
    } else {
        SpriteSystem.flipSprite(gameContext, entity, SpriteSystem.FLIP_STATE_UNFLIPPED);
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
    MorphSystem.morphDirectional(gameContext, entity, "aim", entity.config.sprites["aim_ne"] ? "aim_ne" : "aim");
}

MorphSystem.toFire = function(gameContext, entity) {
    MorphSystem.morphDirectional(gameContext, entity, "fire", entity.config.sprites["fire_ne"] ? "fire_ne" : "fire");
}

MorphSystem.toMove = function(gameContext, entity) {
    MorphSystem.morphDirectional(gameContext, entity, "move", entity.config.sprites["move_ne"] ? "move_ne" : "move");
}

MorphSystem.toIdle = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "idle");
}

MorphSystem.toHit = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "hit");
}

MorphSystem.toDown = function(gameContext, entity) {
    MorphSystem.updateSprite(gameContext, entity, "downed");
}