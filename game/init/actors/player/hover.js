import { EntityManager } from "../../../../source/entity/entityManager.js";
import { SpriteManager } from "../../../../source/sprite/spriteManager.js";
import { PathfinderSystem } from "../../../systems/pathfinder.js";
import { ArmyEntity } from "../../armyEntity.js";

export const Hover = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.spriteIndex = -1;
    this.nodeMap = new Map();
    this.state = Hover.STATE.NONE;
    this.currentTarget = EntityManager.ID.INVALID;
    this.lastTarget = EntityManager.ID.INVALID;
    this.targetChanged = false;
}

Hover.STATE = {
    NONE: 0,
    HOVER_ON_ENTITY: 1,
    HOVER_ON_NODE: 2
};

Hover.prototype.updateState = function() {
    const onEntity = this.currentTarget !== EntityManager.ID.INVALID;

    if(onEntity) {
        this.state = Hover.STATE.HOVER_ON_ENTITY;
        return;
    }

    const nodeKey = this.getNodeKey(this.tileX, this.tileY)
    const onNode = this.nodeMap.has(nodeKey);

    if(onNode) {
        this.state = Hover.STATE.HOVER_ON_NODE;
        return;
    }

    this.state = Hover.STATE.NONE;
}

Hover.prototype.getEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    if(this.currentTarget === EntityManager.ID.INVALID) {
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
        this.currentTarget = EntityManager.ID.INVALID;
    }

    this.targetChanged = (this.currentTarget !== previous);

    if(this.targetChanged) {
        this.lastTarget = previous;
    }

    this.updateState();
}

Hover.prototype.autoAlignSprite = function(gameContext, camera) {
    switch(this.state) {
        case Hover.STATE.HOVER_ON_ENTITY: {
            const hoverEntity = this.getEntity(gameContext);
            this.alignSpriteEntity(gameContext, camera, hoverEntity);
            break;
        }
        default: {
            this.alignSprite(gameContext, camera);
            break;
        }
    }
}

Hover.prototype.alignSprite = function(gameContext, camera) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { x, y } = camera.transformTileToPositionCenter(this.tileX, this.tileY);

    sprite.setPosition(x, y);
}

Hover.prototype.alignSpriteEntity = function(gameContext, camera, entity) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    sprite.setPosition(x, y);
}

Hover.prototype.hideSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);

    sprite.hide();
}

Hover.prototype.updateSprite = function(gameContext, typeID) {
    const { spriteManager } = gameContext;

    if(typeID) {
        const sprite = spriteManager.getSprite(this.spriteIndex);

        spriteManager.updateSprite(this.spriteIndex, typeID);
        sprite.show();
    }
}

Hover.prototype.createSprite = function(gameContext) {
    if(this.spriteIndex !== -1) {
        return;
    }

    const { spriteManager } = gameContext;
    const actorSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.UI);
    const spriteID = actorSprite.getIndex();

    this.spriteIndex = spriteID;
}