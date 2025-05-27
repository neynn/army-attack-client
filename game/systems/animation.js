import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { SpriteComponent } from "../components/sprite.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { LookSystem } from "./look.js";

export const AnimationSystem = function() {}

AnimationSystem.FIRE_OFFSET = {
    ARTILLERY: 48,
    REGULAR: 12
};

AnimationSystem.SOUND_TYPE = {
    HEAL: "sound_unit_repair",
    BUTTON: "sound_button_press"
};

AnimationSystem.SPRITE_TYPE = {
    SELECT: "cursor_move_1x1",
    DELAY: "icon_delay"
};

AnimationSystem.playIdle = function(gameContext, entities) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

AnimationSystem.playDeath = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.DEATH);
    const deathAnimation = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);
    const positionX = positionComponent.positionX + x;
    const positionY = positionComponent.positionY + y;

    deathAnimation.setPosition(positionX, positionY);
    deathAnimation.expire();
  
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
}

AnimationSystem.playFire = function(gameContext, targetObject, attackers) {
    const { world, spriteManager, transform2D } = gameContext;
    const { entityManager } = world;
    const { id } = targetObject;
    const target = entityManager.getEntity(id);
    const spriteComponent = target.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);

    for(let i = 0; i < attackers.length; i++) {
        const attackerID = attackers[i];
        const attacker = entityManager.getEntity(attackerID);
        const unitComponent = attacker.getComponent(ArmyEntity.COMPONENT.UNIT);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.REGULAR, AnimationSystem.FIRE_OFFSET.REGULAR);

        LookSystem.lookAtEntity(attacker, target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.FIRE, ArmyEntity.SPRITE_TYPE.FIRE_UP);
        attacker.playSound(gameContext, ArmyEntity.SOUND_TYPE.FIRE);
        entitySprite.addChild(weaponSprite);
        weaponSprite.setPosition(x, y);
        weaponSprite.expire();

        if(unitComponent && unitComponent.isArtillery()) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.ARTILLERY, AnimationSystem.FIRE_OFFSET.ARTILLERY);

            entitySprite.addChild(artillerySprite);
            artillerySprite.setPosition(x, y);
            artillerySprite.flip();
            artillerySprite.expire();
        }
    }
}

AnimationSystem.playSell = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.SELECT);
    
    entitySprite.addChild(moveSprite, SpriteComponent.SPRITE_ID.SELL);
    moveSprite.setPosition(0, 0);
}

AnimationSystem.stopSell = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const sellSprite = entitySprite.getChild(SpriteComponent.SPRITE_ID.SELL);

    if(sellSprite) {
        sellSprite.terminate();
    }
}

AnimationSystem.playSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.SELECT);
    
    entitySprite.addChild(moveSprite, SpriteComponent.SPRITE_ID.MOVE);
    moveSprite.setPosition(0, 0);
    
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.SELECT);
}

AnimationSystem.stopSelect = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = entitySprite.getChild(SpriteComponent.SPRITE_ID.MOVE);

    if(moveSprite) {
        moveSprite.terminate();
    }
}

AnimationSystem.playCleaning = function(gameContext, tileX, tileY) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    delaySprite.expire();
    delaySprite.setPosition(x, y);

    soundPlayer.playSound(AnimationSystem.SOUND_TYPE.BUTTON);
}

AnimationSystem.playHeal = function(gameContext, entity) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

    entitySprite.addChild(delaySprite);
    delaySprite.expire();
    delaySprite.setPosition(x, y);

    soundPlayer.playSound(AnimationSystem.SOUND_TYPE.HEAL);
}

AnimationSystem.playConstruction = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);
    const { x, y } = transform2D.transformSizeToWorldOffsetCenter(entity.config.dimX, entity.config.dimY);

    entitySprite.addChild(delaySprite);
    delaySprite.expire();
    delaySprite.setPosition(x, y);

    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.BUILD);
}

AnimationSystem.setConstructionFrame = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);
    const sprite = spriteComponent.getSprite(gameContext);
    const frame = constructionComponent.getFrame();
    
    sprite.setFrame(frame);
}