import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { DefaultTypes } from "../defaultTypes.js";
import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AllianceSystem } from "./alliance.js";
import { DecaySystem } from "./decay.js";

/**
 * Uses an AABB collision to check if an attacker and a target overlap in the specified range.
 * 
 * @param {*} attacker 
 * @param {*} target 
 * @param {int} range 
 * @returns {boolean}
 */
const hasEnoughRange = function(attacker, target, range) {
    const position = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);

    const collision = isRectangleRectangleIntersect(
        position.tileX - range,
        position.tileY - range,
        attacker.config.dimX - 1 + range * 2,
        attacker.config.dimY - 1 + range * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );

    return collision;
}

/**
 * Gets the unique entities in a range.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {int} range 
 * @returns {Entity[]}
 */
const getSurroundingEntities = function(gameContext, entity, range) {
    const { world } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + entity.config.dimX + range;
    const endY = positionComponent.tileY + entity.config.dimY + range;
    const entities = world.getUniqueEntitiesInArea(startX, startY, endX, endY);

    return entities;
}

/**
 * Filters the entities around an entity in the maximum specified range.
 * Fails if the entity is dead.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {*} onCheck 
 * @returns 
 */
const filterAliveEntitiesInMaxRange = function(gameContext, entity, onCheck) {
    if(!entity.isAlive()) {
        return [];
    }

    const validEntities = [];
    const nearbyEntities = getSurroundingEntities(gameContext, entity, gameContext.settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const nearbyEntity = nearbyEntities[i];

        if(nearbyEntity.isAlive() && onCheck(nearbyEntity)) {
            validEntities.push(nearbyEntity);
        }
    }

    return validEntities;
}

/**
 * Collection of functions revolving around the animations.
 */
export const AttackSystem = function() {}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

/**
 * Checks if an entity can counter an attack.
 * 
 * @param {*} entity 
 * @returns {boolean}
 */
AttackSystem.isAttackCounterable = function(entity) {
    if(!entity.isAlive()) {
        return false;
    }

    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);

    return attackComponent && attackComponent.isAttackCounterable();
}

/**
 * Takes the damage and bulldozer result to return the state of the target.
 * 
 * @param {*} target 
 * @param {int} damage 
 * @param {bool} isBulldozed 
 * @returns {int}
 */
AttackSystem.getState = function(target, damage, isBulldozed) {
    const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isFatal = healthComponent.isFatal(damage);

    if(isFatal) {
        const isReviveable = target.hasComponent(ArmyEntity.COMPONENT.REVIVEABLE);

        if(isReviveable && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

/**
 * Starts the attack on a target.
 * 
 * @param {*} gameContext 
 * @param {TargetObject} targetObject 
 */
AttackSystem.startAttack = function(gameContext, targetObject) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { id, damage, state } = targetObject;
    const entity = entityManager.getEntity(id);

    entity.reduceHealth(damage);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DOWN: {
            DecaySystem.beginDecay(entity);
            
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.DOWN);
            entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
            break;
        }
        default: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
            break;
        }
    }
}

/**
 * Ends the attack on a target and emits events.
 * 
 * @param {*} gameContext 
 * @param {*} target 
 * @param {string} actorID 
 */
AttackSystem.endAttack = function(gameContext, target, actorID) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;
    const { id, state, damage } = target;
    const entity = entityManager.getEntity(id);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DEAD: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

            eventBus.emit(GameEvent.TYPE.ENTITY_KILL, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "entity": entity,
                "damage": damage,
                "actor": actorID
            });
            break;
        }
        case AttackSystem.OUTCOME_STATE.IDLE: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

            eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "entity": entity,
                "damage": damage,
                "actor": actorID
            });
            break;
        }
        case AttackSystem.OUTCOME_STATE.DOWN: {
            eventBus.emit(GameEvent.TYPE.ENTITY_DOWN, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "entity": entity,
                "damage": damage,
                "actor": actorID
            });

            eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "entity": entity,
                "damage": damage,
                "actor": actorID
            });
            break;
        }
    }
}

/**
 * Picks a target out of a list.
 * TODO: add proper ai to filter targets.
 * 
 * @param {*} attacker 
 * @param {*} targets 
 * @returns 
 */
AttackSystem.pickAttackCounterTarget = function(attacker, targets) {
    let index = 0;
    let weakest = targets[0].getHealth();

    for(let i = 1; i < targets.length; i++) {
        const target = targets[i];
        const health = target.getHealth();

        if(weakest > health) {
            index = i;
            weakest = health;
        }
    }

    return targets[index];
}

/**
 * Returns a list of potential targets the entity can counter.
 * Fails if the entity cannot counter.
 * 
 * @param {*} gameContext 
 * @param {*} attacker 
 * @returns 
 */
AttackSystem.getAttackCounterTargets = function(gameContext, attacker) {
    const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent || !attackComponent.isAttackCounterable()) {
        return null;
    }

    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
    const targets = filterAliveEntitiesInMaxRange(gameContext, attacker, (target) => {
        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });
    
    if(targets.length === 0) {
        return null;
    }

    return targets;
}

/**
 * Returns a list of attackers that counter the movement of an entity.
 * Fails if no attackers are present.
 * 
 * @param {*} gameContext 
 * @param {*} target 
 * @returns 
 */
AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isMoveCounterable()) {
            return false;
        }

        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    if(attackers.length === 0) {
        return null;
    }

    return attackers;
}

/**
 * Returns a list of entites that belong to the actor and can attack the target.
 * 
 * @param {*} gameContext 
 * @param {*} target 
 * @param {string} actorID 
 * @returns 
 */
AttackSystem.getActiveAttackers = function(gameContext, target, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return null;
    }

    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackerID = attacker.getID();

        if(!actor.hasEntity(attackerID)) {
            return false;
        }

        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isActive()) {
            return false;
        }

        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    if(attackers.length === 0) {
        return null;
    }

    return attackers;
}

/**
 * Returns a target object for the specified target.
 * 
 * @param {*} target 
 * @param {*} attackers 
 * @returns {TargetObject}
 */
AttackSystem.getAttackTarget = function(target, attackers) {
    const armorComponent = target.getComponent(ArmyEntity.COMPONENT.ARMOR);

    let totalDamage = 0;
    let totalArmor = 0;
    let isBulldozed = false;

    if(armorComponent) {
        totalArmor += armorComponent.getArmor();
    }

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);
        const damage = attackComponent.getDamage(totalArmor);

        if(!isBulldozed) {
            isBulldozed = attackComponent.isBulldozed(target.config.archetype);
        }

        totalDamage += damage;
    }

    const targetID = target.getID();
    const targetState = AttackSystem.getState(target, totalDamage, isBulldozed);
    const targetObject = DefaultTypes.createTargetObject(targetID, totalDamage, targetState);

    return targetObject;
}