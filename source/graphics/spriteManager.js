import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { response } from "../response.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./drawable/sprite.js";

export const SpriteManager = function() {
    this.timestamp = 0;
    this.spriteTypes = {};
    this.sprites = new Map();
    this.spriteReferences = new Map();
    this.idGenerator = new IDGenerator();
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
        return response(false, "SpriteType does not exist!", "SpriteManager.prototype.removeSpriteReference", null, {spriteID});
    }

    const count = this.spriteReferences.get(spriteID);

    if(count !== undefined) {
        this.spriteReferences.set(spriteID, count - 1);

        if(count - 1 <= 0) {
            this.spriteReferences.delete(spriteID);
            //UNLOAD THE SPRITE!
        }
    }

    return response(true, "Sprite reference has been removed!", "SpriteManager.prototype.removeSpriteReference", null, {spriteID});
}

SpriteManager.prototype.addSpriteReference = function(spriteID) {
    if(!this.spriteTypes[spriteID]) {
        return response(false, "SpriteType does not exist!", "SpriteManager.prototype.addSpriteReference", null, {spriteID});
    }

    const count = this.spriteReferences.get(spriteID);

    if(count === undefined) {
        this.spriteReferences.set(spriteID, 1);
        //LOAD THE SPRITE
    } else {
        this.spriteReferences.set(spriteID, count + 1);
    }

    return response(true, "Sprite reference has been added!", "SpriteManager.prototype.addSpriteReference", null, {spriteID});
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
    
    sprite.setLastCallTime(this.timestamp);
    sprite.events.subscribe(Sprite.FINISHED, "SPRITE_MANAGER", (sprite) => this.destroySprite(sprite.id));
    sprite.events.subscribe(Sprite.REQUEST_FRAME, "SPRITE_MANAGER", (sprite, onResponse) => {
        const {typeID, animationID, currentFrame} = sprite;
        const spriteType = this.spriteTypes[typeID];
        const animationType = spriteType.getAnimation(animationID);
        const animationFrame = animationType.getFrame(currentFrame);
        const {id, offsetX, offsetY} = animationFrame[0]; //HÄCK lmao -> sprites should also be drawn as composites.
        const frame = spriteType.getFrameByID(id);
        const offset = frame.offset ?? spriteType.offset;

        onResponse({
            "frame": frame,
            "offset": offset,
            "image": spriteType.image
        });
    });

    this.sprites.set(sprite.id, sprite);

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.id, typeID, animationID);
    this.addSpriteReference(typeID);

    return sprite;
}

SpriteManager.prototype.destroySprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);
    const nonSpriteDrawables = [];

    if(!sprite) {
        Logger.log(false, "Sprite does not exist!", "SpriteManager.prototype.destroySprite", {spriteID});

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
        return response(false, "Layer does not exist!", "SpriteManager.prototype.addToLayer", null, {layerID});
    }

    const layer = this.layers[layerID];
    const index = layer.findIndex(member => member.id === sprite.id);

    if(index !== -1) {
        return response(false, "Sprite already exists on layer!", "SpriteManager.prototype.addToLayer", null, {layerID});
    }

    layer.push(sprite);
    sprite.setLayerID(layerID);

    return response(true, "Sprite has been added to layer!", "SpriteManager.prototype.addToLayer", null, {layerID});
} 

SpriteManager.prototype.removeFromLayer = function(layerID, sprite) {
    if(this.layers[layerID] === undefined) {
        return response(false, "Layer does not exist!", "SpriteManager.prototype.removeFromLayer", null, {layerID});
    }

    const layer = this.layers[layerID];
    const index = layer.findIndex(member => member.id === sprite.id);

    if(index === -1) {
        return response(false, "Sprite does not exist on layer!", "SpriteManager.prototype.removeFromLayer", null, {layerID});
    }

    layer.splice(index, 1);
    sprite.setLayerID(null);

    return response(true, "Sprite has removed from layer!", "SpriteManager.prototype.removeFromLayer", null, {layerID});
}

SpriteManager.prototype.updateSprite = function(spriteID, typeID, animationID = ImageSheet.DEFAULT_ANIMATION_ID) {
    const sprite = this.sprites.get(spriteID);
    
    if(!sprite) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.updateSprite", null, {spriteID});
    }

    const spriteType = this.spriteTypes[typeID];

    if(!spriteType) {
        return response(false, "SpriteType does not exist!", "SpriteManager.prototype.updateSprite", null, {spriteID, typeID});
    }

    const animationType = spriteType.getAnimation(animationID);

    if(!animationType) {
        return response(false, "Parameter is undefined!", "SpriteManager.prototype.updateSprite", null, {spriteID, typeID, animationID});
    }

    if(sprite.typeID !== typeID || sprite.animationID !== animationID) {
        sprite.initialize(typeID, animationID, animationType.frameCount, animationType.frameTime);
        sprite.initializeBounds();
    }

    return response(true, "Sprite has been updated!", "SpriteManager.prototype.updateSprite", null, {spriteID, typeID, animationID});
}