import { EntityManager } from "../../source/entity/entityManager.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { CardSystem } from "./card.js";
import { MapSystem } from "./map.js";

export const SpawnSystem = function() {}

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