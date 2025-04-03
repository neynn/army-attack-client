import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { SpriteComponent } from "../components/sprite.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { Player } from "../player/player.js";

export const AnimationSystem = function() {}

AnimationSystem.FIRE_OFFSET = {
    ARTILLERY: 48,
    REGULAR: 12
};

AnimationSystem.SPRITE_TYPE = {
    SELECT: "cursor_move_1x1",
    DELAY: "icon_delay"
};

const getRandomOffset = function(camera, sizeX, sizeY, maxOffsetX, maxOffsetY) {
    const offsetX = (Math.random() * 2 - 1) * maxOffsetX;
    const offsetY = (Math.random() * 2 - 1) * maxOffsetY;
    const randomX = Math.floor(Math.random() * sizeX);
    const randomY = Math.floor(Math.random() * sizeY);
    const { x, y } = camera.transformTileToPosition(randomX, randomY);

    return {
        "x": x + offsetX,
        "y": y + offsetY
    }
}

AnimationSystem.revertToIdle = function(gameContext, entityIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(let i = 0; i < entityIDs.length; i++) {
        const entityID = entityIDs[i];
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
        }
    }
}

AnimationSystem.playDeath = function(gameContext, entity) {
    const { spriteManager, renderer } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.DEATH);
    const deathAnimation = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const { x, y } = camera.transformSizeToPositionOffsetCenter(entity.config.dimX, entity.config.dimY);
    const positionX = positionComponent.positionX + x;
    const positionY = positionComponent.positionY + y;

    deathAnimation.setPosition(positionX, positionY);
    deathAnimation.expire();
  
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
}

AnimationSystem.playFire = function(gameContext, target, attackers) {
    const { world, spriteManager, renderer } = gameContext;
    const { entityManager } = world;
    const spriteComponent = target.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();

    for(let i = 0; i < attackers.length; i++) {
        const attackerID = attackers[i];
        const attacker = entityManager.getEntity(attackerID);
        const unitSizeComponent = attacker.getComponent(ArmyEntity.COMPONENT.UNIT_SIZE);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const { x, y } = getRandomOffset(camera, target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.REGULAR, AnimationSystem.FIRE_OFFSET.REGULAR);

        attacker.lookAtEntity(target);
        attacker.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.FIRE, ArmyEntity.SPRITE_TYPE.FIRE_UP);
        attacker.playSound(gameContext, ArmyEntity.SOUND_TYPE.FIRE);
        entitySprite.addChild(weaponSprite);
        weaponSprite.setPosition(x, y);
        weaponSprite.expire();

        if(unitSizeComponent && unitSizeComponent.isArtillery()) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const { x, y } = getRandomOffset(camera, target.config.dimX, target.config.dimY, AnimationSystem.FIRE_OFFSET.ARTILLERY, AnimationSystem.FIRE_OFFSET.ARTILLERY);

            entitySprite.addChild(artillerySprite);
            artillerySprite.setPosition(x, y);
            artillerySprite.flip();
            artillerySprite.expire();
        }
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
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const moveSprite = entitySprite.getChild(SpriteComponent.SPRITE_ID.MOVE);

    if(moveSprite) {
        const spriteIndex = moveSprite.getIndex();

        spriteManager.destroySprite(spriteIndex);
    }
}

AnimationSystem.playConstruction = function(gameContext, entity) {
    const { spriteManager, renderer } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entitySprite = spriteComponent.getSprite(gameContext);
    const delaySprite = spriteManager.createSprite(AnimationSystem.SPRITE_TYPE.DELAY);
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const { x, y } = camera.transformSizeToPositionOffsetCenter(entity.config.dimX, entity.config.dimY);

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