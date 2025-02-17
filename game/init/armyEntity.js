import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";
import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";

export const ArmyEntity = function(DEBUG_NAME) {
    Entity.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.events.listen(ArmyEntity.EVENT.HEALTH_UPDATE);
    this.events.listen(ArmyEntity.EVENT.DAMAGE_UPDATE);
}

ArmyEntity.EVENT = {
    HEALTH_UPDATE: 0,
    DAMAGE_UPDATE: 1
};

ArmyEntity.COMPONENT = {
    HEALTH: "Health",
    CONSTRUCTION: "Construction",
    REVIVEABLE: "Reviveable",
    ATTACK: "Attack",
    MOVE: "Move",
    UNIT_SIZE: "UnitSize",
    ARMOR: "Armor",
    AVIAN: "Avian",
    BULLDOZE: "Bulldoze",
    COUNTER: "Counter",
    RESOURCE: "Resource",
    POSITION: "Position",
    SPRITE: "Sprite",
    DIRECTION: "Direction",
    TEAM: "Team",
    PRODUCTION: "Production"
};

ArmyEntity.SPRITE_TYPE = {
    IDLE: "idle",
    AIM: "aim",
    AIM_UP: "aim_ne",
    MOVE: "move",
    MOVE_UP: "move_ne",
    FIRE: "fire",
    FIRE_UP: "fire_ne",
    HIT: "hit",
    DOWN: "downed",
    DEATH: "death",
    WEAPON: "weapon"
};

ArmyEntity.SOUND_TYPE = {
    FIRE: "fire",
    DEATH: "death",
    SELECT: "select",
    MOVE: "move",
    BUILD: "build"
};

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;

ArmyEntity.prototype.updateSpriteHorizontal = function(gameContext) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const directionComponent = this.getComponent(ArmyEntity.COMPONENT.DIRECTION);
    const { directionX } = directionComponent;

    if(directionX === DirectionComponent.DIRECTION.WEST) {
        spriteComponent.flip(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.flip(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
    }
}

ArmyEntity.prototype.updateSpriteDirectonal = function(gameContext, southTypeID, northTypeID) {
    if(northTypeID === undefined && southTypeID === undefined) {
        return;
    }

    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const directionComponent = this.getComponent(ArmyEntity.COMPONENT.DIRECTION);
    const { directionX, directionY } = directionComponent;

    if(directionX === DirectionComponent.DIRECTION.WEST) {
        spriteComponent.flip(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.flip(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
    }

    if(directionY === DirectionComponent.DIRECTION.SOUTH) {
        this.updateSprite(gameContext, southTypeID);
    } else {
        if(!this.config.sprites[northTypeID]) {
            this.updateSprite(gameContext, southTypeID);
        } else {
            this.updateSprite(gameContext, northTypeID);
        }
    }
}

ArmyEntity.prototype.updateSprite = function(gameContext, spriteType) {
    const spriteID = this.config.sprites[spriteType];

    if(spriteID) {
        const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

        spriteComponent.change(gameContext, spriteID);
    }
}

ArmyEntity.prototype.reduceHealth = function(damage) {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);
    
    healthComponent.reduceHealth(damage);

    this.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

ArmyEntity.prototype.getSurroundingEntities = function(gameContext, range = 0) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return [];
    }

    const positionComponent = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + this.config.dimX + range;
    const endY = positionComponent.tileY + this.config.dimY + range;
    const entities = worldMap.getUniqueEntitiesInRange(startX, startY, endX, endY);

    return entities;
}

ArmyEntity.prototype.playSound = function(gameContext, soundType) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const soundID = this.config.sounds[soundType];

    if(soundID) {
        soundPlayer.playRandom(soundID);
    }
}