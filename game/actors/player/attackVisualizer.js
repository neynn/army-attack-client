import { ArmyCamera } from "../../armyCamera.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { AttackSystem } from "../../systems/attack.js";
import { LookSystem } from "../../systems/look.js";
import { PlayerCursor } from "./playerCursor.js";

export const AttackVisualizer = function(camera) {
    this.camera = camera;
    this.attackers = new Set();
}

AttackVisualizer.prototype.hasAnyAttacker = function() {
    return this.attackers.size > 0;
}

AttackVisualizer.prototype.clearAttackers = function() {
    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.attackers.clear();
}

AttackVisualizer.prototype.resetAttackerSprite = function(gameContext, attackerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(attacker) {
        attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

AttackVisualizer.prototype.resetAttackers = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const attackerID of this.attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(attacker) {
            attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }

    this.clearAttackers();
}

AttackVisualizer.prototype.updateAttackerOverlay = function(attackers, overlayID) {
    this.camera.clearOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];
        const { tileX, tileY } = attacker.getComponent(ArmyEntity.COMPONENT.POSITION);

        this.camera.pushOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK, overlayID, tileX, tileY);
    }
}

AttackVisualizer.prototype.updateAttackerSprites = function(gameContext, target, attackers) {
    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];

        LookSystem.lookAtEntity(attacker, target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);
    }
}

AttackVisualizer.prototype.updateAttackers = function(gameContext, player) {
    const { tileManager } = gameContext;
    const { hover, id } = player;

    if(hover.state !== PlayerCursor.STATE.HOVER_ON_ENTITY) {
        this.resetAttackers(gameContext);
        return;
    }

    const mouseEntity = hover.getEntity(gameContext);
    const activeAttackers = AttackSystem.getActiveAttackers(gameContext, mouseEntity, id);

    if(activeAttackers.length === 0) {
        this.resetAttackers(gameContext);
        return;
    }

    const currentAttackers = new Set();
    const overlayID = tileManager.getTileIDByArray(player.config.overlays.attack);

    for(let i = 0; i < activeAttackers.length; i++) {
        const attacker = activeAttackers[i];
        const attackerID = attacker.getID();

        currentAttackers.add(attackerID);
    }

    for(const attackerID of this.attackers) {
        const isAttacking = currentAttackers.has(attackerID);

        if(!isAttacking) {
            this.resetAttackerSprite(gameContext, attackerID);
        }
    }

    this.attackers = currentAttackers;
    this.updateAttackerOverlay(activeAttackers, overlayID);
    this.updateAttackerSprites(gameContext, mouseEntity, activeAttackers);
}