import { PositionComponent } from "../components/position.js";
import { SizeComponent } from "../components/size.js";

export const PlaceSystem = function() {}

PlaceSystem.placeEntity = function(gameContext, entity) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const sizeComponent = entity.getComponent(SizeComponent);

    activeMap.setPointers(positionComponent.tileX, positionComponent.tileY, sizeComponent.sizeX, sizeComponent.sizeY, entity.id);

    return true;
}

PlaceSystem.removeEntity = function(gameContext, entity) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return false;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const sizeComponent = entity.getComponent(SizeComponent);

    activeMap.removePointers(positionComponent.tileX, positionComponent.tileY, sizeComponent.sizeX, sizeComponent.sizeY, entity.id);

    return true;
}