import { isRectangleRectangleIntersect } from "../../source/math/math.js";

import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { PositionComponent } from "../components/position.js";
import { UnitBusterComponent } from "../components/unitBuster.js";
import { UnitSizeComponent } from "../components/unitSize.js";
import { HealthSystem } from "./health.js";
import { TeamSystem } from "./team.js";

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

            if(entityID && !entities.has(entityID)) {
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

    if(!HealthSystem.isAlive(target)) {
        return attackers;
    }

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

        const isAlive = HealthSystem.isAlive(attacker);
        const isAttackable = TeamSystem.isEntityAttackable(gameContext, attacker, target);
        const hasRange = AttackSystem.isTargetInRange(target, attacker, attackComponent.range);

        if(isAlive && isAttackable && hasRange) {
            attackers.push(attackerID);
        }
    }

    return attackers;
}

AttackSystem.getDamage = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;

    let totalDamage = 0;
    let armor = 0;

    const armorComponent = target.getComponent(ArmorComponent);
    const unitSizeComponent = target.getComponent(UnitSizeComponent);

    if(armorComponent) {
        armor = armorComponent.armor;
    }

    for(const attackerID of attackerIDs) {
        let damage = 0;

        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(AttackComponent);

        if(unitSizeComponent) {
            const unitBusterComponent = attacker.getComponent(UnitBusterComponent);

            if(unitBusterComponent) {
                for(const unitType in unitBusterComponent) {
                    if(unitSizeComponent[unitType]) {
                        damage += unitBusterComponent[unitType];
                    }
                }
            }
        }

        damage += attackComponent.damage - armor;

        if(damage > 0) {
            totalDamage += damage;
        }
    }

    return totalDamage;
}

AttackSystem.isBulldozed = function(gameContext, target, attackerIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    const requiredFlag = BulldozeComponent.ARCHETYPE_BULLDOZE_MAP[target.config.archetype];

    if(!requiredFlag) {
        return false;
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const bulldozeComponent = attacker.getComponent(BulldozeComponent);

        if(bulldozeComponent && bulldozeComponent[requiredFlag]) {
            return true;
        }
    }

    return false;
}