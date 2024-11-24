import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { ENTITY_ARCHETYPES } from "../enums.js";
import { MorphSystem } from "./morph.js";

export const AttackSystem = function() {}

AttackSystem.getDamage = function(gameContext, target, attackerIDs) {
    const { entityManager } = gameContext;

    let totalDamage = 0;
    let armor = 0;

    const armorComponent = target.getComponent(ArmorComponent);

    if(armorComponent) {
        armor = armorComponent.armor;
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(AttackComponent);
        const damage = attackComponent.damage - armor;

        if(damage > 0) {
            totalDamage += damage;
        }
    }

    return totalDamage;
}

AttackSystem.getFatalHit = function(gameContext, target, attackerIDs) {
    const { entityManager } = gameContext;
    const killableArchetypes = {
        [ENTITY_ARCHETYPES.UNIT]: "destroyUnit",
        [ENTITY_ARCHETYPES.DECO]: "destroyDeco",
        [ENTITY_ARCHETYPES.BUILDING]: "destroyBuilding"
    };
    const archetype = target.config.archetype;
    const requiredFlag = killableArchetypes[archetype];

    if(!requiredFlag) {
        return false;
    }

    for(const attackerID of attackerIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const bulldozeComponent = attacker.getComponent(BulldozeComponent);

        if(!bulldozeComponent) {
            continue;
        }

        if(bulldozeComponent[requiredFlag]) {
            return true;
        }
    }

    return false;
}

AttackSystem.stopAttack = function(gameContext, attackers) {
    const { entityManager } = gameContext;
    
    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        
        MorphSystem.toIdle(attacker);
    }
}