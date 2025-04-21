import { Logger } from "../logger.js";
import { Sprite } from "./sprite.js";
import { ImageManager } from "../resources/imageManager.js";
import { SpriteSheet } from "./spriteSheet.js";
import { ObjectPool } from "../objectPool.js";
import { Graph } from "../graphics/graph.js";

export const SpriteManager = function() {
    this.resources = new ImageManager();
    this.sprites = new ObjectPool(2500, (index) => this.allocateSprite(index));
    this.sprites.allocate();
    this.spriteTypes = {};
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

SpriteManager.prototype.allocateSprite = function(index) {
    const sprite = new Sprite(index, index);

    sprite.addHook(Graph.HOOK.DRAW, (context, localX, localY) => this.drawSprite(sprite, context, localX, localY));
    sprite.onTerminate = () => this.destroySprite(index);

    return sprite;
}

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return [];
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.requestSprite = function(imageID) {
    if(this.resources.isImageLoadable(imageID)) {
        this.resources.requestImage(imageID, (id, image, sheet) => {
            //console.log("LOADED IMAGE", id);
        });
    }

    this.resources.addReference(imageID);
}

SpriteManager.prototype.load = function(spriteTypes) {
    if(!spriteTypes) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteTypes does not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    const spriteKeys = Object.keys(spriteTypes);

    for(let i = 0; i < spriteKeys.length; i++) {
        const typeID = spriteKeys[i];
        const spriteType = spriteTypes[typeID];
        const imageSheet = new SpriteSheet();

        imageSheet.load(spriteType);

        this.spriteTypes[typeID] = imageSheet;
    }

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

SpriteManager.prototype.drawSprite = function(sprite, context, localX, localY) {
    const { typeID, animationID, currentFrame, flags, boundsX, boundsY } = sprite;
    const bitmap = this.resources.getImageBitmap(typeID);

    if(!bitmap) {
        return;
    }

    const isFlipped = (flags & Sprite.FLAG.FLIP) !== 0;
    const spriteType = this.spriteTypes[typeID];
    const animationType = spriteType.getAnimation(animationID);
    const animationFrame = animationType.getFrame(currentFrame);

    if(!animationFrame) {
        return;
    }

    if(isFlipped) {
        const renderX = (localX - boundsX) * -1;
        const renderY = localY + boundsY;

        context.scale(-1, 1);

        for(let i = 0; i < animationFrame.length; i++) {
            const { frameX, frameY, frameW, frameH, shiftX, shiftY } = animationFrame[i];
            const drawX = renderX - shiftX;
            const drawY = renderY + shiftY;
            
            context.drawImage(
                bitmap,
                frameX, frameY, frameW, frameH,
                drawX, drawY, frameW, frameH
            );
        }
    } else {
        const renderX = localX + boundsX;
        const renderY = localY + boundsY;

        for(let i = 0; i < animationFrame.length; i++) {
            const { frameX, frameY, frameW, frameH, shiftX, shiftY } = animationFrame[i];
            const drawX = renderX + shiftX;
            const drawY = renderY + shiftY;

            context.drawImage(
                bitmap,
                frameX, frameY, frameW, frameH,
                drawX, drawY, frameW, frameH
            );
        }
    }
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

SpriteManager.prototype.updateSprite = function(spriteIndex, typeID, animationID = SpriteSheet.DEFAULT.ANIMATION_ID) {
    const sprite = this.sprites.getReservedElement(spriteIndex);
    
    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.updateSprite", { "spriteID": spriteIndex });
        return;
    }

    const spriteType = this.spriteTypes[typeID];

    if(!spriteType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteType does not exist!", "SpriteManager.prototype.updateSprite", { "typeID": typeID });
        return;
    }

    const animationType = spriteType.getAnimation(animationID);

    if(!animationType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "AnimationType does not exist!", "SpriteManager.prototype.updateSprite", { "animationID": animationID, "typeID": typeID });
        return;
    }

    const isEqual = sprite.isEqual(typeID, animationID);

    if(!isEqual) {
        const { boundsX, boundsY, boundsW, boundsH } = spriteType;
        const frameCount = animationType.getFrameCount();
        const frameTime = animationType.getFrameTime();

        sprite.init(typeID, animationID, frameCount, frameTime, this.timestamp);
        sprite.setBounds(boundsX, boundsY, boundsW, boundsH);
    }
}