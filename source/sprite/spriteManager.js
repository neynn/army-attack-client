import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ObjectPool } from "../objectPool.js";
import { SpriteGraphics } from "./spriteGraphics.js";

export const SpriteManager = function() {
    this.graphics = new SpriteGraphics();
    this.spriteTracker = new Set();
    this.sprites = new ObjectPool(1024, (index) => new Sprite(this, index, index));
    this.sprites.allocate();
    this.timestamp = 0;

    this.layers = [];
    this.layers[SpriteManager.LAYER.BOTTOM] = [];
    this.layers[SpriteManager.LAYER.MIDDLE] = [];
    this.layers[SpriteManager.LAYER.TOP] = [];
    this.layers[SpriteManager.LAYER.UI] = [];
}

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

SpriteManager.prototype.load = function(textures, sprites) {
    if(!textures || !sprites) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Textures/Sprites do not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    this.graphics.load(textures, sprites);
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
}

SpriteManager.prototype.exit = function() {
    this.spriteTracker.clear();
    this.sprites.forAllReserved((sprite) => sprite.closeGraph());
    this.sprites.reset();

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null) {
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

    this.spriteTracker.add(spriteID);
    this.updateSpriteGraphics(sprite, typeID);

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

SpriteManager.prototype.updateSpriteGraphics = function(sprite, spriteID) {
    const containerID = this.graphics.getContainerID(spriteID);
    const container = this.graphics.getContainer(containerID);

    if(!container) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Container does not exist!", "SpriteManager.prototype.updateSpriteGraphics", { "containerID": containerID });
        return;
    }

    if(!sprite.isEqual(containerID)) {
        const { frameTime, frameCount, bounds } = container;
        const { x, y, w, h } = bounds;

        sprite.init(spriteID, containerID, frameCount, frameTime, this.timestamp);
        sprite.setBounds(x, y, w, h);
        
        this.graphics.loadBitmap(spriteID);
    }
}

SpriteManager.prototype.updateSprite = function(spriteIndex, spriteID) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    this.updateSpriteGraphics(sprite, spriteID);
}