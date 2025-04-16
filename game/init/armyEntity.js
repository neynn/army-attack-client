import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";
import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { AllianceSystem } from "../systems/alliance.js";

export const ArmyEntity = function(DEBUG_NAME) {
    Entity.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.events.listen(ArmyEntity.EVENT.HEALTH_UPDATE);
    this.events.listen(ArmyEntity.EVENT.DAMAGE_UPDATE);
}

ArmyEntity.EVENT = {
    HEALTH_UPDATE: "HEALTH_UPDATE",
    DAMAGE_UPDATE: "DAMAGE_UPDATE"
};

ArmyEntity.TYPE = {
    UNIT: "Unit",
    DEFENSE: "Defense",
    CONSTRUCTION: "Construction",
    BUILDING: "Building"
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

ArmyEntity.prototype.getHealth = function() {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    return healthComponent.health;
}

ArmyEntity.prototype.placeOnMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const { tileX, tileY } = this.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.addEntity(tileX, tileY, this.config.dimX, this.config.dimY, this.id);
    }
}

ArmyEntity.prototype.removeFromMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const { tileX, tileY } = this.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.removeEntity(tileX, tileY, this.config.dimX, this.config.dimY, this.id);
    }
}

ArmyEntity.prototype.playSound = function(gameContext, soundType) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const soundID = this.config.sounds[soundType];

    if(soundID) {
        soundPlayer.play(soundID);
    }
}

ArmyEntity.prototype.getSpriteID = function(spriteType) {
    const spriteID = this.config.sprites[spriteType];

    if(!spriteID) {
        return null;
    }

    return spriteID;
}

ArmyEntity.prototype.isAlive = function() {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isAlive = healthComponent.isAlive();

    return isAlive;
}

ArmyEntity.prototype.lookHorizontal = function(westCondition) {
    const directionComponent = this.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(westCondition) {
        directionComponent.toWest();
    } else {
        directionComponent.toEast();
    }
}

ArmyEntity.prototype.lookVertical = function(northCondition) {
    const directionComponent = this.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(northCondition) {
        directionComponent.toNorth();
    } else {
        directionComponent.toSouth();
    }
}

ArmyEntity.prototype.lookAtEntity = function(target) {
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = targetPosition;

    this.lookAtTile(tileX, tileY);
}

ArmyEntity.prototype.lookAtTile = function(targetX, targetY) {
    const positionComponent = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = positionComponent;

    if(targetX === tileX) {
        this.lookVertical(targetY < tileY);
    } else {
        this.lookHorizontal(targetX < tileX);
        this.lookVertical(targetY < tileY);
    }
}

ArmyEntity.prototype.isAttackableByTeam = function(gameContext, team) {
    if(!this.isAlive()) {
        return false;
    }

    const { teamID } = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamID, team);

    return isEnemy;
}

ArmyEntity.prototype.isMoveable = function() {
    const isMoveable = this.isAlive() && this.hasComponent(ArmyEntity.COMPONENT.MOVE);

    return isMoveable;
}