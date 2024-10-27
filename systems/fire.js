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

FireSystem.startAttack = function(gameContext, entity, attackers) {
    const { entityManager, client, spriteManager } = gameContext;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(SpriteComponent);

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);
        
        DirectionSystem.lookAt(attacker, entity);
        MorphSystem.morphDirectional(attacker, "fire", "fire_ne");
        soundPlayer.playRandom(attacker.config.sounds.fire);
        
        spriteManager
        .createChildSprite(spriteComponent.spriteID, attacker.config.sprites.weapon)
        .setLooping(false);
    }

    MorphSystem.updateSprite(entity, "hit");
}

FireSystem.endAttack = function(gameContext, entity, attackers) {
    const { entityManager } = gameContext;
    
    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);

        MorphSystem.updateSprite(attacker, "idle");
    }

    MorphSystem.updateSprite(entity, "idle");
}