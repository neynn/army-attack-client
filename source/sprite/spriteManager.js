import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ObjectPool } from "../objectPool.js";
import { SpriteGraphics } from "./spriteGraphics.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteManager = function() {
    this.graphics = new SpriteGraphics();
    this.spriteTracker = new Set();
    this.sprites = new ObjectPool(2500, (index) => new Sprite(this, index, index));
    this.sprites.allocate();
    this.timestamp = 0;

    this.layers = [];
    this.layers[SpriteManager.LAYER.BOTTOM] = [];
    this.layers[SpriteManager.LAYER.MIDDLE] = [];
    this.layers[SpriteManager.LAYER.TOP] = [];
    this.layers[SpriteManager.LAYER.UI] = [];
}

SpriteManager.DEFAULT_ANIMATION_ID = "default";

SpriteManager.LAYER = {
    BOTTOM: 0,
    MIDDLE: 1,
    TOP: 2,
    UI: 3
};

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return [];
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.preloadAtlas = function(atlasID) {
    this.graphics.resources.requestBitmap(atlasID);
    this.graphics.resources.addReference(atlasID);
}

SpriteManager.prototype.load = function(spriteTypes) {
    if(!spriteTypes) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteTypes does not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    this.graphics.load(spriteTypes);
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
}

SpriteManager.prototype.exit = function() {
    this.sprites.freeAll();

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null, animationID) {
    const sprite = this.sprites.reserveElement();

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "SpritePool is full!", "SpriteManager.prototype.createSprite", null);
        return null;
    }

    sprite.reset();

    if(layerID !== null) {
        this.addToLayer(sprite, layerID);
    }

    const spriteID = sprite.getID();
    const spriteIndex = sprite.getIndex();

    this.spriteTracker.add(spriteID);
    this.updateSprite(spriteIndex, typeID, animationID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.destroySprite", { "spriteID": spriteIndex });
        return [];
    }
    
    const graph = sprite.getGraph();
    const invalidElements = [];

    for(let i = graph.length - 1; i >= 0; i--) {
        const node = graph[i];
        const nodeID = node.getID();

        if(!this.spriteTracker.has(nodeID)) {
            invalidElements.push(node);
            continue;
        }

        const index = node.getIndex();
        const isReserved = this.sprites.isReserved(index);

        if(!isReserved) {
            continue;
        }

        node.closeGraph();

        this.removeSpriteFromLayers(index);
        this.sprites.freeElement(index);
        this.spriteTracker.delete(nodeID);
    }
    
    return invalidElements;
}

SpriteManager.prototype.getSprite = function(spriteIndex) {
    return this.sprites.getReservedElement(spriteIndex);
}

SpriteManager.prototype.swapLayer = function(spriteIndex, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist!", "SpriteManager.prototype.swapLayer", { "layer": layerIndex });
        return;
    }

    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.swapLayer", { "spriteID": spriteIndex });
        return;
    }

    this.removeSpriteFromLayers(spriteIndex);
    this.addToLayer(sprite, layerIndex);
}

SpriteManager.prototype.addToLayer = function(sprite, layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist!", "SpriteManager.prototype.addToLayer", { "layer": layerIndex });
        return;
    }

    const layer = this.layers[layerIndex];
    const index = layer.findIndex(member => member.index === sprite.index);

    if(index !== -1) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", { "layer": layerIndex });
        return;
    }

    layer.push(sprite);
}

SpriteManager.prototype.removeSpriteFromLayers = function(spriteIndex) {
    for(let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i];
        const index = layer.findIndex(member => member.index === spriteIndex);

        if(index !== -1) {
            layer[index] = layer[layer.length - 1];
            layer.pop();
        }
    }
}

SpriteManager.prototype.updateSprite = function(spriteIndex, atlasID, animationID) {
    const sprite = this.sprites.getReservedElement(spriteIndex);
    
    console.log("ATT", atlasID, animationID);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    const atlas = this.graphics.getAtlas(atlasID);

    if(!atlas) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Atlast does not exist!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    const spriteID = animationID ?? SpriteManager.DEFAULT_ANIMATION_ID;
    const index = atlas.getSpriteIndex(spriteID);
    const container = this.graphics.getContainer(index);

    if(container && !sprite.isEqual(index)) {
        const { boundsX, boundsY, boundsW, boundsH } = atlas;
        const frameCount = container.getFrameCount();
        const frameTime = container.getFrameTime();

        sprite.init(atlasID, index, frameCount, frameTime, this.timestamp);
        sprite.setBounds(boundsX, boundsY, boundsW, boundsH);
    }
}