import { ArmyContext } from "../armyContext.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { CardSystem } from "./card.js";
import { MapSystem } from "./map.js";
import { UnitLimitSystem } from "./unitLimit.js";
import { SpriteManager } from "../../source/sprite/spriteManager.js";

const initAttackComponent = function(component, stats) {
    const {
        damage = 0,
        attackRange = 0
    } = stats;

    component.damage = damage;
    component.range = attackRange;
}

const initMoveComponent = function(component, stats) {
    const {
        moveRange = 0,
        moveSpeed = 480
    } = stats;

    component.range = moveRange;
    component.speed = moveSpeed;
}

const setupComponents = function(entity, stats, tileX, tileY, teamID, customHealth) {
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const {
        health = 1,
        maxHealth = health
    } = stats;

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    if(customHealth === undefined) {
        healthComponent.health = health;
    } else {
        healthComponent.health = customHealth;
    }

    healthComponent.maxHealth = maxHealth;

    teamComponent.teamID = teamID;
}

const createSprite = function(gameContext, entity, tileX, tileY) {
    const { spriteManager, transform2D } = gameContext;
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.IDLE);
    const sprite = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.setIndex(sprite.getIndex());
    sprite.setPosition(x, y);

    return sprite;
}

const COMPONENT_INIT = {
    [ArmyEntity.COMPONENT.ATTACK]: initAttackComponent,
    [ArmyEntity.COMPONENT.MOVE]: initMoveComponent
};

const createEntity = function(gameContext, config, entityID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { tileX = -1, tileY = -1, team = null, type = null, health } = config;
    const entityType = entityManager.getEntityType(type);

    if(!entityType) {
        return null;
    }

    const modeID = gameContext.getGameModeName();
    const { archetype, stats } = entityType;
    const statConfig = stats[modeID];

    if(!statConfig) {
        return null;
    }

    const entity = new ArmyEntity(entityID, type);
    
    entity.setConfig(entityType);

    entityManager.addArchetypeComponents(entity, archetype);

    setupComponents(entity, statConfig, tileX, tileY, team, health);

    const sprite = createSprite(gameContext, entity, tileX, tileY);

    entityManager.addTraitComponents(entity, statConfig.traits);

    for(const componentID in COMPONENT_INIT) {
        const component = entity.getComponent(componentID);

        if(component) {
            COMPONENT_INIT[componentID](component, statConfig);
        }
    }

    if(archetype === ArmyEntity.TYPE.CONSTRUCTION) {
        sprite.freeze();
        sprite.setFrame(0);
    }
    
    return entity;
}

/**
 * Preloads the sounds an entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const loadEntitySounds = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const { sounds } = entity.config;

    for(const soundType in sounds) {
        const soundList = sounds[soundType];

        for(let i = 0; i < soundList.length; i++) {
            const soundID = soundList[i];

            soundPlayer.loadSound(soundID);
        }
    }
}

/**
 * Removes a reference from each sprite the entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const unloadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { sprites } = entity.config;

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        spriteManager.graphics.loader.removeReference(spriteID);
    }
}

/**
 * Preloads the sprites an entity uses.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
const loadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { sprites } = entity.config;
    const blocked = new Set(["airdrop"]);

    for(const spriteType in sprites) {
        if(!blocked.has(spriteType)) {
            const spriteID = sprites[spriteType];

            spriteManager.preloadAtlas(spriteID);
        }
    }
}

/**
 * Adds the id of the entity to the owners.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string[] | string} owners 
 * @param {ArmyEntity} entityID 
 */
const registerOwners = function(gameContext, owners, entity) {
    const { world } = gameContext;
    const { turnManager } = world;
    const entityID = entity.getID();

    switch(typeof owners) {
        case "number": {
            turnManager.addEntity(owners, entityID);
            break;
        }
        case "string": {
            turnManager.addEntity(owners, entityID);
            break;
        }
        case "object": {
            for(const ownerID of owners) {
                turnManager.addEntity(ownerID, entityID);
            }
            break;
        }
    }
}

/**
 * Collection of functions revolving around the spawning and despawning of entities.
 */
export const SpawnSystem = function() {}

/**
 * Creates an entity based on the specified config.
 * 
 * @param {ArmyContext} gameContext 
 * @param {SpawnConfigType} config 
 * @returns
 */
SpawnSystem.createEntity = function(gameContext, config) {
    if(!config) {
        return null;
    }

    const { world } = gameContext;
    const { entityManager } = world;
    const { owners, id, data } = config;
    const entity = entityManager.createEntity((entityID) => createEntity(gameContext, config, entityID), id);

    if(!entity) {
        return null;
    }
    
    if(data) {
        entity.load(data);
    }

    registerOwners(gameContext, owners, entity);
    loadEntitySprites(gameContext, entity);

    entity.determineSprite(gameContext);
    MapSystem.placeEntity(gameContext, entity);
    CardSystem.generateStatCard(gameContext, entity);
    UnitLimitSystem.addEntity(gameContext, entity);
    
    return entity;
}

/**
 * Destroys an entity, the sprite and removes it from the current map.
 * 
 * @param {ArmyContext} gameContext 
 * @param {ArmyEntity} entity 
 */
SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { entityManager } = world;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entityID = entity.getID();

    MapSystem.removeEntity(gameContext, entity);
    UnitLimitSystem.removeEntity(gameContext, entity);
    spriteComponent.destroy(gameContext);
    entityManager.markForDestroy(entityID);

    unloadEntitySprites(gameContext, entity);
}