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

    if(!config) {
        return null;
    }
    
    const { owner, id } = config;
    const entity = world.createEntity(gameContext, config, owner, id);

    if(!entity) {
        return null;
    }
    
    loadEntitySprites(gameContext, entity);

    entity.placeOnMap(gameContext);

    CardSystem.generateStatCard(gameContext, entity);

    return entity;
}

SpawnSystem.destroyEntity = function(gameContext, entity) {
    const { world, spriteManager } = gameContext;
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    
    entity.removeFromMap(gameContext);

    spriteManager.destroySprite(spriteComponent.spriteID);

    world.destroyEntity(entity.id);

    unloadEntitySprites(gameContext, entity);
}