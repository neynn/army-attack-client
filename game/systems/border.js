import { ArmyCamera } from "../armyCamera.js";

export const BorderSystem = function() {}

BorderSystem.updateBorder = function(gameContext, worldMap, tileX, tileY, range) {
    const { world } = gameContext;
    const { turnManager } = world;
    
    if(!gameContext.settings.calculateBorder) {
        return;
    }

    turnManager.forAllActors((actorID, actor) => {
        const { camera, teamID } = actor;

        if(!(camera instanceof ArmyCamera) || teamID === undefined) {
            return;
        }

        const startX = tileX - range;
        const startY = tileY - range;
        const endX = tileX + range;
        const endY = tileY + range;
    
        for(let i = startY; i <= endY; i++) {
            for(let j = startX; j <= endX; j++) {
                const borderID = worldMap.getBorderType(gameContext, j, i, teamID);

                camera.updateBorder(borderID, j, i);
            }
        }
    })
}