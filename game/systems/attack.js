import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { AttackComponent } from "../components/attack.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AllianceSystem } from "./alliance.js";

export const AttackSystem = function() {}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

AttackSystem.getOutcomeState = function(gameContext, damage, target, attackerIDs) {
    const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder === 0) {
        const isBulldozed = AttackSystem.getBulldozed(gameContext, target, attackerIDs);
        const isReviveable = target.hasComponent(ArmyEntity.COMPONENT.REVIVEABLE);

        if(isReviveable && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

AttackSystem.isTargetInRange = function(target, attacker, range) {
    const attackerPosition = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);

    const collision = isRectangleRectangleIntersect(
        attackerPosition.tileX - range,
        attackerPosition.tileY - range,
        attacker.config.dimX - 1 + range * 2,
        attacker.config.dimY - 1 + range * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );

    return collision;
}

AttackSystem.pickAttackCounterTarget = function(gameContext, attacker, targetIDs) {

}

AttackSystem.getAttackCounterTargets = function(gameContext, attacker) {
    const attackerAttackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

    if(!attackerAttackComponent || !attackerAttackComponent.isAttackCounterable()) {
        return [];
    }

    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
    const targets = this.findTargetsInMaxRange(gameContext, attacker, (target) => {
        const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);

        if(!healthComponent.isAlive()) {
            return false;
        }

        const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackerAttackComponent.range);

        if(isEnemy && hasRange) {
            return true;
        }
    });
    
    return targets;
}

AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = this.findAttackersInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isMoveCounterable()) {
            return false;
        }

        const attackerHealthComponent = attacker.getComponent(ArmyEntity.COMPONENT.HEALTH);

        if(!attackerHealthComponent.isAlive()) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(hasRange && isEnemy) {
            return true;
        }
    });

    return attackers;
}

AttackSystem.getActiveAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = this.findAttackersInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || attackComponent.type !== AttackComponent.ATTACK_TYPE.ACTIVE) {
            return false;
        }

        const attackerHealthComponent = attacker.getComponent(ArmyEntity.COMPONENT.HEALTH);

        if(!attackerHealthComponent.isAlive()) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(hasRange && isEnemy) {
            return true;
        }
    });

    return attackers;
}

AttackSystem.findTargetsInMaxRange = function(gameContext, attacker, onCheck) {
    const { world } = gameContext;
    const { entityManager } = world;

    const targets = [];
    const healthComponent = attacker.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return targets;
    }

    const settings = world.getConfig("Settings");
    const nearbyEntities = attacker.getSurroundingEntities(gameContext, settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const entityID = nearbyEntities[i];
        const entity = entityManager.getEntity(entityID);

        if(entity && onCheck(entity)) {
            targets.push(entityID);
        }
    }

    return targets;
}

AttackSystem.findAttackersInMaxRange = function(gameContext, target, onCheck) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    const attackers = [];
    const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!healthComponent.isAlive()) {
        return attackers;
    }

    const settings = world.getConfig("Settings");
    const nearbyEntities = target.getSurroundingEntities(gameContext, settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const entityID = nearbyEntities[i];
        const entity = entityManager.getEntity(entityID);

        if(entity && onCheck(entity)) {
            attackers.push(entityID);
        }
    }

    return attackers;
}

AttackSystem.getDamage = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    const armorComponent = target.getComponent(ArmyEntity.COMPONENT.ARMOR);

    let totalDamage = 0;
    let totalArmor = 0;

    if(armorComponent) {
        totalArmor += armorComponent.getArmor();
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);
        const damage = attackComponent.getDamage(totalArmor);
    
        totalDamage += damage;
    }

    return totalDamage;
}

AttackSystem.getBulldozed = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(attackComponent && attackComponent.isBulldozed(target.config.archetype)) {
            return true;
        }
    }

    return false;
}