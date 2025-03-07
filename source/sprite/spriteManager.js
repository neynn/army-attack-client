import { Logger } from "../logger.js";
import { ImageSheet } from "../graphics/imageSheet.js";
import { Sprite } from "./sprite.js";
import { ImageManager } from "../resources/imageManager.js";
import { SpriteSheet } from "../graphics/spriteSheet.js";
import { ObjectPool } from "../objectPool.js";
import { Drawable } from "../graphics/drawable.js";

export const SpriteManager = function() {
    this.resources = new ImageManager();
    this.sprites = new ObjectPool(2000);
    this.spriteTypes = {};
    this.timestamp = 0;

    this.sprites.allocate((index) => new Sprite(index, index));

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

SpriteManager.prototype.load = function(spriteTypes) {
    if(!spriteTypes) {
        Logger.log(Logger.CODE.ENGINE_WARN, "SpriteTypes does not exist!", "SpriteManager.prototype.load", null);
        return;
    }

    for(const typeID in spriteTypes) {
        const spriteType = spriteTypes[typeID];
        const imageSheet = new SpriteSheet();

        imageSheet.load(spriteType);
        imageSheet.defineDefaultAnimation();

        this.spriteTypes[typeID] = imageSheet;
    }

    this.resources.createImages(spriteTypes);
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
}

SpriteManager.prototype.clear = function() {
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
    sprite.onDraw = (context, localX, localY) => this.drawSprite(sprite, context, localX, localY);
    sprite.onTerminate = () => this.destroySprite(sprite.index);

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.index, typeID, animationID);

    return sprite;
}

SpriteManager.prototype.drawSprite = function(sprite, context, localX, localY) {
    const { typeID, animationID, currentFrame, flags } = sprite;
    const spriteBuffer = this.resources.getImage(typeID);

    if(!spriteBuffer) {
        return;
    }

    const isFlipped = (flags & Sprite.FLAG.FLIP) !== 0;
    const spriteType = this.spriteTypes[typeID];
    const spriteBounds = spriteType.getBounds();
    const animationType = spriteType.getAnimation(animationID);
    const animationFrame = animationType.getFrame(currentFrame);

    for(let i = 0; i < animationFrame.length; i++) {
        const { shiftX, shiftY, frame } = animationFrame[i];
        const { x, y, w, h, offset } = frame;
        const renderX = localX + offset.x + shiftX;
        const renderY = localY + offset.y + shiftY;

        if(isFlipped) {
            const drawX = renderX - (spriteBounds.x + w);
            const drawY = renderY + spriteBounds.y;
    
            context.translate(drawX + w, 0);
            context.scale(-1, 1);
            context.drawImage(spriteBuffer, x, y, w, h, 0, drawY, w, h);
        } else {
            const drawX = renderX + spriteBounds.x;
            const drawY = renderY + spriteBounds.y;
    
            context.drawImage(spriteBuffer, x, y, w, h, drawX, drawY, w, h);
        }
    }
}

SpriteManager.prototype.destroySprite = function(spriteIndex) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    if(!sprite) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Sprite is not reserved!", "SpriteManager.prototype.destroySprite", { "spriteID": spriteIndex });
        return [];
    }
    
    const familyStack = sprite.getReferenceStack();
    const invalidElements = [];

    for(let i = familyStack.length - 1; i >= 0; i--) {
        const element = familyStack[i];

        if(element.type !== Drawable.TYPE.SPRITE) {
            invalidElements.push(element);
            continue;
        }

        const index = element.getIndex();
        const isReserved = this.sprites.isReserved(index);

        if(!isReserved) {
            continue;
        }

        element.closeFamily();

        this.removeSpriteFromLayers(index);
        this.sprites.freeElement(index);
    }
    
    return invalidElements;
}

SpriteManager.prototype.getSprite = function(spriteIndex) {
    const sprite = this.sprites.getReservedElement(spriteIndex);

    return sprite;
}

SpriteManager.prototype.swapLayer = function(layerIndex, spriteIndex) {
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
    this.addToLayer(layerIndex, sprite);
}

SpriteManager.prototype.addToLayer = function(layerIndex, sprite) {
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

SpriteManager.prototype.updateSprite = function(spriteIndex, typeID, animationID = ImageSheet.DEFAULT_ANIMATION_ID) {
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
        const { x, y, w, h } = spriteType.getBounds();
        const frameCount = animationType.getFrameCount();
        const frameTime = animationType.getFrameTime();

        sprite.init(typeID, animationID, frameCount, frameTime, this.timestamp);
        sprite.setBounds(x, y, w, h);
    }
}