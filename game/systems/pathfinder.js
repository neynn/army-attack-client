import { FloodFill } from "../../source/pathfinders/floodFill.js";

import { AvianComponent } from "../components/avian.js";
import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { AllianceSystem } from "./alliance.js";

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

    const teamMapping = world.getConfig("TeamTypeMapping");
    const layerTypes = world.getConfig("LayerType");
    const tileTypes = world.getConfig("TileType");

    const teamLayerID = layerTypes["Team"].layerID;
    const typeLayerID = layerTypes["Type"].layerID;

    const nodeList = FloodFill.search_cross(positionComponent.tileX, positionComponent.tileY, moveComponent.range, activeMap.width, activeMap.height, (next, current) => {
        const nextTypeID = activeMap.getTile(typeLayerID, next.positionX, next.positionY);
        const nextTileType = tileTypes[nextTypeID];
        const isNextPassable = moveComponent.hasPassability(nextTileType.passability);

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
            const tileEntityAlliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, tileEntityTeamComponent.teamID);
            const isPassable = tileEntityAlliance.isEntityPassingAllowed || moveComponent.isCloaked || (avianComponent && avianComponent.inFlying());

            if(!isPassable) {
                const tileEntityAvianComponent = tileEntity.getComponent(AvianComponent);
                const isFlying = (tileEntityAvianComponent && tileEntityAvianComponent.isFlying());
        
                if(!isFlying) {
                    next.state = PathfinderSystem.NODE_STATE.INVALID_OCCUPIED;
                    return FloodFill.IGNORE_NEXT;
                }
            }
        }

        const nextTeamID = activeMap.getTile(teamLayerID, next.positionX, next.positionY);
        const nextAlliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, teamMapping[nextTeamID]);
        const isNextWalkable = nextAlliance.isWalkable || moveComponent.isStealth && !moveComponent.isCoward;
        
        const currentTeamID = activeMap.getTile(teamLayerID, current.positionX, current.positionY);
        const currentAlliance =  AllianceSystem.getAlliance(gameContext, teamComponent.teamID, teamMapping[currentTeamID]);
        const isCurrentWalkable = currentAlliance.isWalkable || moveComponent.isStealth;

        next.state = PathfinderSystem.NODE_STATE.VALID;

        if(!isNextWalkable) {
            if(!isCurrentWalkable || moveComponent.isCoward) {
                next.state = PathfinderSystem.NODE_STATE.INVALID_WALKABILITY;
            }

            return FloodFill.IGNORE_NEXT;
        }

        if(!isCurrentWalkable && moveComponent.isCoward) {
            return FloodFill.IGNORE_NEXT;
        }

        return FloodFill.USE_NEXT;
    });

    return nodeList;
}

PathfinderSystem.generateMovePath = function(nodeList, targetX, targetY) {
    for(let i = 0; i < nodeList.length; i++) {
        const targetNode = nodeList[i];
        const { positionX, positionY, state } = targetNode;

        if(targetX !== positionX || targetY !== positionY || state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        const path = [];
        const flatTree = FloodFill.walkTree(targetNode);

        // i = 1 to exclude the origin point!
        for(let i = 1; i < flatTree.length; i++) {
            const deltaX = flatTree[i - 1].positionX - flatTree[i].positionX;
            const deltaY = flatTree[i - 1].positionY - flatTree[i].positionY;
            const direction = {
                "deltaX": deltaX,
                "deltaY": deltaY,
                "speed": Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            };
    
            path.push(direction);
        }

        return path;
    }

    return [];
}