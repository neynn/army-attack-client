import { AttackComponent } from "../components/attack.js";
import { PositionComponent } from "../components/position.js";
import { SizeComponent } from "../components/size.js";
import { isRectangleRectangleIntersect } from "../source/math/math.js";
import { HealthSystem } from "./health.js";
import { TeamSystem } from "./team.js";

export const TargetSystem = function() {}

TargetSystem.isTargetable = function(entity) {
    const isAlive = HealthSystem.isAlive(entity);
    //TODO add methods for hiding targetability.
    return isAlive;
}

TargetSystem.getUniqueEntitiesInRangeOfEntity = function(gameContext, entity, range, excludeSelf) {
    const { mapLoader } = gameContext;
    const entities = new Set();
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return entities;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const sizeComponent = entity.getComponent(SizeComponent);
    const startX = positionComponent.tileX - range;
    const startY = positionComponent.tileY - range;
    const endX = positionComponent.tileX + sizeComponent.sizeX + range;
    const endY = positionComponent.tileY + sizeComponent.sizeY + range;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = activeMap.getTileEntity(j, i);

            if(entityID && !entities.has(entityID)) {
                entities.add(entityID);
            }
        }
    }

    if(excludeSelf) {
        entities.delete(entity.id);
    }

    return entities;
}

TargetSystem.getAttackers = function(gameContext, target) {
    const { entityManager } = gameContext;
    const attackerIDs = [];

    if(!TargetSystem.isTargetable(target)) {
        return attackerIDs;
    }

    const settings = gameContext.getConfig("settings");
    const maxRange = settings.maxAttackRange;
    const possibleAttackerIDs = TargetSystem.getUniqueEntitiesInRangeOfEntity(gameContext, target, maxRange, true);

    for(const attackerID of possibleAttackerIDs) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const canTarget = TargetSystem.canAttackerTarget(gameContext, attacker, target);

        if(canTarget) {
            attackerIDs.push(attackerID);
        }
    }

    return attackerIDs;
}

TargetSystem.canAttackerTarget = function(gameContext, attacker, target) {
    const attackComponent = attacker.getComponent(AttackComponent);

    if(!attackComponent) {
        return false;
    }

    const isAlive = HealthSystem.isAlive(attacker);

    if(!isAlive) {
        return false;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, attacker, target);

    if(!isEnemy) {
        return false;
    }

    const attackerPosition = attacker.getComponent(PositionComponent);
    const attackerSize = attacker.getComponent(SizeComponent);
    const targetPosition = target.getComponent(PositionComponent);
    const targetSize = target.getComponent(SizeComponent);
    const attackerRange = attackComponent.range;

    const collision = isRectangleRectangleIntersect(
        attackerPosition.tileX - attackerRange,
        attackerPosition.tileY - attackerRange,
        attackerSize.sizeX - 1 + attackerRange * 2,
        attackerSize.sizeY - 1 + attackerRange * 2,
        targetPosition.tileX,
        targetPosition.tileY,
        targetSize.sizeX - 1,
        targetSize.sizeY - 1
    );

    return collision;
}