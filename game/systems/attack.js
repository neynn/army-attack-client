import { isRectangleRectangleIntersect } from "../../source/math/math.js";
import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AllianceSystem } from "./alliance.js";
import { AnimationSystem } from "./animation.js";
import { DecaySystem } from "./decay.js";

export const AttackSystem = function() {}

AttackSystem.OUTCOME_STATE = {
    IDLE: 0,
    DOWN: 1,
    DEAD: 2
};

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

const filterAliveEntitiesInMaxRange = function(gameContext, entity, onCheck) {
    if(!entity.isAlive()) {
        return [];
    }

    const validEntities = [];
    const nearbyEntities = getSurroundingEntities(gameContext, entity, gameContext.settings.maxAttackRange);

    for(let i = 0; i < nearbyEntities.length; i++) {
        const nearbyEntity = nearbyEntities[i];

        if(nearbyEntity.isAlive() && onCheck(nearbyEntity)) {
            validEntities.push(nearbyEntity);
        }
    }

    return validEntities;
}

AttackSystem.getState = function(target, damage, isBulldozed) {
    const healthComponent = target.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder <= 0) {
        const isReviveable = target.hasComponent(ArmyEntity.COMPONENT.REVIVEABLE);

        if(isReviveable && !isBulldozed) {
            return AttackSystem.OUTCOME_STATE.DOWN;
        }

        return AttackSystem.OUTCOME_STATE.DEAD;
    }

    return AttackSystem.OUTCOME_STATE.IDLE;
}

AttackSystem.updateTarget = function(gameContext, targetObject) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { id, damage, state } = targetObject;
    const entity = entityManager.getEntity(id);

    entity.reduceHealth(damage);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DOWN: {
            DecaySystem.beginDecay(gameContext, entity);
            break;
        }
        default: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
            break;
        }
    }
}

AttackSystem.endAttack = function(gameContext, target) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;
    const { id, state, damage } = target;
    const entity = entityManager.getEntity(id);

    switch(state) {
        case AttackSystem.OUTCOME_STATE.DEAD: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

            eventBus.emit(GameEvent.TYPE.ENTITY_KILL, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "target": entity,
                "damage": damage
            });
            break;
        }
        case AttackSystem.OUTCOME_STATE.IDLE: {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

            eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "target": entity,
                "damage": damage
            });
            break;
        }
        case AttackSystem.OUTCOME_STATE.DOWN: {
            eventBus.emit(GameEvent.TYPE.ENTITY_DOWN, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "target": entity,
                "damage": damage
            });

            eventBus.emit(GameEvent.TYPE.ENTITY_HIT, { 
                "reason": GameEvent.KILL_REASON.ATTACK,
                "target": entity,
                "damage": damage
            });
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
        return null;
    }

    const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
    const targets = filterAliveEntitiesInMaxRange(gameContext, attacker, (target) => {
        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });
    
    if(targets.length === 0) {
        return null;
    }

    return targets;
}

AttackSystem.getMoveCounterAttackers = function(gameContext, target) {
    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isMoveCounterable()) {
            return false;
        }

        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    if(attackers.length === 0) {
        return null;
    }

    return attackers;
}

AttackSystem.getActiveAttackers = function(gameContext, target, actorID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return null;
    }

    const targetTeamComponent = target.getComponent(ArmyEntity.COMPONENT.TEAM);
    const attackers = filterAliveEntitiesInMaxRange(gameContext, target, (attacker) => {
        const attackerID = attacker.getID();

        if(!actor.hasEntity(attackerID)) {
            return false;
        }

        const attackComponent = attacker.getComponent(ArmyEntity.COMPONENT.ATTACK);

        if(!attackComponent || !attackComponent.isActive()) {
            return false;
        }

        const hasRange = hasEnoughRange(attacker, target, attackComponent.range);

        if(!hasRange) {
            return false;
        }

        const attackerTeamComponent = attacker.getComponent(ArmyEntity.COMPONENT.TEAM);
        const isEnemy = AllianceSystem.isEnemy(gameContext, attackerTeamComponent.teamID, targetTeamComponent.teamID);

        return isEnemy;
    });

    if(attackers.length === 0) {
        return null;
    }

    return attackers;
}

AttackSystem.createTargetObject = function(targetID, damage, state) {
    return {
        "id": targetID,
        "damage": damage,
        "state": state
    }
}

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
    const targetObject = AttackSystem.createTargetObject(targetID, totalDamage, targetState);

    return targetObject;
}