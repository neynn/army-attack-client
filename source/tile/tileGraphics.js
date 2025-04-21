import { Graphic } from "../graphics/graphic.js";

export const TileGraphics = function() {
    this.graphics = [];
    this.dynamicGraphics = [];
    this.usedSheets = new Map();
}

TileGraphics.DEFAULT = {
    FRAME_TIME: 1
};

TileGraphics.BUFFER_THRESHOLD = {
    BIT_8: 256,
    BIT_16: 65536
};

TileGraphics.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

TileGraphics.prototype.drawEmptyTile = function(context, renderX, renderY, scaleX , scaleY, tileWidth, tileHeight) {
    const scaledX = tileWidth * 0.5 * scaleX;
    const scaledY = tileHeight * 0.5 * scaleY;

    context.fillStyle = TileGraphics.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, scaledX, scaledY);
    context.fillRect(renderX + scaledX, renderY + scaledY, scaledX, scaledY);

    context.fillStyle = TileGraphics.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + scaledX, renderY, scaledX, scaledY);
    context.fillRect(renderX, renderY + scaledY, scaledX, scaledY);
}

TileGraphics.prototype.drawTile = function(context, tileID, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight) {
    const index = tileID - 1;

    if(index < 0 || index >= this.graphics.length) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight);
        return;
    }

    const graphic = this.graphics[index];
    const { image, frames, frameIndex, frameCount } = graphic;

    if(image === null || frameCount === 0) {
        this.drawEmptyTile(context, renderX, renderY, scaleX, scaleY, tileWidth, tileHeight);
        return;
    }

    const { bitmap } = image;
    const currentFrame = frames[frameIndex];
    const frameLength = currentFrame.length;

    for(let i = 0; i < frameLength; ++i) {
        const component = currentFrame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

TileGraphics.prototype.getBufferType = function() {
    if(this.graphics.length < TileGraphics.BUFFER_THRESHOLD.BIT_8) {
        return Uint8Array;
    } else if(this.graphics.length < TileGraphics.BUFFER_THRESHOLD.BIT_16) {
        return Uint16Array;
    }

    return Uint32Array;
}

TileGraphics.prototype.update = function(timestamp) {
    for(let i = 0; i < this.dynamicGraphics.length; i++) {
        const index = this.dynamicGraphics[i];
        const graphic = this.graphics[index];

        graphic.updateFrameIndex(timestamp);
    }
}

TileGraphics.prototype.load = function(resources, tileSheets, tileGraphics) {
    for(let i = 0; i < tileGraphics.length; i++) {
        const { set, animation } = tileGraphics[i];
        const sheet = tileSheets[set];
        const tile = new Graphic();

        this.graphics.push(tile);

        if(!sheet) {
            continue;
        }

        createGraphic(tile, sheet, animation);

        const frameCount = tile.getFrameCount();

        if(frameCount === 0) {
            continue;
        }

        if(frameCount > 1) {
            this.dynamicGraphics.push(i);
        }
        
        const usedSheet = this.usedSheets.get(set);

        if(usedSheet) {
            usedSheet.push(i);
        } else {
            this.usedSheets.set(set, [i]);   
        }
    }

    for(const [sheetID, indices] of this.usedSheets) {
        resources.requestImage(sheetID);
    }
}

TileGraphics.prototype.onImageLoad = function(imageID, image) {
    const indices = this.usedSheets.get(imageID);

    if(!indices) {
        return;
    }

    for(let i = 0; i < indices.length; i++) {
        const index = indices[i];
        const graphic = this.graphics[index];

        graphic.setImage(image);
        image.addReference();
    }
}

const createGraphic = function(animation, sheet, graphicID) {
    const { frames = {}, patterns = {}, animations = {} } = sheet;
    const frameData = frames[graphicID];

    if(frameData) {
        const frame = createFrame(frameData);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.setType(Graphic.TYPE.FRAME);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = createPatternFrame(patternData, frames);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.setType(Graphic.TYPE.PATTERN);
        animation.addFrame(frame);

        return animation;
    }

    const animationData = animations[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileGraphics.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        animation.setFrameTime(frameTime);
        animation.setType(Graphic.TYPE.ANIMATION);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = frames[frameID];

            if(frameData) {
                const frame = createFrame(frameData);

                animation.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = createPatternFrame(patternData, frames);

                animation.addFrame(frame);
                continue;
            }
        }

        return animation;
    }

    return animation;
}

const createPatternFrame = function(pattern, frames) {
    if(!pattern) {
        return null;
    }

    const frame = [];

    for(let i = 0; i < pattern.length; i++) {
        const { id, shiftX, shiftY } = pattern[i];
        const frameData = frames[id];

        if(!frameData) {
            console.warn(`Frame ${id} does not exist!`);
            continue;
        }

        const { x, y, w, h, offset } = frameData;

        const component = {
            "frameX": x,
            "frameY": y,
            "frameW": w,
            "frameH": h,
            "shiftX": (offset?.x ?? 0) + (shiftX ?? 0),
            "shiftY": (offset?.y ?? 0) + (shiftY ?? 0)
        };

        frame.push(component);
    }

    if(frame.length === 0) {
        return null;
    }

    return frame;
}

const createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return null;
    }

    const frame = [];
    const { x, y, w, h, offset } = frameData;

    const component = {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": (offset?.x ?? 0),
        "shiftY": (offset?.y ?? 0)
    };
    
    frame.push(component);

    return frame;
}