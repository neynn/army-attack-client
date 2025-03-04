import { PathfinderSystem } from "../systems/pathfinder.js";

export const Hover = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.nodeMap = new Map();
    this.currentTarget = null;
    this.lastTarget = null;
    this.targetChanged = false;
    this.state = Hover.STATE.NONE;
}

Hover.STATE = {
    NONE: 0,
    HOVER_ON_ENTITY: 1,
    HOVER_ON_NODE: 2
};

Hover.prototype.updateState = function() {
    const onEntity = this.currentTarget !== null;
    const nodeKey = this.getNodeKey(this.tileX, this.tileY)
    const onNode = this.nodeMap.has(nodeKey);

    if(onEntity) {
        this.state = Hover.STATE.HOVER_ON_ENTITY;
    } else if(onNode) {
        this.state = Hover.STATE.HOVER_ON_NODE;
    } else {
        this.state = Hover.STATE.NONE;
    }
}

Hover.prototype.getEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    if(this.currentTarget === null) {
        return null;
    }

    const entity = entityManager.getEntity(this.currentTarget);

    return entity;
}

Hover.prototype.clearNodes = function() {
    this.nodeMap.clear();
}

Hover.prototype.updateNodes = function(gameContext, nodeList) {
    const { world } = gameContext;

    this.nodeMap.clear();

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;
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

Hover.prototype.getNodeKey = function(nodeX, nodeY) {
    return `${nodeX}-${nodeY}`;
}

Hover.prototype.update = function(gameContext) {
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

    this.updateState();
}
