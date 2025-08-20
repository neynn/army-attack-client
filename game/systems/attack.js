import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { DecaySystem } from "./decay.js";
import { EntityKillEvent } from "../events/entityKill.js";
import { EntityHitEvent } from "../events/entityHit.js";
import { EntityDownEvent } from "../events/entityDown.js";
import { ArmyContext } from "../armyContext.js";

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
        totalArmor += armorComponent.armor;
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