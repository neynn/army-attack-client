import { Entity } from "../../source/entity/entity.js";
import { clampValue, isRectangleRectangleIntersect } from "../../source/math/math.js";
import { SpriteComponent } from "../components/sprite.js";
import { DefaultTypes } from "../defaultTypes.js";
import { getTeamID } from "../enums.js";
import { AllianceSystem } from "../systems/alliance.js";
import { StatCard } from "./statCard.js";

export const ArmyEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);

    this.health = 1;
    this.maxHealth = 1;
    this.tileX = -1;
    this.tileY = -1;
    this.directionX = ArmyEntity.DIRECTION.EAST;
    this.directionY = ArmyEntity.DIRECTION.SOUTH;
    this.teamID = null;
    this.statCard = new StatCard();
}

ArmyEntity.TYPE = {
    UNIT: "Unit",
    DEFENSE: "Defense",
    CONSTRUCTION: "Construction",
    BUILDING: "Building"
};

ArmyEntity.COMPONENT = {
    CONSTRUCTION: "Construction",
    REVIVEABLE: "Reviveable",
    ATTACK: "Attack",
    MOVE: "Move",
    UNIT: "Unit",
    ARMOR: "Armor",
    AVIAN: "Avian",
    SPRITE: "Sprite",
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

ArmyEntity.DIRECTION = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
};

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;

ArmyEntity.prototype.updateSpritePosition = function(gameContext, deltaX, deltaY) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const sprite = spriteComponent.getSprite(gameContext);

    sprite.positionX += deltaX;
    sprite.positionY += deltaY;
}

ArmyEntity.prototype.setSpritePosition = function(gameContext, positionX, positionY) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

    spriteComponent.setPosition(gameContext, positionX, positionY);
}

ArmyEntity.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

ArmyEntity.prototype.lookAtEntity = function(target) {
    this.lookAtTarget(target.tileX, target.tileY);
}

ArmyEntity.prototype.lookAtTarget = function(targetX, targetY) {
    if(targetX === this.tileX) {
        this.lookVertical(targetY < this.tileY);
    } else {
        this.lookHorizontal(targetX < this.tileX);
        this.lookVertical(targetY < this.tileY);
    }
}

ArmyEntity.prototype.lookVertical = function(northCondition) {
    if(northCondition) {
        this.directionY = ArmyEntity.DIRECTION.NORTH; 
    } else {
        this.directionY = ArmyEntity.DIRECTION.SOUTH; 
    }
}

ArmyEntity.prototype.lookHorizontal = function(westCondition) {
    if(westCondition) {
        this.directionX = ArmyEntity.DIRECTION.WEST; 
    } else {
        this.directionX = ArmyEntity.DIRECTION.EAST; 
    }
}

ArmyEntity.prototype.updateSpriteHorizontal = function(gameContext) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

    if(this.directionX === ArmyEntity.DIRECTION.WEST) {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
    }
}

ArmyEntity.prototype.updateSpriteDirectonal = function(gameContext, southTypeID, northTypeID) {
    const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);

    if(this.directionX === ArmyEntity.DIRECTION.WEST) {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.FLIPPED);
    } else {
        spriteComponent.setFlipState(gameContext, SpriteComponent.FLIP_STATE.UNFLIPPED);
    }

    if(this.directionY === ArmyEntity.DIRECTION.SOUTH) {
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

        spriteComponent.updateSprite(gameContext, spriteID);
    }
}

ArmyEntity.prototype.addHealth = function(value) {
    const health = clampValue(this.health + value, this.maxHealth, 0);

    this.health = health;
    this.updateStatCard();
}

ArmyEntity.prototype.reduceHealth = function(value) {
    const health = this.health - value;

    if(health < 0) {
        this.health = 0;
    } else {
        this.health = health;
    }

    this.updateStatCard();
}

ArmyEntity.prototype.isDamageFatal = function(damage) {
    return (this.health - damage) <= 0;
}

ArmyEntity.prototype.isFull = function() {
    return this.health >= this.maxHealth;
}

ArmyEntity.prototype.getMissingHealth = function() {
    return this.maxHealth - this.health;
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
    return this.health > 0;
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
    const startX = this.tileX - range;
    const startY = this.tileY - range;
    const endX = this.tileX + this.config.dimX + range;
    const endY = this.tileY + this.config.dimY + range;
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
    const surroundingEntities = this.getSurroundingEntities(gameContext, attackComponent.range);
    let target = null;

    for(let i = 0; i < surroundingEntities.length; i++) {
        const entity = surroundingEntities[i];
        const isTargetable = entity.isAlive() && AllianceSystem.isEnemy(gameContext, this.teamID, entity.teamID);

        if(isTargetable) {
            if(!target) {
                target = entity;
            } else {
                if(entity.health < target.health) {
                    target = entity;
                }
            }
        }
    }

    return target;
}

ArmyEntity.prototype.getMoveCounterAttackers = function(gameContext) {
    const potentialAttackers = this.getSurroundingEntities(gameContext, gameContext.settings.maxAttackRange);
    const attackers = [];

    if(!this.isAlive()) {
        return attackers;
    }

    for(let i = 0; i < potentialAttackers.length; i++) {
        const potentialAttacker = potentialAttackers[i];

        if(potentialAttacker.canCounterMove()) {
            const attackerAttackComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

            if(potentialAttacker.isColliding(this, attackerAttackComponent.range)) {
                if(AllianceSystem.isEnemy(gameContext, potentialAttacker.teamID, this.teamID)) {
                    attackers.push(potentialAttacker);
                }
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

    const potentialAttackers = this.getSurroundingEntities(gameContext, gameContext.settings.maxAttackRange);

    for(let i = 0; i < potentialAttackers.length; i++) {
        const potentialAttacker = potentialAttackers[i];
        const attackerID = potentialAttacker.getID();

        if(actor.hasEntity(attackerID) && potentialAttacker.canActivelyAttack()) {
            const attackerAttackComponent = potentialAttacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

            if(potentialAttacker.isColliding(this, attackerAttackComponent.range)) {
                if(AllianceSystem.isEnemy(gameContext, potentialAttacker.teamID, this.teamID)) {
                    attackers.push(potentialAttacker);
                }
            }
        }
    }

    return attackers;
}

ArmyEntity.prototype.isColliding = function(target, range) {
    return isRectangleRectangleIntersect(
        this.tileX - range,
        this.tileY - range,
        this.config.dimX - 1 + range * 2,
        this.config.dimY - 1 + range * 2,
        target.tileX,
        target.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );;
}

ArmyEntity.prototype.isAttackableByTeam = function(gameContext, teamID) {
    if(!this.isAlive()) {
        return false;
    }

    const isEnemy = AllianceSystem.isEnemy(gameContext, this.teamID, teamID);

    return isEnemy;
}

ArmyEntity.prototype.getCenterTile = function() {
    const centerX = this.tileX + ((this.config.dimX - 1) / 2);
    const centerY = this.tileY + ((this.config.dimY - 1) / 2);

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
    const owners = turnManager.getOwnersOf(this.id).map(actor => actor.getID());
    const type = this.config.constructionResult;
    
    return DefaultTypes.createSpawnConfig(type, this.teamID, owners, this.tileX, this.tileY);
}

ArmyEntity.prototype.updateStatCard = function() {
    this.statCard.setHealthText(`${this.health}/${this.maxHealth}`);

    const attackComponent = this.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(attackComponent) {
        this.statCard.setDamageText(`${attackComponent.damage}`);
    }
}

ArmyEntity.prototype.isProductionFinished = function() {
    const productionComponent = this.getComponent(ArmyEntity.COMPONENT.PRODUCTION);

    return productionComponent && productionComponent.isFinished() && this.isFull();
}

ArmyEntity.prototype.createStatCardSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const cardType = this.hasComponent(ArmyEntity.COMPONENT.ATTACK) ? StatCard.TYPE.LARGE : StatCard.TYPE.SMALL;
    const teamType = gameContext.getTeamType(getTeamID(this.teamID));
    const spriteType = teamType.sprites[cardType];
    const statCardSprite = spriteManager.createCachedSprite(spriteType);

    return statCardSprite;
}

ArmyEntity.prototype.generateStatCard = function(gameContext) {
    if(this.config.disableCard) {
        return;
    }

    const statCardSprite = this.createStatCardSprite(gameContext);

    if(statCardSprite) {
        const { transform2D } = gameContext;
        const { x, y } = transform2D.transformSizeToWorldOffset(this.config.dimX, this.config.dimY);
        const spriteComponent = this.getComponent(ArmyEntity.COMPONENT.SPRITE);
        const sprite = spriteComponent.getSprite(gameContext);

        sprite.addChild(this.statCard);

        this.statCard.setPosition(x - transform2D.halfTileWidth, y - transform2D.halfTileHeight);
        this.statCard.setSprite(statCardSprite);
        this.updateStatCard();
    }
}

ArmyEntity.prototype.beginDecay = function() {
    const reviveableComponent = this.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(reviveableComponent) {
        const avianComponent = this.getComponent(ArmyEntity.COMPONENT.AVIAN);

        if(avianComponent) {
            avianComponent.toGround();
        }

        reviveableComponent.beginDecay();
    }
}

ArmyEntity.prototype.endDecay = function() {
    const reviveableComponent = this.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(reviveableComponent) {
        const avianComponent = this.getComponent(ArmyEntity.COMPONENT.AVIAN);

        if(avianComponent) {
            avianComponent.toAir();
        }

        reviveableComponent.endDecay();
    }
}