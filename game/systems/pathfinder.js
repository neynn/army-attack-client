import { FloodFill } from "../../source/pathfinders/floodFill.js";
import { MoveComponent } from "../components/move.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";
import { AllianceSystem } from "./alliance.js";

/**
 * Collection of functions revolving around the pathfinding.
 */
export const PathfinderSystem = function() {}

PathfinderSystem.PATHFINDER = new FloodFill(1, 1.5);

PathfinderSystem.NODE_STATE = {
    VALID: 0,
    INVALID_PASSABILITY: 1,
    INVALID_WALKABILITY: 2,
    INVALID_OCCUPIED: 3
};

/**
 * Adds a node to the specified node list.
 * 
 * @param {FullNode[]} nodeList 
 * @param {PathfinderNode} node 
 * @param {int} state 
 */
const addNode = function(nodeList, node, state) {
    const fullNode = {
        "node": node,
        "state": state
    };

    nodeList.push(fullNode);
}

/**
 * Checks if the tile is passable by the entity.
 * 
 * @param {*} worldMap 
 * @param {*} tileTypes 
 * @param {*} entity 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {boolean}
 */
const isTilePassable = function(worldMap, tileTypes, entity, tileX, tileY) {
    const tileTypeID = worldMap.getTile(ArmyMap.LAYER.TYPE, tileX, tileY);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const tileType = tileTypes[tileTypeID];

    if(!tileType) {
        return false;
    }

    const { passability } = tileType;
    const isTilePassable = moveComponent.hasPassability(passability);

    if(!isTilePassable) {
        return false;
    }

    const isFullyClouded = worldMap.isFullyClouded(tileX, tileY);

    return !isFullyClouded;
}

/**
 * Checks if the tile is walkable by the entity.
 * Walkability revolves around the team and stealth mechanics.
 * 
 * @param {*} gameContext 
 * @param {*} worldMap 
 * @param {*} entity 
 * @param {int} tileX 
 * @param {int} tileY 
 * @returns {boolean}
 */
const isTileWalkable = function(gameContext, worldMap, entity, tileX, tileY) {
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    const tileTeamID = worldMap.getTile(ArmyMap.LAYER.TEAM, tileX, tileY);
    const isTileWalkable = AllianceSystem.isWalkable(gameContext, teamID, ArmyMap.TEAM_TYPE[tileTeamID]);
    const isWalkable = isTileWalkable || moveComponent.isStealth();

    return isWalkable;
}

/**
 * Checks if an entity can move past an entity.
 * The world map may disable passing entirely.
 * 
 * @param {*} gameContext 
 * @param {*} worldMap 
 * @param {*} entity 
 * @param {*} blocker 
 * @returns {boolean}
 */
const isPassingAllowed = function(gameContext, worldMap, entity, blocker) {
    if(!worldMap.hasFlag(ArmyMap.FLAG.ALLOW_PASSING)) {
        return false;
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);
    const passerAvianComponent = blocker.getComponent(ArmyEntity.COMPONENT.AVIAN);
    const isBypassByFlight = avianComponent && avianComponent.isFlying() || passerAvianComponent && passerAvianComponent.isFlying();

    if(isBypassByFlight) {
        return true;
    }

    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const passerTeamComponent = blocker.getComponent(ArmyEntity.COMPONENT.TEAM);

    const isPassable = AllianceSystem.isPassable(gameContext, teamComponent.teamID, passerTeamComponent.teamID);
    const isPassingAllowed = isPassable || moveComponent.isCloaked();

    return isPassingAllowed;
}

/**
 * Uses FloodFill to generate a list of nodes the entity can walk on.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns {FullNode[]}
 */
PathfinderSystem.generateNodeList = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const activeMap = mapManager.getActiveMap();
    
    if(!activeMap || !entity || !entity.hasComponent(ArmyEntity.COMPONENT.MOVE)) {
        return [];
    }

    const nodes = [];
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const isOriginWalkable = isTileWalkable(gameContext, activeMap, entity, tileX, tileY);
    const tileTypes = gameContext.tileTypes;

    PathfinderSystem.PATHFINDER.searchCross(tileX, tileY, moveComponent.range, activeMap.width, activeMap.height, (next) => {
        const { positionX, positionY } = next;
        const isNextPassable = isTilePassable(activeMap, tileTypes, entity, positionX, positionY);

        if(!isNextPassable) {
            addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_PASSABILITY);

            return FloodFill.RESPONSE.IGNORE_NEXT;
        }

        const entityID = activeMap.getTopEntity(positionX, positionY);

        if(entityID !== null) {
            const tileEntity = entityManager.getEntity(entityID);
            const isPassable = isPassingAllowed(gameContext, activeMap, entity, tileEntity);

            if(!isPassable) {
                addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_OCCUPIED);

                return FloodFill.RESPONSE.IGNORE_NEXT;
            }
        }

        const isNextWalkable = isTileWalkable(gameContext, activeMap, entity, positionX, positionY);

        /**
         * RESCUE: Allows units to move on nearby conquered tiles if they are stranded,
         * but disallows them from capturing.
         */
        if(!isOriginWalkable) {
            if(!isNextWalkable) {
                addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_WALKABILITY);

                return FloodFill.RESPONSE.IGNORE_NEXT;
            } else {
                addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);

                return FloodFill.RESPONSE.USE_NEXT;
            }
        }

        /**
         * CAPTURE: Allows units to move on nearby enemy tiles and capture them, but once.
         * Assumes that the unit is not stranded.
         */
        if(!isNextWalkable) {
            if(!moveComponent.isCoward()) {
                addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);
            } else {
                addNode(nodes, next, PathfinderSystem.NODE_STATE.INVALID_WALKABILITY);
            }

            return FloodFill.RESPONSE.IGNORE_NEXT;
        }

        addNode(nodes, next, PathfinderSystem.NODE_STATE.VALID);

        return FloodFill.RESPONSE.USE_NEXT;
    });

    return nodes;
}

/**
 * Creates a move path based on the node list and target position.
 * 
 * @param {FullNode[]} nodeList 
 * @param {int} targetX 
 * @param {int} targetY 
 * @returns {Step[] | null}
 */
PathfinderSystem.generateMovePath = function(nodeList, targetX, targetY) {
    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(targetX !== positionX || targetY !== positionY || state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        const flatTree = FloodFill.flattenTree(node);
        const length = flatTree.length;

        if(length <= 1) {
            return null;
        }

        const path = [];

        // i = 1 to exclude the origin point!
        for(let i = 1; i < length; i++) {
            const deltaX = flatTree[i - 1].positionX - flatTree[i].positionX;
            const deltaY = flatTree[i - 1].positionY - flatTree[i].positionY;
            const step = MoveComponent.createStep(deltaX, deltaY);
    
            path.push(step);
        }

        return path;
    }

    return null;
}

/**
 * Returns the origin point of a move.
 * 
 * @param {int} targetX 
 * @param {int} targetY 
 * @param {Step[]} path 
 * @returns 
 */
PathfinderSystem.getOrigin = function(targetX, targetY, path) {
    let originX = targetX;
    let originY = targetY;
    let index = path.length - 1;

    while(index >= 0) {
        const { deltaX, deltaY } = path[index];

        originX -= deltaX;
        originY -= deltaY;
        index--;
    }

    return {
        "x": originX,
        "y": originY
    }
}