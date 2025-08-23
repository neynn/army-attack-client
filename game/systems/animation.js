import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { ArmyContext } from "../armyContext.js";
import { UI_SONUD } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { LookSystem } from "./look.js";

/**
 * Collection of functions revolving around the animations.
 */
export const AnimationSystem = function() {}

AnimationSystem.SPRITE_ID = {
    MOVE: 0,
    CARD: 1,
    SELL: 2
};

AnimationSystem.FIRE_OFFSET = {
    ARTILLERY: 48,
    REGULAR: 12
};

AnimationSystem.SPRITE_TYPE = {
    SELECT: "cursor_move_1x1",
    DELAY: "icon_delay"
};

/**
 * Plays the idle animation of a list of entities.
 * 
 * @param {ArmyContext} gameContext 
 * @param {int[]} entityIDList 
 */
AnimationSystem.playIdle = function(gameContext, entityIDList) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(const entityID of entityIDList) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

/**
 * Plays the death animation for an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
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

/**
 * Plays the fire animation for attackers. The weapon animation is added as a child to the target.
 * 
 * @param {ArmyContext} gameContext 
 * @param {TargetObject} targetObject 
 * @param {int[]} attackerIDList 
 */
AnimationSystem.playFire = function(gameContext, targetObject, attackerIDList) {
    const { world, spriteManager, transform2D } = gameContext;
    const { entityManager } = world;
    const { id } = targetObject;
    const target = entityManager.getEntity(id);
    const spriteComponent = target.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);

    for(let i = 0; i < attackerIDList.length; i++) {
        const attacker = entityManager.getEntity(attackerIDList[i]);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.REGULAR, AnimationSystem.FIRE_OFFSET.REGULAR);

        LookSystem.lookAtEntity(attacker, target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.FIRE, ArmyEntity.SPRITE_TYPE.FIRE_UP);
        attacker.playSound(gameContext, ArmyEntity.SOUND_TYPE.FIRE);
        entitySprite.addChild(weaponSprite);
        weaponSprite.setPosition(x, y);
        weaponSprite.expire();

        if(attacker.config.cost && attacker.config.cost.artillery !== 0) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const { x, y } = transform2D.transformSizeToRandomOffset(target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.ARTILLERY, AnimationSystem.FIRE_OFFSET.ARTILLERY);

            entitySprite.addChild(artillerySprite);
            artillerySprite.setPosition(x, y);
            artillerySprite.flip();
            artillerySprite.expire();
        }
    }
}

/**
 * Plays the sell animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
AnimationSystem.playSell = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const spriteType = `cursor_move_${entity.config.dimX}x${entity.config.dimY}`;
    const moveSprite = spriteManager.createSprite(spriteType);
    
    entitySprite.addChild(moveSprite, AnimationSystem.SPRITE_ID.SELL);
    moveSprite.setPosition(0, 0);
}

/**
 * Stops the sell animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
AnimationSystem.stopSell = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);

    if(entitySprite) {
        const sellSprite = entitySprite.getChild(AnimationSystem.SPRITE_ID.SELL);

        if(sellSprite) {
            sellSprite.terminate();
        }
    }
}

/**
 * Plays the select animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
AnimationSystem.playSelect = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.SELECT);
    
    entitySprite.addChild(moveSprite, AnimationSystem.SPRITE_ID.MOVE);
    moveSprite.setPosition(0, 0);
    
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.SELECT);
}

/**
 * Stops the select animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
AnimationSystem.stopSelect = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = entitySprite.getChild(AnimationSystem.SPRITE_ID.MOVE);

    if(moveSprite) {
        moveSprite.terminate();
    }
}

/**
 * Plays the cleaning animation at a position.
 * 
 * @param {ArmyContext} gameContext 
 * @param {int} tileX 
 * @param {int} tileY 
 */
AnimationSystem.playCleaning = function(gameContext, tileX, tileY) {
    const { spriteManager, transform2D, client } = gameContext;
    const { soundPlayer } = client;
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    delaySprite.expire();
    delaySprite.setPosition(x, y);

    soundPlayer.playSound(UI_SONUD.BUTTON);
}

/**
 * Plays the heal animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
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

    soundPlayer.playSound(UI_SONUD.HEAL);
}

/**
 * Plays the construction animation of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
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

/**
 * Sets the current frame of the construction sprite of an entity.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
AnimationSystem.setConstructionFrame = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const constructionComponent = entity.getComponent(ArmyEntity.COMPONENT.CONSTRUCTION);
    const sprite = spriteComponent.getSprite(gameContext);
    const frame = constructionComponent.getFrame();
    
    sprite.setFrame(frame);
}