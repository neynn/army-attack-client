import { PathfinderSystem } from "../../systems/pathfinder.js";

export const ControllerHover = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.nodeMap = new Map();
    this.currentTarget = null;
    this.lastTarget = null;
    this.targetChanged = false;
}

ControllerHover.prototype.getEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    if(this.currentTarget === null) {
        return null;
    }

    const entity = entityManager.getEntity(this.currentTarget);

    return entity;
}

ControllerHover.prototype.clearNodes = function() {
    this.nodeMap.clear();
}

ControllerHover.prototype.updateNodes = function(gameContext, nodeList) {
    const { world } = gameContext;

    this.nodeMap.clear();

    for(let i = 0; i < nodeList.length; i++) {
        const node = nodeList[i];
        const { positionX, positionY, state } = node;
        const nodeKey = this.getNodeKey(positionX, positionY);

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            continue;
        }

        const tileEntity = world.getTileEntity(positionX, positionY);

        if(tileEntity === null) {
            this.nodeMap.set(nodeKey, node);
        }
    }
}

ControllerHover.prototype.getNodeKey = function(nodeX, nodeY) {
    return `${nodeX}-${nodeY}`;
}

ControllerHover.prototype.isHoveringOnNode = function() {
    const nodeKey = this.getNodeKey(this.tileX, this.tileY);

    return this.nodeMap.has(nodeKey);
}

ControllerHover.prototype.isHoveringOnEntity = function() {
    return this.currentTarget !== null;
}

ControllerHover.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { x, y } = gameContext.getMouseTile();
    const mouseEntity = world.getTileEntity(x, y);
    const previous = this.currentTarget;

    this.tileX = x;
    this.tileY = y;

    if(mouseEntity) {
        const entityID = mouseEntity.getID();

        this.currentTarget = entityID;
    } else {
        this.currentTarget = null;
    }

    this.targetChanged = (this.currentTarget !== previous);

    if(this.targetChanged) {
        this.lastTarget = previous;
    }
}
