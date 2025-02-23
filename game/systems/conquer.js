import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";

export const ConquerSystem = function() {}

ConquerSystem.tryConquering = function(gameContext, tileX, tileY, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(activeMap) {
        const typeID = activeMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);

        if(typeID === ArmyMap.TILE_TYPE.GROUND) {
            const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);

            activeMap.conquer(gameContext, tileX, tileY, teamID);
        }
    }
}