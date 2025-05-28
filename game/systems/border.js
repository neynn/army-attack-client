import { ArmyCamera } from "../armyCamera.js";

/**
 * Collection of functions revolving around the borders.
 */
export const BorderSystem = function() {}

/**
 * 
 * Updates the border for all actors that have an "ArmyCamera".
 * 
 * @param {*} gameContext 
 * @param {*} worldMap 
 * @param {int} tileX 
 * @param {int} tileY 
 * @param {int} range 
 * @returns 
 */
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