import { PositionComponent } from "../components/position.js";

export const PlaceSystem = function() {}

PlaceSystem.placeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const entityID = entity.getID();
    const positionComponent = entity.getComponent(PositionComponent);

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
    const positionComponent = entity.getComponent(PositionComponent);

    activeMap.removeEntity(positionComponent.tileX, positionComponent.tileY, entity.config.dimX, entity.config.dimY, entityID);
}