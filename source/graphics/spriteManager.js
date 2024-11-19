import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./drawable/sprite.js";
import { EventEmitter } from "../events/eventEmitter.js";

export const SpriteManager = function() {
    this.timestamp = 0;
    this.spriteTypes = {};
    this.sprites = new Map();
    this.spriteReferences = new Map();
    this.idGenerator = new IDGenerator("@SPRITE");
    this.layers = {
        [SpriteManager.LAYER_BOTTOM]: [],
        [SpriteManager.LAYER_MIDDLE]: [],
        [SpriteManager.LAYER_TOP]: []
    };
    this.drawOrder = [
        SpriteManager.LAYER_BOTTOM,
        SpriteManager.LAYER_MIDDLE,
        SpriteManager.LAYER_TOP
    ];
}

SpriteManager.LAYER_BOTTOM = 0;
SpriteManager.LAYER_MIDDLE = 1;
SpriteManager.LAYER_TOP = 2;

SpriteManager.prototype.load = function(spriteTypes) {
    if(typeof spriteTypes === "object") {
        this.spriteTypes = spriteTypes;
    } else {
        Logger.log(false, "SpriteTypes cannot be undefined!", "SpriteManager.prototype.load", null);
    }
}

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.timestamp = realTime;
    //TODO: Update random sprites! (like desert clouds, ect.)
}

SpriteManager.prototype.removeSpriteReference = function(spriteID) {
    if(!this.spriteTypes[spriteID]) {
        Logger.log(false, "SpriteType does not exist!", "SpriteManager.prototype.removeSpriteReference", { spriteID });

        return false;
    }

    const count = this.spriteReferences.get(spriteID);

    if(count !== undefined) {
        this.spriteReferences.set(spriteID, count - 1);

        if(count - 1 <= 0) {
            this.spriteReferences.delete(spriteID);
            //UNLOAD THE SPRITE!
        }
    }

    return true;
}

SpriteManager.prototype.addSpriteReference = function(spriteID) {
    if(!this.spriteTypes[spriteID]) {
        Logger.log(false, "SpriteType does not exist!", "SpriteManager.prototype.addSpriteReference", { spriteID });

        return false;
    }

    const count = this.spriteReferences.get(spriteID);

    if(count === undefined) {
        this.spriteReferences.set(spriteID, 1);
        this.spriteTypes[spriteID].toBuffer();
    } else {
        this.spriteReferences.set(spriteID, count + 1);
    }

    return true;
}

SpriteManager.prototype.end = function() {
    this.sprites.clear();
    this.idGenerator.reset();

    for(const layerID in this.layers) {
        this.layers[layerID] = [];
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID, animationID) {
    if(!this.spriteTypes[typeID]) {
        return null;
    }

    const spriteID = this.idGenerator.getID();
    const sprite = new Sprite(spriteID, typeID);
    
    sprite.onDraw = (context, viewportX, viewportY, localX, localY) => this.drawSprite(sprite, context, viewportX, viewportY, localX, localY);
    sprite.setLastCallTime(this.timestamp);
    sprite.events.subscribe(Sprite.TERMINATE, EventEmitter.SUPER_SUBSCRIBER_ID, (sprite) => this.destroySprite(sprite.id));

    this.sprites.set(sprite.id, sprite);

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.id, typeID, animationID);
    this.addSpriteReference(typeID);

    return sprite;
}

SpriteManager.prototype.drawSprite = function(sprite, context, viewportX, viewportY, localX, localY) {
    const { typeID, animationID, currentFrame, isFlipped } = sprite;

    const spriteType = this.spriteTypes[typeID];
    const spriteBuffer = spriteType.getImage();
    const spriteBounds = spriteType.getBounds();
    const animationType = spriteType.getAnimation(animationID);
    const animationFrame = animationType.getFrame(currentFrame);

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
    const nonSpriteDrawables = [];

    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.destroySprite", { spriteID });

        return nonSpriteDrawables;
    }
    
    const familyStack = sprite.getFamilyStack();

    for(let i = familyStack.length - 1; i >= 0; i--) {
        const drawableID = familyStack[i];

        if(!this.sprites.has(drawableID)) {
            nonSpriteDrawables.push(drawableID);
            continue;
        }

        const sprite = this.sprites.get(drawableID);
        const layerID = sprite.getLayerID();

        sprite.closeFamily();

        if(layerID !== null) {
            this.removeFromLayer(layerID, sprite);
        }
    
        this.sprites.delete(drawableID);
    }

    return nonSpriteDrawables;
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        return null;
    }

    return sprite;
}

SpriteManager.prototype.addSpriteToDrawable = function(drawable, childName, typeID, animationID) {
    const sprite = this.createSprite(typeID, null, animationID);

    if(!sprite) {
        return false;
    }

    drawable.addChild(sprite, childName);

    return sprite;
}

SpriteManager.prototype.createChildSprite = function(spriteID, childTypeID, childName = Symbol("AUTO")) {
    const parent = this.sprites.get(spriteID);

    if(!parent) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.createChildSprite", {spriteID, childTypeID, childName});

        return null;
    }

    if(parent.hasChild(childName)) {
        Logger.log(false, "Child already exists!", "SpriteManager.prototype.createChildSprite", {spriteID, childTypeID, childName})

        return null;
    }

    const childSprite = this.createSprite(childTypeID, null);

    parent.addChild(childSprite, childName);

    return childSprite;
}

SpriteManager.prototype.destroyChildSprite = function(parentID, childName) {
    const parent = this.sprites.get(parentID);

    if(!parent) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.destroyChildSprite", {parentID, childName});
        
        return false;
    }

    const child = parent.getChild(childName);

    if(!child) {
        Logger.log(false, "Child does not exist!", "SpriteManager.prototype.destroyChildSprite", {parentID, childName});

        return false;
    }

    const reference = child.getReference();
    const referenceID = reference.getID();

    this.destroySprite(referenceID);
    
    return true;
}

SpriteManager.prototype.addToLayer = function(layerID, sprite) {
    if(this.layers[layerID] === undefined) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.addToLayer", { layerID });

        return false;
    }

    const layer = this.layers[layerID];
    const index = layer.findIndex(member => member.id === sprite.id);

    if(index !== -1) {
        Logger.log(false, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", { layerID });

        return false;
    }

    layer.push(sprite);
    sprite.setLayerID(layerID);

    return true;
} 

SpriteManager.prototype.removeFromLayer = function(layerID, sprite) {
    if(this.layers[layerID] === undefined) {
        Logger.log(false, "Layer does not exist!", "SpriteManager.prototype.removeFromLayer", { layerID });

        return false;
    }

    const layer = this.layers[layerID];
    const index = layer.findIndex(member => member.id === sprite.id);

    if(index === -1) {
        Logger.log(false, "Sprite does not exist on layer!", "SpriteManager.prototype.removeFromLayer", { layerID });

        return false;
    }

    layer.splice(index, 1);
    sprite.setLayerID(null);

    return true;
}

SpriteManager.prototype.updateSprite = function(spriteID, typeID, animationID = ImageSheet.DEFAULT_ANIMATION_ID) {
    const sprite = this.sprites.get(spriteID);
    
    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.updateSprite", { spriteID });

        return false;
    }

    const spriteType = this.spriteTypes[typeID];

    if(!spriteType) {
        Logger.log(false, "SpriteType does not exist!", "SpriteManager.prototype.updateSprite", { spriteID, typeID });

        return false;
    }

    const animationType = spriteType.getAnimation(animationID);

    if(!animationType) {
        Logger.log(false, "AnimationType does not exist!", "SpriteManager.prototype.updateSprite", { spriteID, typeID, animationID });

        return false;
    }

    const spriteTypeID = sprite.getTypeID();
    const spriteAnimationID = sprite.getAnimationID();

    if(spriteTypeID !== typeID || spriteAnimationID !== animationID) {
        const config = {
            "type": typeID,
            "animation": animationID,
            "frameCount": animationType.frameCount,
            "frameTime": animationType.frameTime
        };

        sprite.initialize(config);

        this.initializeBounds(sprite);
        this.addSpriteReference(typeID);
        //this.removeSpriteReference(spriteTypeID);
    }

    return true;
}

SpriteManager.prototype.initializeBounds = function(sprite) {
    const { typeID, bounds } = sprite;

    if(!bounds.isZero()) {
        return false;
    }

    const spriteType = this.spriteTypes[typeID];
    const { x, y, w, h } = spriteType.getBounds();

    bounds.set(x, y, w, h);
}