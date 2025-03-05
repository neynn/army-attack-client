import { ArmyEntity } from "../init/armyEntity.js";
import { AllianceSystem } from "./alliance.js";
import { AnimationSystem } from "./animation.js";
import { DecaySystem } from "./decay.js";
import { DropSystem } from "./drop.js";

export const AttackSystem = function() {}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

const filterAliveEntitiesInMaxRange = function(gameContext, entity, onCheck) {
    const { world } = gameContext;
    const { entityManager } = world;
    const entities = [];
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return entities;
    }

    const nearbyEntities = entity.getSurroundingEntities(gameContext, gameContext.settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const nearbyEntity = entityManager.getEntity(nearbyEntities[i]);

        if(!nearbyEntity) {
            continue;
        }

        const healthComponent = nearbyEntity.getComponent(ArmyEntity.COMPONENT.HEALTH);

        if(!healthComponent.isAlive()) {
            continue;
        }

        if(onCheck(nearbyEntity)) {
            entities.push(nearbyEntity);
        }
    }

    return entities;
}

const getState = function(target, damage, isBulldozed) {
    const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder === 0) {
        const isReviveable = target.hasComponent(ArmyEntity.COMPONENT.REVIVEABLE);

        if(isReviveable && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

AttackSystem.endAttack = function(gameContext, outcome, attackerClientID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { targetID, attackers, damage, state } = outcome;
    const target = entityManager.getEntity(targetID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DEAD: {
            AnimationSystem.playDeath(gameContext, target);
            DropSystem.dropKillReward(gameContext, target, attackerClientID);
            target.die(gameContext);
            break;
        }
        case AttackSystem.OUTCOME_STATE.IDLE: {
            DropSystem.dropHitReward(gameContext, target, attackerClientID);
            target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
            break;
        }
    }
}

AttackSystem.beginAttack = function(gameContext, outcome) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackers, targetID, state, damage } = outcome;
    const target = entityManager.getEntity(targetID);

    target.reduceHealth(damage);
    AnimationSystem.playFire(gameContext, target, attackers);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DOWN: {
            DecaySystem.beginDecay(gameContext, target);
            break;
        }
        default: {
            target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
            break;
        }
    }
}

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

AttackSystem.getAttackCounterTargets = function(gameContext, attacker) {
    const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackComponent || !attackComponent.isAttackCounterable()) {
        return [];
    }

    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
    const targets = filterAliveEntitiesInMaxRange(gameContext, attacker, (target) => {
        const hasRange = attacker.isEntityInRange(target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });
    
    return targets;
}

AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isMoveCounterable()) {
            return false;
        }

        const hasRange = attacker.isEntityInRange(target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    return attackers;
}

AttackSystem.getActiveAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isActive()) {
            return false;
        }

        const hasRange = attacker.isEntityInRange(target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    return attackers;
}

AttackSystem.getOutcome = function(target, attackers) {
    const armorComponent = target.getComponent(ArmyEntity.COMPONENT.ARMOR);
    const attackerIDList = [];
    const targetID = target.getID();

    let totalDamage = 0;
    let totalArmor = 0;
    let isBulldozed = false;

    if(armorComponent) {
        totalArmor += armorComponent.getArmor();
    }

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const attackerID = attacker.getID();
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);
        const damage = attackComponent.getDamage(totalArmor);

        if(!isBulldozed) {
            isBulldozed = attackComponent.isBulldozed(target.config.archetype);
        }

        totalDamage += damage;

        attackerIDList.push(attackerID);
    }

    const state = getState(target, totalDamage, isBulldozed)

    return {
        "state": state,
        "damage": totalDamage,
        "attackers": attackerIDList,
        "targetID": targetID
    }
}