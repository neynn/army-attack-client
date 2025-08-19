import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AllianceSystem } from "./alliance.js";
import { DecaySystem } from "./decay.js";
import { EntityKillEvent } from "../events/entityKill.js";
import { EntityHitEvent } from "../events/entityHit.js";
import { EntityDownEvent } from "../events/entityDown.js";
import { ArmyContext } from "../armyContext.js";

/**
 * Uses an AABB collision to check if an attacker and a target overlap in the specified range.
 * 
 * @param {ArmyEntity} attacker 
 * @param {ArmyEntity} target 
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
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 * @param {int} range 
 * @returns {ArmyEntity[]}
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
 * Calls a callback for the surrounding entities, if they are alive.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 * @param {function} onCheck 
 * @returns 
 */
const checkSurroundingAliveEntities = function(gameContext, entity, onCheck) {
    if(!entity.isAlive()) {
        return;
    }

    const nearbyEntities = getSurroundingEntities(gameContext, entity, gameContext.settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const nearbyEntity = nearbyEntities[i];

        if(nearbyEntity.isAlive()) {
            onCheck(nearbyEntity);
        }
    }
}

/**
 * Picks a target out of a list.
 * TODO: add proper ai to filter targets.
 * 
 * @param {ArmyEntity} attacker 
 * @param {ArmyEntity[]} targets 
 * @returns 
 */
const pickAttackCounterTarget = function(attacker, targets) {
    if(targets.length === 0) {
        return null;
    }

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
 * Collection of functions revolving around the animations.
 */
export const AttackSystem = function() {}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

/**
 * Takes the damage and bulldozer result to return the state of the target.
 * 
 * @param {ArmyEntity} target 
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
 * @param {ArmyContext} gameContext 
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
 * Ends a regular attack on a target.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} target 
 * @param {string} actorID 
 */
AttackSystem.endAttack = function(gameContext, target, actorID) {
    AttackSystem.updateTarget(gameContext, target, actorID, ArmyEventHandler.KILL_REASON.ATTACK);
}

/**
 * Updates the targets state after the attack is finished.
 * 
 * Emits events.
 * 
 * @param {ArmyContext} gameContext 
 * @param {TargetObject} target 
 * @param {string} actorID 
 * @param {string} reason 
 */
AttackSystem.updateTarget = function(gameContext, target, actorID, reason) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;
    const { id, state, damage } = target;

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DEAD: {
            const entity = entityManager.getEntity(id);

            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
            eventBus.emit(ArmyEventHandler.TYPE.ENTITY_KILL, EntityKillEvent.createEvent(id, actorID, damage, reason));
            break;
        }
        case AttackSystem.OUTCOME_STATE.IDLE: {
            const entity = entityManager.getEntity(id);
            
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
            eventBus.emit(ArmyEventHandler.TYPE.ENTITY_HIT, EntityHitEvent.createEvent(id, actorID, damage, reason));
            break;
        }
        case AttackSystem.OUTCOME_STATE.DOWN: {
            eventBus.emit(ArmyEventHandler.TYPE.ENTITY_HIT, EntityHitEvent.createEvent(id, actorID, damage, reason));
            eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DOWN, EntityDownEvent.createEvent(id, actorID, damage, reason)); 
            break;
        }
    }
}

/**
 * Returns a list of potential targets the entity can counter.
 * Fails if the entity cannot counter.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} attacker 
 * @returns {ArmyEntity | null}
 */
AttackSystem.getAttackCounterTarget = function(gameContext, attacker) {
    const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent || !attackComponent.isAttackCounterable()) {
        return null;
    }

    const targets = [];
    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);

    checkSurroundingAliveEntities(gameContext, attacker, (target) => {
        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(hasRange) {
            const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
            const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

            if(isEnemy) {
                targets.push(target);
            }
        }
    });

    const target = pickAttackCounterTarget(attacker, targets);

    return target;
}

/**
 * Returns a list of attackers that counter the movement of an entity.
 * Fails if no attackers are present.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} target 
 * @returns {ArmyEntity[]}
 */
AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const attackers = [];
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);

    checkSurroundingAliveEntities(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(attackComponent && attackComponent.isMoveCounterable()) {
            const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

            if(hasRange) {
                const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
                const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

                if(isEnemy) {
                    attackers.push(attacker);
                }
            }
        }
    });

    return attackers;
}

/**
 * Returns a list of entites that belong to the actor and can attack the target.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} target 
 * @param {string} actorID 
 * @returns {ArmyEntity[]}
 */
AttackSystem.getActiveAttackers = function(gameContext, target, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);
    const attackers = [];

    if(!actor) {
        return attackers;
    }

    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);

    checkSurroundingAliveEntities(gameContext, target, (attacker) => {
        const attackerID = attacker.getID();

        if(actor.hasEntity(attackerID)) {
            const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

            if(attackComponent && attackComponent.isActive()) {
                const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

                if(hasRange) {
                    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
                    const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

                    if(isEnemy) {
                        attackers.push(attacker);
                    }
                }
            }
        }
    });

    return attackers;
}

/**
 * Returns a target object for the specified target.
 * 
 * @param {ArmyEntity} target 
 * @param {ArmyEntity[]} attackers 
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

/**
 * Checks if a team can target an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 * @param {string} teamID 
 * @returns {boolean}
 */
AttackSystem.isAttackableByTeam = function(gameContext, entity, teamID) {
    const isAlive = entity.isAlive();

    if(!isAlive) {
        return false;
    }

    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isEnemy = AllianceSystem.isEnemy(gameContext, teamComponent.teamID, teamID);

    return isEnemy;
}