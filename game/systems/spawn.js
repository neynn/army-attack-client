import { ArmyEntity } from "../init/armyEntity.js";
import { CardSystem } from "./card.js";

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
    const { resources } = spriteManager;
    const { sprites } = entity.config;
    const blocked = new Set(["airdrop"]);

    for(const spriteType in sprites) {
        const spriteID = sprites[spriteType];

        if(blocked.has(spriteType)) {
            console.log("BLOCKED", spriteID);
            continue;
        }

        resources.requestImage(spriteID, (id, image, sheet) => {
            console.log("LOADED IMAGE", id);
        });

        resources.addReference(spriteID);
    }
}

SpawnSystem.createEntity = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;

    if(!config) {
        return null;
    }
    
    const { owner, id } = config;
    const entity = entityManager.createEntity(gameContext, config, id);

    if(!entity) {
        return null;
    }
    
    const entityID = entity.getID();

    if(owner !== undefined && owner !== null) {
        turnManager.addEntity(owner, entityID);
        entity.setOwner(owner);
    }

    loadEntitySprites(gameContext, entity);

    entity.placeOnMap(gameContext);

    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}

SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world, spriteManager } = gameContext;
    const { entityManager } = world;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    
    entity.removeFromMap(gameContext);

    spriteManager.destroySprite(spriteComponent.spriteID);
    entityManager.destroyEntity(entity.getID());

    unloadEntitySprites(gameContext, entity);
}