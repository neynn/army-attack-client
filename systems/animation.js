import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";
import { UnitTypeComponent } from "../components/unitType.js";
import { positionSizeOffsetCenter } from "../source/camera/helpers.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";

export const AnimationSystem = function() {}

AnimationSystem.CONSTRUCTION_FRAMES = [0, 0, 1, 1, 2];

AnimationSystem.revertToIdle = function(gameContext, entityIDs) {
    const { entityManager } = gameContext;
    
    for(const entityID of entityIDs) {
        const entity = entityManager.getEntity(entityID);
        
        MorphSystem.toIdle(entity);
    }
}

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

        if(unitTypeComponent && unitTypeComponent.artillery) {
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

AnimationSystem.playConstruction = function(gameContext, entity) {
    const { client, spriteManager } = gameContext;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const delaySprite = spriteManager.createSprite("icon_delay");
    const { x, y } = positionSizeOffsetCenter(entity.config.dimX, entity.config.dimY);

    entitySprite.addChild(delaySprite, "DELAY_SPRITE");
    soundPlayer.playRandom(["sound_building_construction"]);
    delaySprite.expire();
    delaySprite.setPosition(x, y);
}

AnimationSystem.advanceConstructionFrame = function(gameContext, entity, stepsCompleted) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const frame = AnimationSystem.CONSTRUCTION_FRAMES[stepsCompleted];
    
    sprite.setFrame(frame);
}