import { EntityManager } from "../../../source/entity/entityManager.js";
import { SpriteManager } from "../../../source/sprite/spriteManager.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { ArmyEntity } from "../../init/armyEntity.js";

export const PlayerCursor = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.spriteIndex = -1;
    this.nodeMap = new Map();
    this.state = PlayerCursor.STATE.NONE;
    this.currentTarget = EntityManager.ID.INVALID;
    this.lastTarget = EntityManager.ID.INVALID;
    this.targetChanged = false;
}

PlayerCursor.STATE = {
    NONE: 0,
    HOVER_ON_ENTITY: 1,
    HOVER_ON_NODE: 2
};

PlayerCursor.prototype.updateState = function() {
    const onEntity = this.currentTarget !== EntityManager.ID.INVALID;

    if(onEntity) {
        this.state = PlayerCursor.STATE.HOVER_ON_ENTITY;
        return;
    }

    const nodeKey = this.getNodeKey(this.tileX, this.tileY)
    const onNode = this.nodeMap.has(nodeKey);

    if(onNode) {
        this.state = PlayerCursor.STATE.HOVER_ON_NODE;
        return;
    }

    this.state = PlayerCursor.STATE.NONE;
}

PlayerCursor.prototype.getEntity = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    
    if(this.currentTarget === EntityManager.ID.INVALID) {
        return null;
    }

    const entity = entityManager.getEntity(this.currentTarget);

    return entity;
}

PlayerCursor.prototype.clearNodes = function() {
    this.nodeMap.clear();
}

PlayerCursor.prototype.updateNodes = function(gameContext, nodeList) {
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

PlayerCursor.prototype.getNodeKey = function(nodeX, nodeY) {
    return `${nodeX}-${nodeY}`;
}

PlayerCursor.prototype.update = function(gameContext) {
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

PlayerCursor.prototype.autoAlignSprite = function(gameContext, camera) {
    switch(this.state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
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

PlayerCursor.prototype.alignSprite = function(gameContext, camera) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { x, y } = camera.transformTileToPositionCenter(this.tileX, this.tileY);

    sprite.setPosition(x, y);
}

PlayerCursor.prototype.alignSpriteEntity = function(gameContext, camera, entity) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    sprite.setPosition(x, y);
}

PlayerCursor.prototype.hideSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);

    sprite.hide();
}

PlayerCursor.prototype.updateSprite = function(gameContext, typeID) {
    const { spriteManager } = gameContext;

    if(typeID) {
        const sprite = spriteManager.getSprite(this.spriteIndex);

        spriteManager.updateSprite(this.spriteIndex, typeID);
        sprite.show();
    }
}

PlayerCursor.prototype.createSprite = function(gameContext) {
    if(this.spriteIndex !== -1) {
        return;
    }

    const { spriteManager } = gameContext;
    const actorSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.UI);
    const spriteID = actorSprite.getIndex();

    this.spriteIndex = spriteID;
}