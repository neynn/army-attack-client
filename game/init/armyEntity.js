import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { AllianceSystem } from "../systems/alliance.js";
import { ArmyMap } from "./armyMap.js";

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

ArmyEntity.prototype.isTilePassable = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const tileTypes = world.getConfig("TileType");
    const tileTypeID = activeMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const moveComponent = this.getComponent(ArmyEntity.COMPONENT.MOVE);
    const isTilePassable = moveComponent.hasPassability(tileTypes[tileTypeID].passability);

    return isTilePassable
}

ArmyEntity.prototype.isTileWalkable = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const { teamID } = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const moveComponent = this.getComponent(ArmyEntity.COMPONENT.MOVE);

    const tileTeamID = activeMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const tileAlliance = AllianceSystem.getAlliance(gameContext, teamID, ArmyMap.TEAM_TYPE[tileTeamID]);
    const isTileWalkable = tileAlliance.isWalkable || moveComponent.isStealth();

    return isTileWalkable;
}

ArmyEntity.prototype.isBypassingAllowed = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap || activeMap.disablePassing) {
        return false;
    }

    const avianComponent = this.getComponent(ArmyEntity.COMPONENT.AVIAN);
    const passerAvianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);
    const isBypassByFlight = avianComponent && avianComponent.isFlying() || passerAvianComponent && passerAvianComponent.isFlying();

    if(isBypassByFlight) {
        return true;
    }

    const moveComponent = this.getComponent(ArmyEntity.COMPONENT.MOVE);
    const teamComponent = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const passerTeamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);

    const alliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, passerTeamComponent.teamID);
    const isBypassByAlliance = alliance.isEntityPassingAllowed || moveComponent.isCloaked();

    return isBypassByAlliance;
}

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

ArmyEntity.prototype.isEntityInRange = function(entity, range) {
    const position = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const targetPosition = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

    const collision = isRectangleRectangleIntersect(
        position.tileX - range,
        position.tileY - range,
        this.config.dimX - 1 + range * 2,
        this.config.dimY - 1 + range * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        entity.config.dimX - 1,
        entity.config.dimY - 1
    );

    return collision;
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
        soundPlayer.playRandom(soundID);
    }
}

ArmyEntity.prototype.getSpriteID = function(spriteType) {
    const spriteID = this.config.sprites[spriteType];

    if(!spriteID) {
        return null;
    }

    return spriteID;
}

ArmyEntity.prototype.canMoveThere = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    
    if(!worldMap) {
        return false;
    }

    const entities = worldMap.getEntities(tileX, tileY);

    for(let i = 0; i < entities.length; i++) {
        const entityID = entities[i];
        const entity = entityManager.getEntity(entityID);

        if(!entity) {
            continue;
        }

        //TODO:
    }

    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return false;
    }

    return true;
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

ArmyEntity.prototype.die = function(gameContext) {
    const { world, spriteManager } = gameContext;
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

    this.removeFromMap(gameContext);

    spriteManager.destroySprite(spriteComponent.spriteID);

    world.destroyEntity(this.id);
}

ArmyEntity.prototype.isAttackable = function(gameContext, attackerTeamID) {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return false;
    }

    const { teamID } = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamID, teamID);

    return isEnemy;
}

ArmyEntity.prototype.isMoveable = function() {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return false;
    }

    return this.hasComponent(ArmyEntity.COMPONENT.MOVE);
}