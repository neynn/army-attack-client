import { FloodFill } from "../../source/pathfinders/floodFill.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

export const PathfinderSystem = function() {}

PathfinderSystem.NODE_STATE = {
    VALID: 0,
    INVALID_PASSABILITY: 1,
    INVALID_WALKABILITY: 2,
    INVALID_OCCUPIED: 3
};

PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(ArmyEntity.COMPONENT.MOVE)) {
        return [];
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);

    const tileTypes = world.getConfig("TileType");

    const originTeamID = activeMap.getTile(ArmyMap.LAYER.TEAM, positionComponent.tileX, positionComponent.tileY);
    const originAlliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, ArmyMap.TEAM_TYPE[originTeamID]);
    const isOriginWalkable = originAlliance.isWalkable || moveComponent.isStealth;

    const nodeList = FloodFill.search_cross(positionComponent.tileX, positionComponent.tileY, moveComponent.range, activeMap.width, activeMap.height, (next, current) => {
        const nextTypeID = activeMap.getTile(ArmyMap.LAYER.TYPE, next.positionX, next.positionY);
        const nextTileType = tileTypes[nextTypeID];
        const isNextPassable = moveComponent.hasPassability(nextTileType.passability);

        if(!isNextPassable) {
            next.state = PathfinderSystem.NODE_STATE.INVALID_PASSABILITY;
            return FloodFill.IGNORE_NEXT;
        }

        const entityID = activeMap.getTopEntity(next.positionX, next.positionY);

        if(entityID !== null) {
            if(activeMap.meta.disablePassing) {
                next.state = PathfinderSystem.NODE_STATE.INVALID_OCCUPIED;
                return FloodFill.IGNORE_NEXT;
            }

            const tileEntity = entityManager.getEntity(entityID);
            const tileEntityTeamComponent = tileEntity.getComponent(ArmyEntity.COMPONENT.TEAM);
            const tileEntityAlliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, tileEntityTeamComponent.teamID);
            const isPassable = tileEntityAlliance.isEntityPassingAllowed || moveComponent.isCloaked || (avianComponent && avianComponent.inFlying());

            if(!isPassable) {
                const tileEntityAvianComponent = tileEntity.getComponent(ArmyEntity.COMPONENT.AVIAN);
                const isFlying = (tileEntityAvianComponent && tileEntityAvianComponent.isFlying());
        
                if(!isFlying) {
                    next.state = PathfinderSystem.NODE_STATE.INVALID_OCCUPIED;
                    return FloodFill.IGNORE_NEXT;
                }
            }
        }

        const nextTeamID = activeMap.getTile(ArmyMap.LAYER.TEAM, next.positionX, next.positionY);
        const nextAlliance = AllianceSystem.getAlliance(gameContext, teamComponent.teamID, ArmyMap.TEAM_TYPE[nextTeamID]);
        const isNextWalkable = nextAlliance.isWalkable || moveComponent.isStealth;

        /**
         * RESCUE: Allows units to move on nearby conquered tiles if they are stranded,
         * but disallows them from capturing.
         */
        if(!isOriginWalkable) {
            if(!isNextWalkable) {
                next.state = PathfinderSystem.NODE_STATE.INVALID_WALKABILITY;
                return FloodFill.IGNORE_NEXT;
            } else {
                next.state = PathfinderSystem.NODE_STATE.VALID;
                return FloodFill.USE_NEXT;
            }
        }

        /**
         * CAPTURE: Allows units to move on nearby enemy tiles and capture them, but once.
         * Assumes that the unit is not stranded.
         */
        if(!isNextWalkable) {
            if(!moveComponent.isCoward) {
                next.state = PathfinderSystem.NODE_STATE.VALID;
            } else {
                next.state = PathfinderSystem.NODE_STATE.INVALID_WALKABILITY;
            }

            return FloodFill.IGNORE_NEXT;
        }

        next.state = PathfinderSystem.NODE_STATE.VALID;
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