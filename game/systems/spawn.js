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
    const { resources } = spriteManager;
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
            spriteManager.requestSprite(spriteID);
        }
    }
}

SpawnSystem.createEntity = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;

    if(!config) {
        return null;
    }
    
    const { owners, id } = config;
    const entity = entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        return null;
    }
    
    const entityID = entity.getID();

    switch(typeof owners) {
        case "string": {
            turnManager.addEntity(owners, entityID);
            break;
        }
        case "object": {
            for(let i = 0; i < owners.length; i++) {
                const owner = owners[i];

                turnManager.addEntity(owner, entityID);
            }
            break;
        }
    }

    loadEntitySprites(gameContext, entity);

    MapSystem.placeEntity(gameContext, entity);
    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}

SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const entityID = entity.getID();

    MapSystem.removeEntity(gameContext, entity);
    spriteManager.destroySprite(spriteComponent.spriteID);
    entityManager.destroyEntity(entityID);

    unloadEntitySprites(gameContext, entity);
}