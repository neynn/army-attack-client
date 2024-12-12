import { isRectangleRectangleIntersect } from "../../source/math/math.js";

import { AttackComponent } from "../components/attack.js";
import { PositionComponent } from "../components/position.js";
import { HealthSystem } from "./health.js";
import { TeamSystem } from "./team.js";

export const TargetSystem = function() {}

TargetSystem.isTargetable = function(entity) {
    const isAlive = HealthSystem.isAlive(entity);

    return isAlive;
}

TargetSystem.getUniqueEntitiesInRangeOfEntity = function(gameContext, entity, range = 0, exclusionList = []) {
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

    for(const entityID of exclusionList) {
        entities.delete(entityID);
    }

    return entities;
}

TargetSystem.getAttackers = function(gameContext, target) {
    const { world } = gameContext;
    const { entityManager } = world;

    if(!TargetSystem.isTargetable(target)) {
        return [];
    }

    const attackers = [];
    const targetID = target.getID();
    const settings = world.getConfig("settings");
    const possibleAttackerIDs = TargetSystem.getUniqueEntitiesInRangeOfEntity(gameContext, target, settings.maxAttackRange, [targetID]);

    for(const attackerID of possibleAttackerIDs) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const isAlive = HealthSystem.isAlive(attacker);
        const isEnemy = TeamSystem.isEntityEnemy(gameContext, attacker, target);
        const hasRange = TargetSystem.hasRange(target, attacker);

        if(isAlive && isEnemy && hasRange) {
            attackers.push(attackerID);
        }
    }

    return attackers;
}

TargetSystem.hasRange = function(target, attacker) {
    const attackComponent = attacker.getComponent(AttackComponent);

    if(!attackComponent) {
        return false;
    }

    const attackerPosition = attacker.getComponent(PositionComponent);
    const targetPosition = target.getComponent(PositionComponent);

    const collision = isRectangleRectangleIntersect(
        attackerPosition.tileX - attackComponent.range,
        attackerPosition.tileY - attackComponent.range,
        attacker.config.dimX - 1 + attackComponent.range * 2,
        attacker.config.dimY - 1 + attackComponent.range * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );

    return collision;
}