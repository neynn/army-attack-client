import { FloodFill } from "../../source/pathfinders/floodFill.js";

import { AvianComponent } from "../components/avian.js";
import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";

export const PathfinderSystem = function() {}

PathfinderSystem.NODE_STATE = {
    VALID: 0,
    INVALID_PASSABILITY: 1,
    INVALID_WALKABILITY: 2,
    INVALID_OCCUPIED: 3
};

PathfinderSystem.isTileFree = function(gameContext, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap) {
        return false;
    }

    const isEmpty = !activeMap.isTileOccupied(targetX, targetY);

    return isEmpty;
}

PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(MoveComponent)) {
        return [];
    }

    const avianComponent = entity.getComponent(AvianComponent);
    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    const teamMapping = world.getConfig("TeamTypesMapping");
    const teamTypes = world.getConfig("TeamTypes");
    const layerTypes = world.getConfig("LayerTypes");
    const tileTypes = world.getConfig("TileTypes");

    const teamLayerID = layerTypes["Team"].layerID;
    const typeLayerID = layerTypes["Type"].layerID;
    const entityAlliances = teamTypes[teamComponent.teamID].alliances;

    const nodeList = FloodFill.search(positionComponent.tileX, positionComponent.tileY, moveComponent.range, activeMap.width, activeMap.height, (next, current) => {
        const nextTypeID = activeMap.getTile(typeLayerID, next.positionX, next.positionY);
        const nextTileType = tileTypes[nextTypeID];
        const isNextPassable = moveComponent.passability[nextTileType.passability];

        if(!isNextPassable) {
            next.state = PathfinderSystem.NODE_STATE.INVALID_PASSABILITY;
            return FloodFill.IGNORE_NEXT;
        }

        const entityID = activeMap.getTopEntity(next.positionX, next.positionY);

        if(entityID) {
            if(activeMap.meta.disablePassing) {
                next.state = PathfinderSystem.NODE_STATE.INVALID_OCCUPIED;
                return FloodFill.IGNORE_NEXT;
            }

            const tileEntity = entityManager.getEntity(entityID);
            const tileEntityTeamComponent = tileEntity.getComponent(TeamComponent);
            const tileEntityAlliance = entityAlliances[tileEntityTeamComponent.teamID];
            const isPassable = tileEntityAlliance.isPassable || moveComponent.isCloaked || (avianComponent && avianComponent.state === AvianComponent.STATE_FLYING);

            if(!isPassable) {
                const tileEntityAvianComponent = tileEntity.getComponent(AvianComponent);
                const isFlying = tileEntityAvianComponent && tileEntityAvianComponent.state === AvianComponent.STATE_FLYING;
        
                if(!isFlying) {
                    next.state = PathfinderSystem.NODE_STATE.INVALID_OCCUPIED;
                    return FloodFill.IGNORE_NEXT;
                }
            }
        }

        const nextTeamID = activeMap.getTile(teamLayerID, next.positionX, next.positionY);
        const nextAlliance = entityAlliances[teamMapping[nextTeamID]];
        const isNextWalkable = nextAlliance.isWalkable || moveComponent.isStealth && moveComponent.courageType !== MoveComponent.COURAGE_TYPE_COWARD;

        const currentTeamID = activeMap.getTile(teamLayerID, current.positionX, current.positionY);
        const currentAlliance = entityAlliances[teamMapping[currentTeamID]];
        const isCurrentWalkable = currentAlliance.isWalkable || moveComponent.isStealth && moveComponent.courageType !== MoveComponent.COURAGE_TYPE_COWARD;

        if(!isNextWalkable) {
            if(isCurrentWalkable) {
                next.state = PathfinderSystem.NODE_STATE.VALID;
            } else {
                next.state = PathfinderSystem.NODE_STATE.INVALID_WALKABILITY;
            }

            return FloodFill.IGNORE_NEXT;
        }

        if(!isCurrentWalkable) {
            next.state = PathfinderSystem.NODE_STATE.VALID;
            return FloodFill.IGNORE_NEXT;
        }

        next.state = PathfinderSystem.NODE_STATE.VALID;
        return FloodFill.USE_NEXT;
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
        const { positionX, positionY, state } = nodeList[i];

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        if(targetX === positionX && targetY === positionY) {
            return i;
        }
    }

    return -1;
}   