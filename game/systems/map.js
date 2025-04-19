import { ArmyEntity } from "../init/armyEntity.js";

export const MapSystem = function() {}

MapSystem.placeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const entityID = entity.getID();
        const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.addEntity(tileX, tileY, entity.config.dimX, entity.config.dimY, entityID);
    }
}

MapSystem.removeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const entityID = entity.getID();
        const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.removeEntity(tileX, tileY, entity.config.dimX, entity.config.dimY, entityID);
    }
}
