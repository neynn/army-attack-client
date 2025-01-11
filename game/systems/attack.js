import { isRectangleRectangleIntersect } from "../../source/math/math.js";

import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { CounterComponent } from "../components/counter.js";
import { HealthComponent } from "../components/health.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";
import { DecaySystem } from "./decay.js";

export const AttackSystem = function() {
    this.id = "AttackSystem";
}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

AttackSystem.getOutcomeState = function(gameContext, damage, target, attackerIDs) {
    const healthComponent = target.getComponent(HealthComponent);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder === 0) {
        const isBulldozed = AttackSystem.getBulldozed(gameContext, target, attackerIDs);
        const isReviveable = DecaySystem.isReviveable(target);

        if(isReviveable && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

AttackSystem.getUniqueEntitiesInRangeOfEntity = function(gameContext, entity, range = 0) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();
    const entities = new Set();

    if(!activeMap) {
        return entities;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + entity.config.dimX + range;
    const endY = positionComponent.tileY + entity.config.dimY + range;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = activeMap.getTopEntity(j, i);

            if(entityID) {
                entities.add(entityID);
            }
        }
    }

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
        const alliance = AllianceSystem.getAlliance(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(hasRange && (alliance && alliance.isEnemy)) {
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
        const alliance = AllianceSystem.getAlliance(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(hasRange && (alliance && alliance.isEnemy)) {
            return true;
        }
    });

    return attackers;
}

AttackSystem.findAttackersInMaxRange = function(gameContext, target, onCheck) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attackers = [];
    const healthComponent = target.getComponent(HealthComponent);

    if(!healthComponent.isAlive()) {
        return attackers;
    }

    const settings = world.getConfig("Settings");
    const nearbyEntities = AttackSystem.getUniqueEntitiesInRangeOfEntity(gameContext, target, settings.maxAttackRange);

    for(const attackerID of nearbyEntities) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        if(onCheck(attacker)) {
            attackers.push(attackerID);
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