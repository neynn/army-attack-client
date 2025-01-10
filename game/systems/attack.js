import { isRectangleRectangleIntersect } from "../../source/math/math.js";

import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { HealthComponent } from "../components/health.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";

export const AttackSystem = function() {}

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

AttackSystem.getActiveAttackers = function(gameContext, target) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attackers = [];
    const healthComponent = target.getComponent(HealthComponent);

    if(!healthComponent.isAlive()) {
        return attackers;
    }

    const targetTeamComponent = target.getComponent(TeamComponent);
    const settings = world.getConfig("Settings");
    const nearbyEntities = AttackSystem.getUniqueEntitiesInRangeOfEntity(gameContext, target, settings.maxAttackRange);

    for(const attackerID of nearbyEntities) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const attackComponent = attacker.getComponent(AttackComponent);

        if(!attackComponent || attackComponent.type !== AttackComponent.ATTACK_TYPE_ACTIVE) {
            continue;
        }

        const attackerTeamComponent = attacker.getComponent(TeamComponent);
        const attackerHealthComponent = attacker.getComponent(HealthComponent);
        const alliance = AllianceSystem.getAlliance(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(attackerHealthComponent.isAlive() && hasRange && (alliance && alliance.isEnemy)) {
            attackers.push(attackerID);
        }
    }

    return attackers;
}

AttackSystem.getDamage = function(gameContext, target, attackers) {
    const { world } = gameContext;
    const { entityManager } = world;
    const armorComponent = target.getComponent(ArmorComponent);

    let totalDamage = 0;
    let totalArmor = 0;

    if(armorComponent) {
        totalArmor += armorComponent.getArmor();
    }

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(AttackComponent);
        const damage = attackComponent.getDamage(totalArmor);
    
        totalDamage += damage;
    }

    return totalDamage;
}

AttackSystem.getBulldozed = function(gameContext, target, attackers) {
    const { world } = gameContext;
    const { entityManager } = world;
    const isBulldozeable = BulldozeComponent.isBulldozeable(target.config.archetype);

    if(!isBulldozeable) {
        return false;
    }

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        const bulldozeComponent = attacker.getComponent(BulldozeComponent);

        if(bulldozeComponent && bulldozeComponent.isBulldozed(target.config.archetype)) {
            return true;
        }
    }

    return false;
}