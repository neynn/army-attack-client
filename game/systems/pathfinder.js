import { FloodFill } from "../../source/pathfinders/floodFill.js";

import { AvianComponent } from "../components/avian.js";
import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";

export const PathfinderSystem = function() {}

PathfinderSystem.isTileFree = function(gameContext, targetX, targetY) {
    const { mapManager } = gameContext;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap) {
        return false;
    }

    const isEmpty = !activeMap.isTileOccupied(targetX, targetY);

    return isEmpty;
}

PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { mapManager, entityManager } = gameContext;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(MoveComponent)) {
        return [];
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    const settings = gameContext.getConfig("settings");
    const layerTypes = gameContext.getConfig("layerTypes");
    const teamTypes = gameContext.getConfig("teamTypes");
    const tileTypes = gameContext.getConfig("tileTypes");

    const teamLayerID = layerTypes.team.layerID;
    const typeLayerID = layerTypes.type.layerID;
    
    const entityAllies = teamTypes[teamComponent.teamID].allies;
    const entityEnemies = teamTypes[teamComponent.teamID].enemies;

    const nodeList = FloodFill.search(positionComponent.tileX, positionComponent.tileY, moveComponent.range, activeMap.width, activeMap.height, (child, parent) => {
        const childTypeID = activeMap.getTile(typeLayerID, child.positionX, child.positionY);
        const childTileType = tileTypes[childTypeID];

        if(!moveComponent.passability[childTileType.passability]) {
            return false;
        }
        
        const parentTeamID = activeMap.getTile(teamLayerID, parent.positionX, parent.positionY);

        if(!entityAllies[parentTeamID] && !moveComponent.isStealth || moveComponent.isCoward) {
            return false;
        }

        const entityID = activeMap.getFirstEntity(child.positionX, child.positionY);

        if(!entityID) {
            return true;
        }

        const tileEntity = entityManager.getEntity(entityID);
        const tileEntityTeamComponent = tileEntity.getComponent(TeamComponent);
        const isEnemy = entityEnemies[tileEntityTeamComponent.teamID];
        const isAlly = entityAllies[tileEntityTeamComponent.teamID];

        if(isEnemy) {
            if(!moveComponent.isCloaked) {
                return false;
            }
        } else if(isAlly) {
            const avianComponent = entity.getComponent(AvianComponent);

            if(!avianComponent || !avianComponent.inAir) {
                const tileEntityAvianComponent = tileEntity.getComponent(AvianComponent);
                const isPassingAllowed = (tileEntityAvianComponent && tileEntityAvianComponent.inAir) || settings.allowAllyPassing;

                if(!isPassingAllowed) {
                    return false;
                }
            }
        }

        return true;
    });

    return nodeList;
}

PathfinderSystem.generateMovePath = function(nodeList, targetX, targetY) {
    const index = PathfinderSystem.getTargetIndex(nodeList, targetX, targetY);
    const path = [];

    if(index === -1) {
        return path;
    }

    const targetNode = nodeList[index];
    const flatTree = FloodFill.flatten(targetNode);

    // i > 0 to exclude the origin point!
    for(let i = flatTree.length - 1; i > 0; i--) {
        const direction = {
            "deltaX": flatTree[i - 1].positionX - flatTree[i].positionX,
            "deltaY": flatTree[i - 1].positionY - flatTree[i].positionY
        }

        path.push(direction);
    }

    return path;
}

PathfinderSystem.getTargetIndex = function(nodeList, targetX, targetY) {
    for(let i = 0; i < nodeList.length; i++) {
        const { positionX, positionY, isValid } = nodeList[i];

        if(targetX === positionX && targetY === positionY) {
            if(!isValid) {
                return -1;
            }

            return i;
        }
    }

    return -1;
}   