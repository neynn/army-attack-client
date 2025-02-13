import { ArmyEntity } from "../init/armyEntity.js";

export const PlaceSystem = function() {}

PlaceSystem.placeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const entityID = entity.getID();
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

    activeMap.addEntity(positionComponent.tileX, positionComponent.tileY, entity.config.dimX, entity.config.dimY, entityID);
}

PlaceSystem.removeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const entityID = entity.getID();
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

    activeMap.removeEntity(positionComponent.tileX, positionComponent.tileY, entity.config.dimX, entity.config.dimY, entityID);
}