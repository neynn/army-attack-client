import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { BulldozeComponent } from "../components/bulldoze.js";
import { UnitBusterComponent } from "../components/unitBuster.js";
import { UnitSizeComponent } from "../components/unitSize.js";
import { ENTITY_ARCHETYPES } from "../enums.js";

export const AttackSystem = function() {}

AttackSystem.ARCHETYPE_BULLDOZE_MAP = {
    [ENTITY_ARCHETYPES.UNIT]: "destroyUnit",
    [ENTITY_ARCHETYPES.DECO]: "destroyDeco",
    [ENTITY_ARCHETYPES.BUILDING]: "destroyBuilding"
};

AttackSystem.getDamage = function(gameContext, target, attackerIDs) {
    const { entityManager } = gameContext;

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

AttackSystem.getBulldozed = function(gameContext, target, attackerIDs) {
    const { entityManager } = gameContext;
    const archetype = target.config.archetype;
    const requiredFlag = AttackSystem.ARCHETYPE_BULLDOZE_MAP[archetype];

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