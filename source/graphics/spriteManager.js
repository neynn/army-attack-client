import { Logger } from "../logger.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./drawable/sprite.js";
import { ImageManager } from "../resources/imageManager.js";
import { SpriteSheet } from "./spriteSheet.js";

export const SpriteManager = function() {
    this.resources = new ImageManager();
    this.sprites = new Map();
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

SpriteManager.prototype.getLayer = function(layerIndex) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        return [];
    }

    return this.layers[layerIndex];
}

SpriteManager.prototype.load = function(spriteTypes) {
    if(typeof spriteTypes !== "object") {
        Logger.log(false, "SpriteTypes cannot be undefined!", "SpriteManager.prototype.load", null);
        return;
    }

    for(const typeID in spriteTypes) {
        const spriteType = spriteTypes[typeID];
        const imageSheet = new SpriteSheet();

        imageSheet.load(spriteType);
        imageSheet.defineDefaultAnimation();

        this.spriteTypes[typeID] = imageSheet;
    }

    const usedMB = [];
    const usedMBLarge = [];

    this.resources.createImages(spriteTypes);
    this.resources.requestAllImages((imageID, image, sheet) => {
        const imageSize = image.width * image.height * 4;
        const imageSizeMB = imageSize / ImageManager.SIZE_MB;
    
        usedMB.push({
            "imageID": imageID,
            "imageSizeMB": imageSizeMB
        });

        if(imageSize >= ImageManager.SIZE_BIG_IMAGE) {
            usedMBLarge.push({
                "imageID": imageID,
                "imageSizeMB": imageSizeMB
            });
        }
    });

    console.log(usedMB, usedMBLarge);
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
}

SpriteManager.prototype.clear = function() {
    this.sprites.clear();

    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].length = 0;
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null, animationID) {
    if(!this.spriteTypes[typeID]) {
        return null;
    }

    const sprite = new Sprite(typeID);

    sprite.onDraw = (context, localX, localY) => this.drawSprite(sprite, context, localX, localY);
    sprite.onTerminate = (id) => this.destroySprite(id);
    sprite.setLastCallTime(this.timestamp);

    this.sprites.set(sprite.id, sprite);

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.id, typeID, animationID);
    this.resources.addReference(typeID);

    return sprite;
}

SpriteManager.prototype.drawSprite = function(sprite, context, localX, localY) {
    const { typeID, animationID, currentFrame, isFlipped } = sprite;
    const spriteBuffer = this.resources.getImage(typeID);

    if(!spriteBuffer) {
        return;
    }

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

SpriteManager.prototype.destroySprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);
    const unknownElements = [];

    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.destroySprite", { spriteID });
        return unknownElements;
    }
    
    const familyStack = sprite.getReferenceStack();

    for(let i = familyStack.length - 1; i >= 0; i--) {
        const id = familyStack[i];
        const sprite = this.sprites.get(id);

        if(!sprite) {
            unknownElements.push(id);
            continue;
        }

        sprite.closeFamily();

        this.removeSpriteFromLayers(id);
        this.sprites.delete(id);
    }

    return unknownElements;
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        return null;
    }

    return sprite;
}

SpriteManager.prototype.swapLayer = function(layerIndex, spriteID) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.swapLayer", { layerIndex });
        return;
    }

    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.swapLayer", { layerIndex });
        return;
    }

    this.removeSpriteFromLayers(spriteID);
    this.addToLayer(layerIndex, sprite);
}

SpriteManager.prototype.addToLayer = function(layerIndex, sprite) {
    if(layerIndex < 0 || layerIndex >= this.layers.length) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.addToLayer", { layerIndex });
        return;
    }

    const layer = this.layers[layerIndex];
    const index = layer.findIndex(member => member.id === sprite.id);

    if(index !== -1) {
        Logger.log(false, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", { layerIndex });
        return;
    }

    layer.push(sprite);
}

SpriteManager.prototype.removeSpriteFromLayers = function(spriteID) {
    for(let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i];
        const index = layer.findIndex(member => member.id === spriteID);

        if(index !== -1) {
            layer[index] = layer[layer.length - 1];
            layer.pop();
        }
    }
}

SpriteManager.prototype.updateSprite = function(spriteID, typeID, animationID = ImageSheet.DEFAULT_ANIMATION_ID) {
    const sprite = this.sprites.get(spriteID);
    
    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.updateSprite", { spriteID });
        return;
    }

    const spriteType = this.spriteTypes[typeID];

    if(!spriteType) {
        Logger.log(false, "SpriteType does not exist!", "SpriteManager.prototype.updateSprite", { spriteID, typeID });
        return;
    }

    const animationType = spriteType.getAnimation(animationID);

    if(!animationType) {
        Logger.log(false, "AnimationType does not exist!", "SpriteManager.prototype.updateSprite", { spriteID, typeID, animationID });
        return;
    }

    const drawData = sprite.getDrawData();

    if(drawData.typeID !== typeID || drawData.animationID !== animationID) {
        const { x, y, w, h } = spriteType.getBounds();
        const frameCount = animationType.getFrameCount();
        const frameTime = animationType.getFrameTime();

        sprite.init(typeID, animationID, frameCount, frameTime);
        sprite.setBounds(x, y, w, h);

        this.resources.addReference(typeID);
        this.resources.removeReference(drawData.typeID);
    }
}