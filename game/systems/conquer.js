import { ArmyEntity } from "../init/armyEntity.js";

export const ConquerSystem = function() {}

ConquerSystem.conquerTile = function(gameContext, tileX, tileY, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(activeMap) {
        const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);

        activeMap.conquer(gameContext, tileX, tileY, teamID);
    }
}