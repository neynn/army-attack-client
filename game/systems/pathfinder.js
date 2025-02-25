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

PathfinderSystem.addNode = function(nodes, node, state) {
    nodes.push({
        "node": node,
        "state": state
    });
}

PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(ArmyEntity.COMPONENT.MOVE)) {
        return [];
    }

    const nodes = [];
    const tileTypes = world.getConfig("TileType");
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const isOnSafeGround = entity.isOnSafeGround(gameContext);

    FloodFill.search_cross(tileX, tileY, moveComponent.range, activeMap.width, activeMap.height, (next, current) => {
        const { positionX, positionY } = next;
        const nextTypeID = activeMap.getTile(ArmyMap.LAYER.TYPE, positionX, positionY);
        const isNextPassable = moveComponent.hasPassability(tileTypes[nextTypeID].passability);

        if(!isNextPassable) {
            PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_PASSABILITY);

            return FloodFill.RESPONSE.IGNORE_NEXT;
        }

        const entityID = activeMap.getTopEntity(positionX, positionY);

        if(entityID !== null) {
            if(activeMap.disablePassing) {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_OCCUPIED);

                return FloodFill.RESPONSE.IGNORE_NEXT;
            }

            const tileEntity = entityManager.getEntity(entityID);
            const isBypassingAllowed = entity.isBypassingAllowed(gameContext, tileEntity);

            if(!isBypassingAllowed) {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_OCCUPIED);

                return FloodFill.RESPONSE.IGNORE_NEXT;
            }
        }

        const nextTeamID = activeMap.getTile(ArmyMap.LAYER.TEAM, positionX, positionY);
        const nextAlliance = AllianceSystem.getAlliance(gameContext, teamID, ArmyMap.TEAM_TYPE[nextTeamID]);
        const isNextWalkable = nextAlliance.isWalkable || moveComponent.isStealth;

        /**
         * RESCUE: Allows units to move on nearby conquered tiles if they are stranded,
         * but disallows them from capturing.
         */
        if(!isOnSafeGround) {
            if(!isNextWalkable) {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_WALKABILITY);

                return FloodFill.RESPONSE.IGNORE_NEXT;
            } else {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);

                return FloodFill.RESPONSE.USE_NEXT;
            }
        }

        /**
         * CAPTURE: Allows units to move on nearby enemy tiles and capture them, but once.
         * Assumes that the unit is not stranded.
         */
        if(!isNextWalkable) {
            if(!moveComponent.isCoward) {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);
            } else {
                PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_WALKABILITY);
            }

            return FloodFill.RESPONSE.IGNORE_NEXT;
        }

        PathfinderSystem.addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);

        return FloodFill.RESPONSE.USE_NEXT;
    });

    return nodes;
}

PathfinderSystem.generateMovePath = function(nodeList, targetX, targetY) {
    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(targetX !== positionX || targetY !== positionY || state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        const path = [];
        const flatTree = FloodFill.walkTree(node);

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