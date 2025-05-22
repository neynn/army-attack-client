import { EntityManager } from "../../../source/entity/entityManager.js";
import { SpriteManager } from "../../../source/sprite/spriteManager.js";
import { PathfinderSystem } from "../../systems/pathfinder.js";
import { ArmyEntity } from "../../init/armyEntity.js";

export const PlayerCursor = function(camera) {
    this.camera = camera;
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
    HOVER_ON_NODE: 2,
    HOVER_ON_DEBRIS: 3
};

PlayerCursor.prototype.updateState = function(gameContext, tileX, tileY) {
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

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const isDebris = worldMap.hasDebris(tileX, tileY);

        if(isDebris) {
            this.state = PlayerCursor.STATE.HOVER_ON_DEBRIS;
            return;
        }
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

    this.updateState(gameContext, x, y);
}

PlayerCursor.prototype.autoAlignSprite = function(gameContext) {
    switch(this.state) {
        case PlayerCursor.STATE.HOVER_ON_ENTITY: {
            const hoverEntity = this.getEntity(gameContext);
            this.alignSpriteEntity(gameContext, hoverEntity);
            break;
        }
        default: {
            this.alignSprite(gameContext);
            break;
        }
    }
}

PlayerCursor.prototype.alignSprite = function(gameContext) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { x, y } = transform2D.transformTileToWorldCenter(this.tileX, this.tileY);

    sprite.setPosition(x, y);
}

PlayerCursor.prototype.alignSpriteEntity = function(gameContext, entity) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);
    const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

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