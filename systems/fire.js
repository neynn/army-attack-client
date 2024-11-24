import { ArmorComponent } from "../components/armor.js";
import { AttackComponent } from "../components/attack.js";
import { SpriteComponent } from "../components/sprite.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";

export const FireSystem = function() {}

FireSystem.getDamage = function(gameContext, target, attackers) {
    const { entityManager } = gameContext;

    let totalDamage = 0;
    let armor = 0;

    const armorComponent = target.getComponent(ArmorComponent);

    if(armorComponent) {
        armor = armorComponent.armor;
    }

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        const attackComponent = attacker.getComponent(AttackComponent);
        const damage = attackComponent.damage - armor;

        if(damage > 0) {
            totalDamage += damage;
        }
    }

    return totalDamage;
}

FireSystem.getFatalHit = function(gameContext, target, attackers) {

    return false;
}

FireSystem.stopAttack = function(gameContext, attackers) {
    const { entityManager } = gameContext;
    
    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        
        MorphSystem.toIdle(attacker);
    }
}