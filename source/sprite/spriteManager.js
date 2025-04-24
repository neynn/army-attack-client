import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ImageManager } from "../resources/imageManager.js";
import { ObjectPool } from "../objectPool.js";
import { Graph } from "../graphics/graph.js";
import { SpriteGraphics } from "./spriteGraphics.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteManager = function() {
    this.resources = new ImageManager();
    this.graphics = new SpriteGraphics();
    this.sprites = new ObjectPool(2500, (index) => this.allocateSprite(index));
    this.sprites.allocate();
    this.timestamp = 0;

    this.layers = [];
    this.layers[SpriteManager.LAYER.BOTTOM] = [];
    this.layers[SpriteManager.LAYER.MIDDLE] = [];
    this.layers[SpriteManager.LAYER.TOP] = [];
    this.layers[SpriteManager.LAYER.UI] = [];

    this.resources.events.on(ImageManager.EVENT.IMAGE_LOAD, (imageID, image) => {
        this.graphics.onImageLoad(imageID, image);
    }, { permanent: true });
}

SpriteManager.LAYER = {
    BOTTOM: 0,
    MIDDLE: 1,
    TOP: 2,
    UI: 3
};

SpriteManager.prototype.allocateSprite = function(index) {
    const sprite = new Sprite(index, index);

    sprite.addHook(Graph.HOOK.DRAW, (context, localX, localY) => this.graphics.drawSprite(context, sprite, localX, localY));
    sprite.onTerminate = () => this.destroySprite(index);

    return sprite;
}

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return [];
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.preloadAtlas = function(atlasID) {
    this.resources.requestImage(atlasID);
    this.resources.addReference(atlasID);
}

SpriteManager.prototype.load = function(spriteTypes) {
    if(!spriteTypes) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteTypes does not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    this.graphics.load(spriteTypes);
    this.resources.createImages(spriteTypes);
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

    this.updateSprite(sprite.index, typeID, animationID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.destroySprite", { "spriteID": spriteIndex });
        return [];
    }
    
    const familyStack = sprite.getGraph();
    const invalidElements = [];

    for(let i = familyStack.length - 1; i >= 0; i--) {
        const element = familyStack[i];

        if(!element.isType(Graph.TYPE.SPRITE)) {
            invalidElements.push(element);
            continue;
        }

        const index = element.getIndex();
        const isReserved = this.sprites.isReserved(index);

        if(!isReserved) {
            continue;
        }

        element.closeGraph();

        this.removeSpriteFromLayers(index);
        this.sprites.freeElement(index);
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

SpriteManager.prototype.updateSprite = function(spriteIndex, typeID, animationID = SpriteAtlas.DEFAULT.ANIMATION_ID) {
    const sprite = this.sprites.getReservedElement(spriteIndex);
    
    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    const spriteID = this.graphics.getSpriteIndex(typeID, animationID);

    if(spriteID !== SpriteAtlas.ID.INVALID && !sprite.isEqual(spriteID)) {
        const graphic = this.graphics.getGraphic(spriteID);
        const spriteAtlas = this.graphics.getAtlas(typeID);
        const { boundsX, boundsY, boundsW, boundsH } = spriteAtlas;
        const frameCount = graphic.getFrameCount();
        const frameTime = graphic.getFrameTime();

        sprite.init(typeID, spriteID, frameCount, frameTime, this.timestamp);
        sprite.setBounds(boundsX, boundsY, boundsW, boundsH);

        this.resources.requestImage(typeID);
    }
}