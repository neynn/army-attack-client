import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./drawable/sprite.js";
import { EventEmitter } from "../events/eventEmitter.js";
import { ImageManager } from "../resources/imageManager.js";

export const SpriteManager = function() {
    this.resources = new ImageManager();
    this.idGenerator = new IDGenerator("@SPRITE");
    this.sprites = new Map();
    this.spriteTypes = {};
    this.timestamp = 0;
    this.layers = {
        [SpriteManager.LAYER_BOTTOM]: [],
        [SpriteManager.LAYER_MIDDLE]: [],
        [SpriteManager.LAYER_TOP]: []
    };
}

SpriteManager.LAYER_BOTTOM = 0;
SpriteManager.LAYER_MIDDLE = 1;
SpriteManager.LAYER_TOP = 2;

SpriteManager.prototype.getLayer = function(layerID) {
    return this.layers[layerID];
}

SpriteManager.prototype.load = function(spriteTypes) {
    if(typeof spriteTypes !== "object") {
        Logger.log(false, "SpriteTypes cannot be undefined!", "SpriteManager.prototype.load", null);
        return;
    }

    for(const typeID in spriteTypes) {
        const spriteType = spriteTypes[typeID];
        const imageSheet = new ImageSheet(typeID);

        imageSheet.load(spriteType);
        imageSheet.defineDefaultAnimation();

        this.spriteTypes[typeID] = imageSheet;
    }

    const usedMB = [];
    const usedMBLarge = [];

    this.resources.loadImages(spriteTypes, ((key, image) => {
        const imageSize = image.width * image.height * 4;
        const imageSizeMB = imageSize / ImageManager.SIZE_MB;
    
        if(imageSize >= ImageManager.SIZE_BIG_IMAGE) {
          usedMBLarge.push({
            "imageID": key,
            "imageSizeMB": imageSizeMB
          });
        }
    
        usedMB.push({
          "imageID": key,
          "imageSizeMB": imageSizeMB
        });
    }), (key, error) => console.error(key, error));

    console.log(usedMB, usedMBLarge);
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
}

SpriteManager.prototype.clear = function() {
    this.sprites.clear();
    this.idGenerator.reset();

    for(const layerID in this.layers) {
        this.layers[layerID] = [];
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID = null, animationID) {
    if(!this.spriteTypes[typeID]) {
        return null;
    }

    const spriteID = this.idGenerator.getID();
    const sprite = new Sprite(spriteID, typeID);
    
    sprite.onDraw = (context, viewportX, viewportY, localX, localY) => {
        const drawData = sprite.getDrawData();

        this.drawSprite(drawData, context, viewportX, viewportY, localX, localY);
    }

    sprite.setLastCallTime(this.timestamp);
    sprite.events.subscribe(Sprite.EVENT_TERMINATE, EventEmitter.SUPER_SUBSCRIBER_ID, (sprite) => this.destroySprite(sprite.id));

    this.sprites.set(sprite.id, sprite);

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.id, typeID, animationID);
    this.resources.addReference(typeID);

    return sprite;
}

SpriteManager.prototype.drawSprite = function(drawData, context, viewportX, viewportY, localX, localY) {
    const { typeID, animationID, frame, isFlipped } = drawData;
    const spriteBuffer = this.resources.getImage(typeID);

    if(!spriteBuffer) {
        return;
    }

    const spriteType = this.spriteTypes[typeID];
    const spriteBounds = spriteType.getBounds();
    const animationType = spriteType.getAnimation(animationID);
    const animationFrame = animationType.getFrame(frame);

    for(const component of animationFrame) {
        const { id, shiftX, shiftY } = component;
        const { x, y, w, h, offset } = spriteType.getFrameByID(id);
        const renderX = localX - viewportX + offset.x + shiftX;
        const renderY = localY - viewportY + offset.y + shiftY;

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
    const otherDrawables = [];

    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.destroySprite", { spriteID });
        return otherDrawables;
    }
    
    const familyStack = sprite.getFamilyStack();

    for(let i = familyStack.length - 1; i >= 0; i--) {
        const drawableID = familyStack[i];
        const sprite = this.sprites.get(drawableID);

        if(!sprite) {
            otherDrawables.push(drawableID);
            continue;
        }

        sprite.closeFamily();

        for(const layerID in this.layers) {
            this.removeFromLayer(sprite, layerID);
        }

        this.sprites.delete(drawableID);
    }

    return otherDrawables;
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        return null;
    }

    return sprite;
}

SpriteManager.prototype.addToLayer = function(layerID, sprite) {
    const layer = this.layers[layerID];

    if(!layer) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.addToLayer", { layerID });
        return;
    }

    const index = layer.findIndex(member => member.id === sprite.id);

    if(index !== -1) {
        Logger.log(false, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", { layerID });
        return;
    }

    layer.push(sprite);
} 

SpriteManager.prototype.removeFromLayer = function(sprite, layerID) {
    const layer = this.layers[layerID];

    if(!layer) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.removeFromLayer", { layerID });
        return;
    }

    const index = layer.findIndex(member => member.id === sprite.id);

    if(index === -1) {
        Logger.log(false, "Sprite does not exist on layer!", "SpriteManager.prototype.removeFromLayer", { layerID });
        return;
    }

    layer.splice(index, 1);
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

        sprite.initialize(typeID, animationID, animationType.frameCount, animationType.frameTime);
        sprite.setBounds(x, y, w, h);

        this.resources.addReference(typeID);
        this.resources.removeReference(drawData.typeID);
    }
}