import { SwapSet } from "../../../source/util/swapSet.js";
import { PlayCamera } from "../../camera/playCamera.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { PlayerCursor } from "./playerCursor.js";

export const AttackVisualizer = function() {
    this.attackers = new SwapSet();
    this.isEnabled = true;
}

AttackVisualizer.prototype.resetAttackerSprite = function(gameContext, attackerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(attacker) {
        attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

AttackVisualizer.prototype.resetAttackers = function(gameContext, camera) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const attackerID of this.attackers.previous) {
        const attacker = entityManager.getEntity(attackerID);

        if(attacker && attacker.isAlive()) {
            attacker.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }

    camera.clearOverlay(PlayCamera.OVERLAY.ATTACK);
}

AttackVisualizer.prototype.updateAttackerOverlay = function(attackers, camera, overlayID) {
    camera.clearOverlay(PlayCamera.OVERLAY.ATTACK);

    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];

        camera.pushOverlay(PlayCamera.OVERLAY.ATTACK, overlayID, attacker.tileX, attacker.tileY);
    }
}

AttackVisualizer.prototype.updateAttackerSprites = function(gameContext, target, attackers) {
    for(let i = 0; i < attackers.length; i++) {
        const attacker = attackers[i];

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.AIM, ArmyEntity.SPRITE_TYPE.AIM_UP);
    }
}

AttackVisualizer.prototype.updateAttackers = function(gameContext, player) {
    const { tileManager } = gameContext;
    const { hover, camera } = player;

    this.attackers.swap();

    if(hover.state !== PlayerCursor.STATE.HOVER_ON_ENTITY) {
        this.resetAttackers(gameContext, camera);
        return;
    }

    const mouseEntity = hover.getEntity(gameContext);
    const activeAttackers = mouseEntity.getActiveAttackers(gameContext, player.getID());

    if(activeAttackers.length === 0) {
        this.resetAttackers(gameContext, camera);
        return;
    }

    for(let i = 0; i < activeAttackers.length; i++) {
        const attackerID = activeAttackers[i].getID();

        this.attackers.addCurrent(attackerID);
    }

    for(const attackerID of this.attackers.previous) {
        const isAttacking = this.attackers.isCurrent(attackerID);

        if(!isAttacking) {
            this.resetAttackerSprite(gameContext, attackerID);
        }
    }

    const overlayID = tileManager.getTileIDByArray(player.config.overlays.attack);

    this.updateAttackerOverlay(activeAttackers, camera, overlayID);
    this.updateAttackerSprites(gameContext, mouseEntity, activeAttackers);
}

AttackVisualizer.prototype.update = function(gameContext, player) {
    if(this.isEnabled) {
        const { world } = gameContext;
        const { actionQueue } = world;
        const isShowable = !actionQueue.isRunning() && player.inputQueue.isEmpty();

        if(isShowable) {
            this.updateAttackers(gameContext, player); 
        } else {
            player.camera.clearOverlay(PlayCamera.OVERLAY.ATTACK);
        }
    }
}

AttackVisualizer.prototype.enable = function() {
    if(!this.isEnabled) {
        this.isEnabled = true;
    }
}

AttackVisualizer.prototype.disable = function(gameContext, camera) {
    if(this.isEnabled) {
        this.isEnabled = false;
        this.resetAttackers(gameContext, camera);
    }
}