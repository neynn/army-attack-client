import { EntityManager } from "../../source/entity/entityManager.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { CardSystem } from "./card.js";
import { MapSystem } from "./map.js";

/**
 * Preloads the sounds an entity uses.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
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
 * @param {*} gameContext 
 * @param {*} entity 
 */
const unloadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { graphics } = spriteManager;
    const { resources } = graphics;
    const { sprites } = entity.config;

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        resources.removeReference(spriteID);
    }
}

/**
 * Preloads the sprites an entity uses.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
const loadEntitySprites = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const { sprites } = entity.config;
    const blocked = new Set(["airdrop"]);

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        if(!blocked.has(spriteType)) {
            spriteManager.preloadAtlas(spriteID);
        }
    }
}

/**
 * Adds the id of the entity to the owners.
 * 
 * @param {*} gameContext 
 * @param {string[] | string} owners 
 * @param {int} entityID 
 */
const registerOwners = function(gameContext, owners, entityID) {
    const { world } = gameContext;
    const { turnManager } = world;

    switch(typeof owners) {
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
 * @param {*} gameContext 
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
    const entity = entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        return null;
    }
    
    if(data) {
        entity.load(data);
    }

    registerOwners(gameContext, owners, entity.getID());
    loadEntitySprites(gameContext, entity);
    entity.determineSprite(gameContext);
    MapSystem.placeEntity(gameContext, entity);
    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}

/**
 * Destroys an entity, the sprite and removes it from the current map.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { entityManager } = world;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entityID = entity.getID();

    MapSystem.removeEntity(gameContext, entity);
    spriteComponent.destroy(gameContext);
    entityManager.markEntity(EntityManager.MARK_TYPE.DELETE, entityID);

    unloadEntitySprites(gameContext, entity);
}