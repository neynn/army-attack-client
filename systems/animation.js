import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";
import { UnitTypeComponent } from "../components/unitType.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";

export const AnimationSystem = function() {}

AnimationSystem.playDeath = function(gameContext, entity) {
    const { spriteManager, client } = gameContext;
    const { soundPlayer } = client;
    const positionComponent = entity.getComponent(PositionComponent);
    const deathAnimation = spriteManager.createSprite(entity.config.sprites.death, SpriteManager.LAYER_MIDDLE);

    deathAnimation.expire();
    deathAnimation.setPosition(positionComponent.positionX, positionComponent.positionY);
    soundPlayer.playRandom(entity.config.sounds.death);
}

AnimationSystem.playFire = function(gameContext, entity, attackersIDs) {
    const { entityManager, client, spriteManager } = gameContext;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);

    for(const attackerID of attackersIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const unitTypeComponent = attacker.getComponent(UnitTypeComponent);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const weaponSpriteID = weaponSprite.getID();

        DirectionSystem.lookAt(attacker, entity);
        MorphSystem.toFire(attacker);
        soundPlayer.playRandom(attacker.config.sounds.fire);
        entitySprite.addChild(weaponSprite, weaponSpriteID);
        weaponSprite.expire();

        if(unitTypeComponent && unitTypeComponent.isArtillery) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const artillerySpriteID = artillerySprite.getID();

            entitySprite.addChild(artillerySprite, artillerySpriteID);
            artillerySprite.flip();
            artillerySprite.expire();
        }
    }
}

AnimationSystem.playSelect = function(gameContext, entity) {
    const { client, spriteManager } = gameContext;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const moveSprite = spriteManager.createSprite("cursor_move_1x1");
    
    entitySprite.addChild(moveSprite, "MOVE_CURSOR");
    soundPlayer.playRandom(entity.config.sounds.select);
}

AnimationSystem.stopSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const moveSpriteID = entitySprite.getChildID("MOVE_CURSOR");

    spriteManager.destroySprite(moveSpriteID);
}