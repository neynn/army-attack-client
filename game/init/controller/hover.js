import { PathfinderSystem } from "../../systems/pathfinder.js";

export const ControllerHover = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.entityID = null;
    this.nodeMap = new Map();
    this.targetChanged = false;
}

ControllerHover.prototype.getEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    if(this.entityID === null) {
        return null;
    }

    const entity = entityManager.getEntity(this.entityID);

    return entity;
}

ControllerHover.prototype.clearNodes = function() {
    this.nodeMap.clear();
}

ControllerHover.prototype.updateNodes = function(gameContext, nodeList) {
    const nodes = this.createValidNodeHashmap(gameContext, nodeList);

    this.nodeMap = nodes;
}

ControllerHover.prototype.getNodeKey = function(nodeX, nodeY) {
    return `${nodeX}-${nodeY}`;
}

ControllerHover.prototype.createValidNodeHashmap = function(gameContext, nodeList) {
    const { world } = gameContext;
    const nodes = new Map();

    for(const node of nodeList) {
        const { positionX, positionY, state } = node;
        const nodeKey = this.getNodeKey(positionX, positionY);

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        const tileEntity = world.getTileEntity(positionX, positionY);

        if(tileEntity) {
            continue;
        }

        nodes.set(nodeKey, node);
    }

    return nodes;
}

ControllerHover.prototype.isHoveringOnNode = function() {
    const nodeKey = this.getNodeKey(this.tileX, this.tileY);

    return this.nodeMap.has(nodeKey);
}

ControllerHover.prototype.isHoveringOnEntity = function() {
    return this.entityID !== null;
}

ControllerHover.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);
    const lastTarget = this.entityID;

    this.tileX = x;
    this.tileY = y;

    if(mouseEntity) {
        const entityID = mouseEntity.getID();

        this.entityID = entityID;
    } else {
        this.entityID = null;
    }

    this.targetChanged = (lastTarget !== this.entityID);
}
