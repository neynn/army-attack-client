import { Entity } from "../../source/entity/entity.js";
import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { DirectionComponent } from "../components/direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { DefaultTypes } from "../defaultTypes.js";
import { AllianceSystem } from "../systems/alliance.js";
import { StatCard } from "./statCard.js";

export const ArmyEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);

    this.statCard = new StatCard();
}

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
    UNIT: "Unit",
    ARMOR: "Armor",
    AVIAN: "Avian",
    POSITION: "Position",
    SPRITE: "Sprite",
    DIRECTION: "Direction",
    TEAM: "Team",
    PRODUCTION: "Production",
    TOWN: "Town"
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
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
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
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
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
    const { spriteManager } = gameContext;
    const spriteID = this.config.sprites[spriteType];

    if(spriteID) {
        const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

        spriteManager.updateSprite(spriteComponent.spriteIndex, spriteID);
    }
}

ArmyEntity.prototype.addHealth = function(health) {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);
    
    healthComponent.addHealth(health);

    this.updateStatCard();
}

ArmyEntity.prototype.reduceHealth = function(damage) {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);
    
    healthComponent.reduceHealth(damage);

    this.updateStatCard();
}

ArmyEntity.prototype.getHealth = function() {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    return healthComponent.health;
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

ArmyEntity.prototype.determineSprite = function(gameContext) {
    const reviveableComponent = this.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(reviveableComponent) {
        const isAlive = reviveableComponent.isAlive();

        if(!isAlive) {
            this.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.DOWN);
        }
    }
}

ArmyEntity.prototype.getSurroundingEntities = function(gameContext, range) {
    const { world } = gameContext;
    const positionComponent = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + this.config.dimX + range;
    const endY = positionComponent.tileY + this.config.dimY + range;
    const entities = world.getUniqueEntitiesInArea(startX, startY, endX, endY);

    return entities;
}

ArmyEntity.prototype.canCounterAttack = function() {
    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const canCounterAttack = attackComponent && attackComponent.isAttackCounterable() && this.isAlive();

    return canCounterAttack;
}

ArmyEntity.prototype.canCounterMove = function() {
    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const canCounterMove = attackComponent && attackComponent.isMoveCounterable() && this.isAlive();

    return canCounterMove;
}

ArmyEntity.prototype.canActivelyAttack = function() {
    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const canActivelyAttack = attackComponent && attackComponent.isActive() && this.isAlive();

    return canActivelyAttack;
}

ArmyEntity.prototype.canMove = function() {
    return this.isAlive() && this.hasComponent(ArmyEntity.COMPONENT.MOVE);
}

ArmyEntity.prototype.getAttackCounterTarget = function(gameContext) {
    if(!this.canCounterAttack()) {
        return null;
    }

    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const teamComponent = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const surroundingEntities = this.getSurroundingEntities(gameContext, attackComponent.range);
    let target = null;

    for(let i = 0; i < surroundingEntities.length; i++) {
        const entity = surroundingEntities[i];
        const entityTeamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isTargetable = entity.isAlive() && AllianceSystem.isEnemy(gameContext, teamComponent.teamID, entityTeamComponent.teamID);

        if(isTargetable) {
            if(!target) {
                target = entity;
            } else {
                if(entity.getHealth() < target.getHealth()) {
                    target = entity;
                }
            }
        }
    }

    return target;
}

ArmyEntity.prototype.getMoveCounterAttackers = function(gameContext) {
    const teamComponent = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const potentialAttackers = this.getSurroundingEntities(gameContext, gameContext.settings.maxAttackRange);
    const attackers = [];

    if(!this.isAlive()) {
        return attackers;
    }

    for(let i = 0; i < potentialAttackers.length; i++) {
        const potentialAttacker = potentialAttackers[i];

        if(potentialAttacker.canCounterMove()) {
            const attackerAttackComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.ATTACK);
            const attackerTeamComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.TEAM);
            const isMoveCounterable = potentialAttacker.isColliding(this, attackerAttackComponent.range) && AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, teamComponent.teamID);

            if(isMoveCounterable) {
                attackers.push(potentialAttacker);
            }
        }
    }

    return attackers;
}

ArmyEntity.prototype.getActiveAttackers = function(gameContext, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);
    const attackers = [];

    if(!actor || !this.isAlive()) {
        return attackers;
    }

    const teamComponent = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const potentialAttackers = this.getSurroundingEntities(gameContext, gameContext.settings.maxAttackRange);

    for(let i = 0; i < potentialAttackers.length; i++) {
        const potentialAttacker = potentialAttackers[i];
        const attackerID = potentialAttacker.getID();

        if(actor.hasEntity(attackerID) && potentialAttacker.canActivelyAttack()) {
            const attackerAttackComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.ATTACK);
            const attackerTeamComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.TEAM);
            const isActiveAttacker = potentialAttacker.isColliding(this, attackerAttackComponent.range) && AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, teamComponent.teamID);

            if(isActiveAttacker) {
                attackers.push(potentialAttacker);
            }
        }
    }

    return attackers;
}

ArmyEntity.prototype.isColliding = function(target, range) {
    const position = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);

    const collision = isRectangleRectangleIntersect(
        position.tileX - range,
        position.tileY - range,
        this.config.dimX - 1 + range * 2,
        this.config.dimY - 1 + range * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );

    return collision;
}

ArmyEntity.prototype.isAttackableByTeam = function(gameContext, teamID) {
    if(!this.isAlive()) {
        return false;
    }

    const teamComponent = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, teamID);

    return isEnemy;
}

ArmyEntity.prototype.getCenterTile = function() {
    const positionComponent = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const centerX = positionComponent.tileX + ((this.config.dimX - 1) / 2);
    const centerY = positionComponent.tileY + ((this.config.dimY - 1) / 2);

    return {
        "x": centerX,
        "y": centerY
    }
}

ArmyEntity.prototype.hasPassability = function(passability) {
    if(!this.config.passability) {
        return false;
    }
    
    for(let i = 0; i < this.config.passability.length; i++) {
        if(passability === this.config.passability[i]) {
            return true;
        }
    }

    return false;
}

ArmyEntity.prototype.updateSpritePosition = function(gameContext) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const positionComponent = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { positionX, positionY } = positionComponent;

    spriteComponent.setPosition(gameContext, positionX, positionY);
}

ArmyEntity.prototype.isConstructionComplete = function() {
    if(!this.isAlive()) {
        return false;
    }

    const constructionComponent = this.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);

    if(!constructionComponent) {
        return false;
    }

    return constructionComponent.isComplete(this.config.constructionSteps);
}

ArmyEntity.prototype.getConstructionResult = function(gameContext) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { tileX, tileY } = this.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { teamID } = this.getComponent(ArmyEntity.COMPONENT.TEAM);
    const owners = turnManager.getOwnersOf(this.id).map(actor => actor.getID());
    const type = this.config.constructionResult;
    
    return DefaultTypes.createSpawnConfig(type, teamID, owners, tileX, tileY);
}

ArmyEntity.prototype.updateStatCard = function() {
    const healthComponent = this.getComponent(ArmyEntity.COMPONENT.HEALTH);

    this.statCard.setHealthText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(attackComponent) {
        this.statCard.setDamageText(`${attackComponent.damage}`);
    }
}
