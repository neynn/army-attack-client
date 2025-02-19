import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { getRandomOffset } from "../../source/math/math.js";
import { CAMERA_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const AnimationSystem = function() {}

AnimationSystem.FIRE_OFFSET = {
    ARTILLERY: 48,
    REGULAR: 12
};

AnimationSystem.SPRITE_ID = {
    MOVE: "MOVE_CURSOR",
    DELAY: "DELAY_SPRITE"
};

AnimationSystem.SPRITE_TYPE = {
    SELECT: "cursor_move_1x1",
    DELAY: "icon_delay"
};

AnimationSystem.revertToIdle = function(gameContext, entityIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(const entityID of entityIDs) {
        const entity = entityManager.getEntity(entityID);
        
        if(entity) {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

AnimationSystem.playDeath = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.DEATH);
    const deathAnimation = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);

    deathAnimation.expire();
    deathAnimation.setPosition(positionComponent.positionX, positionComponent.positionY);
    
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
}

AnimationSystem.playFire = function(gameContext, target, attackersIDs) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const spriteComponent = target.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);

    for(const attackerID of attackersIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const unitSizeComponent = attacker.getComponent(ArmyEntity.COMPONENT.UNIT_SIZE);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const weaponSpriteID = weaponSprite.getID();
        const { x, y } = getRandomOffset(AnimationSystem.FIRE_OFFSET.REGULAR, AnimationSystem.FIRE_OFFSET.REGULAR);

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.FIRE, ArmyEntity.SPRITE_TYPE.FIRE_UP);
        attacker.playSound(gameContext, ArmyEntity.SOUND_TYPE.FIRE);
        entitySprite.addChild(weaponSprite, weaponSpriteID);
        weaponSprite.updatePosition(x, y);
        weaponSprite.expire();

        if(unitSizeComponent && unitSizeComponent.artillery) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const artillerySpriteID = artillerySprite.getID();
            const { x, y } = getRandomOffset(AnimationSystem.FIRE_OFFSET.ARTILLERY, AnimationSystem.FIRE_OFFSET.ARTILLERY);

            entitySprite.addChild(artillerySprite, artillerySpriteID);
            artillerySprite.updatePosition(x, y);
            artillerySprite.flip();
            artillerySprite.expire();
        }
    }
}

AnimationSystem.playSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const moveSprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.SELECT);
    
    entitySprite.addChild(moveSprite, AnimationSystem.SPRITE_ID.MOVE);

    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.SELECT);
}

AnimationSystem.stopSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const moveSprite = entitySprite.getChild(AnimationSystem.SPRITE_ID.MOVE);

    if(moveSprite) {
        const spriteID = moveSprite.getID();

        spriteManager.destroySprite(spriteID);
    }
}

AnimationSystem.playConstruction = function(gameContext, entity) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);
    const { x, y } = camera.transformSizeToPositionOffsetCenter(entity.config.dimX, entity.config.dimY);

    entitySprite.addChild(delaySprite, AnimationSystem.SPRITE_ID.DELAY);
    delaySprite.expire();
    delaySprite.setPosition(x, y);

    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.BUILD);
}

AnimationSystem.setConstructionFrame = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const frame = constructionComponent.getFrame();
    
    sprite.setFrame(frame);
}