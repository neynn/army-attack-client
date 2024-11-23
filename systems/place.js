import { PositionComponent } from "../components/position.js";

export const PlaceSystem = function() {}

PlaceSystem.placeEntity = function(gameContext, entity) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const entityID = entity.getID();
    const positionComponent = entity.getComponent(PositionComponent);

    activeMap.addEntity(positionComponent.tileX, positionComponent.tileY, entity.config.dimX, entity.config.dimY, entityID);

    return true;
}

PlaceSystem.removeEntity = function(gameContext, entity) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const entityID = entity.getID();
    const positionComponent = entity.getComponent(PositionComponent);

    activeMap.removeEntity(positionComponent.tileX, positionComponent.tileY, entity.config.dimX, entity.config.dimY, entityID);

    return true;
}