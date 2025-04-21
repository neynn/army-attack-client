import { Graphic } from "../graphics/graphic.js";
import { Sprite } from "./sprite.js";
import { SpriteAtlas } from "./spriteAtlas.js";

export const SpriteGraphics = function() {
    this.graphics = [];
    this.spriteAtlases = new Map();
}

SpriteGraphics.prototype.load = function(spriteAtlases) {
    const atlasKeys = Object.keys(spriteAtlases);

    for(let i = 0; i < atlasKeys.length; i++) {
        const atlasID = atlasKeys[i];
        const spriteAtlas = new SpriteAtlas();
        const atlasConfig = spriteAtlases[atlasID];
        const { animations, frames, frameTime, bounds } = atlasConfig;

        spriteAtlas.loadBounds(bounds);

        this.spriteAtlases.set(atlasID, spriteAtlas);

        if(!animations || !frames) {
            continue;
        }

        const defaultFrameTime = frameTime ?? SpriteAtlas.DEFAULT.FRAME_TIME;

        defineAnimations(animations, frames, defaultFrameTime, (id, graphic) => {
            spriteAtlas.setSpriteIndex(id, this.graphics.length);
            this.graphics.push(graphic);
        });
    }
}

SpriteGraphics.prototype.onImageLoad = function(atlasID, loadableImage) {
    const spriteAtlas = this.spriteAtlases.get(atlasID);

    if(!spriteAtlas) {
        return;
    }

    const { sprites } = spriteAtlas;

    sprites.forEach((index) => this.graphics[index].setImage(loadableImage));
}

SpriteGraphics.prototype.drawSprite = function(context, sprite, localX, localY) {
    const { typeID, currentFrame, flags, boundsX, boundsY } = sprite;

    if(typeID < 0 || typeID >= this.graphics.length) {
        return;
    }

    const graphic = this.graphics[typeID];
    const { image, frames } = graphic;

    if(image === null || frames.length === 0) {
        return;
    }

    const { bitmap } = image;
    const spriteFrame = frames[currentFrame];
    const isFlipped = (flags & Sprite.FLAG.FLIP) !== 0;

    if(isFlipped) {
        const renderX = (localX - boundsX) * -1;
        const renderY = localY + boundsY;

        context.scale(-1, 1);

        for(let i = 0; i < spriteFrame.length; i++) {
            const { frameX, frameY, frameW, frameH, shiftX, shiftY } = spriteFrame[i];
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

        for(let i = 0; i < spriteFrame.length; i++) {
            const { frameX, frameY, frameW, frameH, shiftX, shiftY } = spriteFrame[i];
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

SpriteGraphics.prototype.getSpriteIndex = function(atlasID, spriteID) {
    const spriteAtlas = this.spriteAtlases.get(atlasID);

    if(!spriteAtlas) {
        return SpriteAtlas.ID.INVALID;;
    }

    const spriteIndex = spriteAtlas.getSpriteIndex(spriteID)

    return spriteIndex;
}

SpriteGraphics.prototype.getAtlas = function(atlasID) {
    const spriteAtlas = this.spriteAtlases.get(atlasID);

    if(!spriteAtlas) {
        return null;
    }

    return spriteAtlas;
}

SpriteGraphics.prototype.getGraphic = function(spriteIndex) {
    if(spriteIndex < 0 || spriteIndex >= this.graphics.length) {
        return null;
    }

    const graphic = this.graphics[spriteIndex];

    return graphic;
}

const createFrame = function(frameData) {
    if(!frameData) {
        return null;
    }

    const frame = [];
    const { x, y, w, h, offset } = frameData;

    const component = {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": offset?.x ?? 0,
        "shiftY": offset?.y ?? 0
    };
    
    frame.push(component);

    return frame;
}

const defineAnimations = function(animations, uniqueFrames, defaultFrameTime, onValid) {
    if(typeof onValid !== "function") {
        return;
    }

    for(const animationID in animations) {
        const { 
            frameTime = defaultFrameTime,
            frames = [] 
        } = animations[animationID];

        const animation = new Graphic();

        animation.setType(Graphic.TYPE.ANIMATION);
        animation.setFrameTime(frameTime);

        for(let i = 0; i < frames.length; i++) {
            const frameID = frames[i];
            const frameData = uniqueFrames[frameID];
            const frame = createFrame(frameData);

            animation.addFrame(frame);
        }

        const frameCount = animation.getFrameCount();

        if(frameCount !== 0) {
            onValid(animationID, animation);
        } else {
            console.warn(`Animation ${animationID} has no frames!`);
        }
    }
}