import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { FloodFill } from "../source/pathfinders/floodFill.js";

export const PathfinderSystem = function() {}

PathfinderSystem.isEmpty = function(gameContext, targetX, targetY) {
    const { mapLoader } = gameContext;
    const activeMap = mapLoader.getActiveMap();
    
    if(!activeMap) {
        return false;
    }

    const isEmpty = !activeMap.isTileOccupied(targetX, targetY);

    return isEmpty;
}

PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { mapLoader, entityManager } = gameContext;
    const activeMap = mapLoader.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(MoveComponent)) {
        return [];
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    const settings = gameContext.getConfig("settings");
    const teamTypes = gameContext.getConfig("teamTypes");
    const tileTypes = gameContext.getConfig("tileTypes");
    
    const entityAllies = teamTypes[teamComponent.teamID].allies;
    const entityEnemies = teamTypes[teamComponent.teamID].enemies;

    const nodeList = FloodFill.search(positionComponent.tileX, positionComponent.tileY, moveComponent.range, activeMap.width, activeMap.height, (child, parent) => {
        const childTypeID = activeMap.getTile(settings.typeLayerID, child.positionX, child.positionY);
        const childTileType = tileTypes[childTypeID];

        if(!moveComponent.passability[childTileType.passability]) {
            return false;
        }
        
        const parentTeamID = activeMap.getTile(settings.teamLayerID, parent.positionX, parent.positionY);

        if(!entityAllies[parentTeamID] && !moveComponent.isStealth || moveComponent.isCoward) {
            return false;
        }

        const entityID = activeMap.getFirstEntity(child.positionX, child.positionY);

        if(entityID) {
            const occupyEntity = entityManager.getEntity(entityID);
            const occupyTeamComponent = occupyEntity.getComponent(TeamComponent);
            const isEnemy = entityEnemies[occupyTeamComponent.teamID];
            const isAlly = entityAllies[occupyTeamComponent.teamID];

            if(isEnemy) {
                if(!moveComponent.isCloaked) {
                    return false;
                }
            } else if(isAlly) {
                if(!moveComponent.isAvian) {
                    const occupyMoveComponent = occupyEntity.getComponent(MoveComponent);

                    if(!occupyMoveComponent || !occupyMoveComponent.isAvian || !settings.allowAllyPassing) {
                        return false;
                    }
                }
            }
        }

        return true;
    });

    return nodeList;
}

PathfinderSystem.generateMovePath = function(nodeList, index) {
    const targetNode = nodeList[index];
    const flatTree = FloodFill.flatten(targetNode);
    const path = [];

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
                return null;
            }

            return i;
        }
    }

    return null;
}   

PathfinderSystem.getPath = function(nodeList, targetX, targetY) {
    const index = PathfinderSystem.getTargetIndex(nodeList, targetX, targetY);

    if(index !== null) {
        const path = PathfinderSystem.generateMovePath(nodeList, index);

        return path;
    }

    return null;
}