import { TileGraphic } from "./tileGraphic.js";

export const TileGraphics = function() {
    this.graphics = [];
    this.dynamicGraphics = [];
}

TileGraphics.DEFAULT = {
    FRAME_TIME: 1
};

TileGraphics.BUFFER_THRESHOLD = {
    BIT_8: 256,
    BIT_16: 65536
};

TileGraphics.prototype.getBufferType = function() {
    if(this.graphics.length < TileGraphics.BUFFER_THRESHOLD.BIT_8) {
        return Uint8Array;
    } else if(this.graphics.length < TileGraphics.BUFFER_THRESHOLD.BIT_16) {
        return Uint16Array;
    }

    return Uint32Array;
}

TileGraphics.prototype.getGraphic = function(tileID) {
    const index = tileID - 1;

    if(index < 0 || index >= this.graphics.length) {
        return null;
    }

    return this.graphics[index];
}

TileGraphics.prototype.update = function(timestamp) {
    for(let i = 0; i < this.dynamicGraphics.length; i++) {
        const index = this.dynamicGraphics[i];
        const graphic = this.graphics[index];

        graphic.updateFrameIndex(timestamp);
    }
}

TileGraphics.prototype.load = function(tileSheets, tileGraphics = []) {
    const usedSheets = new Set();
    
    for(let i = 0; i < tileGraphics.length; i++) {
        const { set, animation } = tileGraphics[i];
        const sheet = tileSheets[set];

        if(!sheet) {
            this.graphics.push(null);
            continue;
        }

        const animationObject = createGraphic(sheet, set, animation);
        const frameCount = animationObject.getFrameCount();

        if(frameCount === 0) {
            this.graphics.push(null);
        } else {
            this.graphics.push(animationObject);

            if(frameCount > 1) {
                this.dynamicGraphics.push(i);
            }

            usedSheets.add(set);
        }
    }

    return usedSheets;
}

const createGraphic = function(sheet, sheetID, graphicID) {
    const { frames = {}, patterns = {}, animations = {} } = sheet;
    const animation = new TileGraphic(sheetID);
    const frameData = frames[graphicID];

    if(frameData) {
        const frame = createFrame(frameData);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = createPatternFrame(patternData, frames);

        animation.setFrameTime(TileGraphics.DEFAULT.FRAME_TIME);
        animation.addFrame(frame);

        return animation;
    }

    const animationData = animations[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileGraphics.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        animation.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = frames[frameID];

            if(frameData) {
                const frame = createFrame(frameData);

                animation.addFrame(frame);
            } else {
                const patternData = patterns[frameID];
                const frame = createPatternFrame(patternData, frames);

                animation.addFrame(frame);
            }
        }

        return animation;
    }

    return animation;
}

const createPatternFrame = function(pattern, frames) {
    if(!pattern) {
        return [];
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

    return frame;
}

const createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return [];
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