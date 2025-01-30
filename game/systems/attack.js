import { isRectangleRectangleIntersect } from "../../source/math/math.js";

import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { CounterComponent } from "../components/counter.js";
import { HealthComponent } from "../components/health.js";
import { PositionComponent } from "../components/position.js";
import { ReviveableComponent } from "../components/reviveable.js";
import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";

export const AttackSystem = function() {
    this.id = "AttackSystem";
}

AttackSystem.OUTCOME_STATE = {
    "IDLE": 0,
    "DOWN": 1,
    "DEAD": 2
};

AttackSystem.getOutcomeState = function(gameContext, damage, target, attackerIDs) {
    const healthComponent = target.getComponent(HealthComponent);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder === 0) {
        const isBulldozed = AttackSystem.getBulldozed(gameContext, target, attackerIDs);
        const isReviveable = target.hasComponent(ReviveableComponent);

        if(target.hasComponent(ReviveableComponent) && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

AttackSystem.getUniqueEntitiesInRangeOfEntity = function(gameContext, entity, range = 0) {
    const { world } = gameContext;
    const positionComponent = entity.getComponent(PositionComponent);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + entity.config.dimX + range;
    const endY = positionComponent.tileY + entity.config.dimY + range;
    const entities = world.getEntitiesInRange(startX, startY, endX, endY);

    console.log(entities);
    return entities;
}

AttackSystem.isTargetInRange = function(target, attacker, range) {
    const attackerPosition = attacker.getComponent(PositionComponent);
    const targetPosition = target.getComponent(PositionComponent);

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
    const attackerAttackComponent = attacker.getComponent(AttackComponent);
    const attackerCounterComponent = attacker.getComponent(CounterComponent);

    if(!attackerAttackComponent || !attackerCounterComponent || !attackerCounterComponent.isAttackCounterable()) {
        return [];
    }

    const attackerTeamComponent = attacker.getComponent(TeamComponent);
    const targets = this.findTargetsInMaxRange(gameContext, attacker, (target) => {
        const healthComponent = target.getComponent(HealthComponent);

        if(!healthComponent.isAlive()) {
            return false;
        }

        const targetTeamComponent = target.getComponent(TeamComponent);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackerAttackComponent.range);

        if(isEnemy && hasRange) {
            return true;
        }
    });
    
    return targets;
}

AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(TeamComponent);
    const attackers = this.findAttackersInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(AttackComponent);
        const counterComponent = attacker.getComponent(CounterComponent);

        if(!attackComponent || !counterComponent || !counterComponent.isMoveCounterable()) {
            return false;
        }

        const attackerHealthComponent = attacker.getComponent(HealthComponent);

        if(!attackerHealthComponent.isAlive()) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(TeamComponent);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(hasRange && isEnemy) {
            return true;
        }
    });

    return attackers;
}

AttackSystem.getActiveAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(TeamComponent);
    const attackers = this.findAttackersInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(AttackComponent);

        if(!attackComponent || attackComponent.type !== AttackComponent.ATTACK_TYPE_ACTIVE) {
            return false;
        }

        const attackerHealthComponent = attacker.getComponent(HealthComponent);

        if(!attackerHealthComponent.isAlive()) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(TeamComponent);
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
    const targets = [];
    const healthComponent = attacker.getComponent(HealthComponent);

    if(!healthComponent.isAlive()) {
        return targets;
    }

    const settings = world.getConfig("Settings");
    const nearbyEntities = AttackSystem.getUniqueEntitiesInRangeOfEntity(gameContext, attacker, settings.maxAttackRange);

    for(const entity of nearbyEntities) {
        if(onCheck(entity)) {
            const id = entity.getID();

            targets.push(id);
        }
    }

    return targets;
}

AttackSystem.findAttackersInMaxRange = function(gameContext, target, onCheck) {
    const { world } = gameContext;
    const healthComponent = target.getComponent(HealthComponent);
    const attackers = [];

    if(!healthComponent.isAlive()) {
        return attackers;
    }

    const settings = world.getConfig("Settings");
    const nearbyEntities = AttackSystem.getUniqueEntitiesInRangeOfEntity(gameContext, target, settings.maxAttackRange);

    for(const entity of nearbyEntities) {
        if(onCheck(entity)) {
            const id = entity.getID();

            attackers.push(id);
        }
    }

    return attackers;
}

AttackSystem.getDamage = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    const armorComponent = target.getComponent(ArmorComponent);

    let totalDamage = 0;
    let totalArmor = 0;

    if(armorComponent) {
        totalArmor += armorComponent.getArmor();
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(AttackComponent);
        const damage = attackComponent.getDamage(totalArmor);
    
        totalDamage += damage;
    }

    return totalDamage;
}

AttackSystem.getBulldozed = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    const isBulldozeable = BulldozeComponent.isBulldozeable(target.config.archetype);

    if(!isBulldozeable) {
        return false;
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const bulldozeComponent = attacker.getComponent(BulldozeComponent);

        if(bulldozeComponent && bulldozeComponent.isBulldozed(target.config.archetype)) {
            return true;
        }
    }

    return false;
}