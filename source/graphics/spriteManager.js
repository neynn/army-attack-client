import { EventEmitter } from "../events/eventEmitter.js";
import { IDGenerator } from "../idGenerator.js";
import { response } from "../response.js";
import { ImageSheet } from "./imageSheet.js";
import { Sprite } from "./sprite.js";

export const SpriteManager = function() {
    this.id = "SPRITE_MANAGER";
    this.tileSprites = {};
    this.spriteTypes = {};
    this.sprites = new Map();
    this.spriteReferences = new Map();
    this.IDgenerator = new IDGenerator();
    this.events = new EventEmitter();
    this.layers = {
        [SpriteManager.LAYER_BOTTOM]: [],
        [SpriteManager.LAYER_MIDDLE]: [],
        [SpriteManager.LAYER_TOP]: []
    };
    this.order = [
        SpriteManager.LAYER_BOTTOM,
        SpriteManager.LAYER_MIDDLE,
        SpriteManager.LAYER_TOP
    ];
    this.events.listen(SpriteManager.EVENT_REQUEST_TIMESTAMP);
}

SpriteManager.EVENT_REQUEST_TIMESTAMP = "SpriteManager.EVENT_REQUEST_TIMESTAMP";
SpriteManager.LAYER_BOTTOM = 0;
SpriteManager.LAYER_MIDDLE = 1;
SpriteManager.LAYER_TOP = 2;

SpriteManager.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    
    this.updateTileFrames(realTime);
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

SpriteManager.prototype.updateTileFrames = function(timestamp) {
    for(const key in this.tileSprites) {
        const tileSet = this.tileSprites[key];
        const animations = tileSet.getAnimations();

        for(const [animationID, animation] of animations) {
            if(animation.frameCount > 1) {
                const currentFrameTime = timestamp % animation.frameTimeTotal;
                const frameIndex = Math.floor(currentFrameTime / animation.frameTime);

                animation.setFrameIndex(frameIndex);
            }
        }
    }
}

SpriteManager.prototype.loadSpriteTypes = function(spriteTypes) {
    if(!spriteTypes) {
        return response(false, "SpriteTypes cannot be undefined!", "SpriteManager.prototype.loadSpriteTypes", null, null);
    }

    this.spriteTypes = spriteTypes;

    return response(true, "SpriteTypes have been loaded!", "SpriteManager.prototype.loadSpriteTypes", null, null);
}

SpriteManager.prototype.loadTileSprites = function(tileSprites) {
    if(!tileSprites) {
        return response(false, "TileSprites cannot be undefined!", "SpriteManager.prototype.loadTileSprites", null, null);
    }

    this.tileSprites = tileSprites;

    return response(true, "TileSprites have been loaded!", "SpriteManager.prototype.loadTileSprites", null, null);
}

SpriteManager.prototype.workEnd = function() {
    this.sprites.clear();
    this.IDgenerator.reset();

    for(const id in this.layers) {
        this.layers[id] = [];
    }
}

SpriteManager.prototype.createSprite = function(typeID, layerID, animationID) {
    const spriteID = this.IDgenerator.getID();
    const sprite = new Sprite(spriteID, typeID);
    
    sprite.events.subscribe(Sprite.FINISHED, this.id, (sprite) => this.removeSprite(sprite.id));

    sprite.events.subscribe(Sprite.REQUEST_FRAME, this.id, (sprite, onResponse) => {
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
    this.events.emit(SpriteManager.EVENT_REQUEST_TIMESTAMP, (timestamp) => sprite.setLastCallTime(timestamp));

    if(layerID !== null) {
        this.addToLayer(layerID, sprite);
    }

    this.updateSprite(sprite.id, typeID, animationID);
    this.addSpriteReference(typeID);

    return sprite;
}

SpriteManager.prototype.removeSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.removeSprite", null, {spriteID});
    }
    
    const references = sprite.getAllChildrenReferences();

    for(const reference of references) {
        this.removeSprite(reference.id);
    }

    sprite.closeFamily();

    if(sprite.layerID !== null) {
        this.removeFromLayer(sprite.layerID, sprite);
    }

    this.sprites.delete(sprite.id);

    return response(true, "Sprite has been removed!", "SpriteManager.prototype.removeSprite", null, {spriteID});
}

SpriteManager.prototype.getSprite = function(spriteID) {
    const sprite = this.sprites.get(spriteID);

    if(!sprite) {
        return null;
    }

    return sprite;
}

SpriteManager.prototype.addChildSprite = function(parentID, childID, customChildID) {
    const parent = this.sprites.get(parentID);

    if(!parent) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.addChildSprite", null, {parentID, childID, customChildID});
    }

    const child = this.sprites.get(childID);

    if(!child) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.addChildSprite", null, {parentID, childID, customChildID});
    }

    parent.openFamily(parent.typeID);
    parent.addChild(child, customChildID);

    return response(true, "Sprite has been added to parent!", "SpriteManager.prototype.addChildSprite", null, {parentID, childID, customChildID});
}

SpriteManager.prototype.createChildSprite = function(spriteID, childTypeID, customChildID) {
    const parent = this.sprites.get(spriteID);

    if(!parent) {
        response(false, "Sprite does not exist!", "SpriteManager.prototype.createChildSprite", null, {spriteID, childTypeID, customChildID});
        return null;
    }

    const childSprite = this.createSprite(childTypeID, null, ImageSheet.DEFAULT_ANIMATION_ID);

    parent.openFamily(parent.typeID);
    parent.addChild(childSprite, customChildID);

    return childSprite;
}

SpriteManager.prototype.removeChildSprite = function(parentID, customChildID) {
    const parent = this.sprites.get(parentID);

    if(!parent) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.removeChildSprite", null, {parentID, customChildID});
    }

    const child = parent.getChild(customChildID);

    if(!child) {
        return response(false, "Child does not exist!", "SpriteManager.prototype.removeChildSprite", null, {parentID, customChildID});
    }

    const reference = child.getReference();

    this.removeSprite(reference.id);
    
    return response(true, "Sprite has been removed!", "SpriteManager.prototype.removeChildSprite", null, {parentID, customChildID});
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

SpriteManager.prototype.updateSprite = function(spriteID, setID, animationID) {
    const sprite = this.sprites.get(spriteID);
    
    if(!sprite) {
        return response(false, "Sprite does not exist!", "SpriteManager.prototype.updateSprite", null, {spriteID});
    }

    const spriteType = this.spriteTypes[setID];

    if(!spriteType) {
        return response(false, "SpriteType does not exist!", "SpriteManager.prototype.updateSprite", null, {spriteID, setID});
    }

    const animationType = spriteType.getAnimation(animationID);

    if(!animationType) {
        return response(false, "Parameter is undefined!", "SpriteManager.prototype.updateSprite", null, {spriteID, setID, animationID});
    }

    if(sprite.typeID !== setID || sprite.animationID !== animationID) {
        sprite.initialize(setID, animationID, animationType.frameCount, animationType.frameTime);
        sprite.initializeBounds();
    }

    return response(true, "Sprite has been updated!", "SpriteManager.prototype.updateSprite", null, {spriteID, setID, animationID});
}

SpriteManager.prototype.drawTileGraphics = function(graphics, context, renderX, renderY, scaleX = 1, scaleY = 1) {
    const [setID, animationID] = graphics;
    const tileSet = this.tileSprites[setID];
    const animation = tileSet.getAnimation(animationID);
    const currentFrame = animation.getCurrentFrame();
    
    for(const component of currentFrame) {
        const { id, offsetX, offsetY } = component;
        const { width, height, offset, bitmap } = tileSet.getBuffersByID(id)[ImageSheet.BUFFER_NOT_FLIPPED];
        const drawX = renderX + offset.x + offsetX;
        const drawY = renderY + offset.y + offsetY;
        const drawWidth = width * scaleX;
        const drawHeight = height * scaleY;

        context.drawImage(
            bitmap,
            0, 0, width, height,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}