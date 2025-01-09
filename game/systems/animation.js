import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { ConstructionComponent } from "../components/construction.js";

import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";
import { UnitSizeComponent } from "../components/unitSize.js";
import { CAMERA_TYPES } from "../enums.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";

export const AnimationSystem = function() {}

AnimationSystem.FIRE_OFFSET_ARTILLERY = 48;
AnimationSystem.FIRE_OFFSET_REGULAR = 12;

AnimationSystem.revertToIdle = function(gameContext, entityIDs) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    for(const entityID of entityIDs) {
        const entity = entityManager.getEntity(entityID);
        
        if(entity) {
            MorphSystem.toIdle(gameContext, entity);
        }
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

AnimationSystem.addRandomOffset = function(fireSprite, maxOffsetX = 0, maxOffsetY = 0) {
    const randomX = Math.random() * 2 - 1;
    const randomY = Math.random() * 2 - 1;

    fireSprite.position.x += randomX * maxOffsetX;
    fireSprite.position.y += randomY * maxOffsetY;
}   

AnimationSystem.playFire = function(gameContext, entity, attackersIDs) {
    const { world, client, spriteManager } = gameContext;
    const { entityManager } = world;
    const { soundPlayer } = client;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);

    for(const attackerID of attackersIDs) {
        const attacker = entityManager.getEntity(attackerID);
        const unitSizeComponent = attacker.getComponent(UnitSizeComponent);
        const weaponSprite = spriteManager.createSprite(attacker.config.sprites.weapon);
        const weaponSpriteID = weaponSprite.getID();

        DirectionSystem.lookAt(attacker, entity);
        MorphSystem.toFire(gameContext, attacker);

        soundPlayer.playRandom(attacker.config.sounds.fire);
        entitySprite.addChild(weaponSprite, weaponSpriteID);
        weaponSprite.expire();
        AnimationSystem.addRandomOffset(weaponSprite, AnimationSystem.FIRE_OFFSET_REGULAR, AnimationSystem.FIRE_OFFSET_REGULAR);

        if(unitSizeComponent && unitSizeComponent.artillery) {
            const artillerySprite = spriteManager.createSprite(attacker.config.sprites.weapon);
            const artillerySpriteID = artillerySprite.getID();

            entitySprite.addChild(artillerySprite, artillerySpriteID);
            artillerySprite.flip();
            artillerySprite.expire();
            AnimationSystem.addRandomOffset(artillerySprite, AnimationSystem.FIRE_OFFSET_ARTILLERY, AnimationSystem.FIRE_OFFSET_ARTILLERY);
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
    const { client, spriteManager, renderer } = gameContext;
    const { soundPlayer } = client;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const spriteComponent = entity.getComponent(SpriteComponent);
    const entitySprite = spriteManager.getSprite(spriteComponent.spriteID);
    const delaySprite = spriteManager.createSprite("icon_delay");
    const { x, y } = camera.transformSizeToPositionOffsetCenter(entity.config.dimX, entity.config.dimY);

    entitySprite.addChild(delaySprite, "DELAY_SPRITE");
    soundPlayer.playRandom(entity.config.sounds.build);
    delaySprite.expire();
    delaySprite.setPosition(x, y);
}

AnimationSystem.setConstructionFrame = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(SpriteComponent);
    const constructionComponent = entity.getComponent(ConstructionComponent);

    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const frame = constructionComponent.getFrame();
    
    sprite.setFrame(frame);
}