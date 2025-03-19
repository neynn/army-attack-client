import { Logger } from "../logger.js";
import { TileGraphic } from "./tileGraphic.js";

export const TileGraphics = function() {
    this.graphics = [];
    this.dynamicGraphics = [];
    this.frameTime = 1;
}

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

TileGraphics.prototype.load = function(tileSheets, tileMeta) {
    const { graphics } = tileMeta;
    const usedSheets = new Set();
    
    for(let i = 0; i < graphics.length; i++) {
        const { set, animation } = graphics[i];
        const sheet = tileSheets[set];

        if(!sheet) {
            this.graphics.push(null);
            continue;
        }

        const animationObject = this.createGraphic(sheet, set, animation);
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

TileGraphics.prototype.createGraphic = function(sheet, sheetID, graphicID) {
    const { frames, patterns, animations } = sheet;
    const animation = new TileGraphic(sheetID);
    const frameData = frames?.[graphicID];

    if(frameData) {
        const frame = this.createFrame(frameData);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(frame);

        return animation;
    } 

    const patternData = patterns?.[graphicID];

    if(patternData) {
        const frame = this.createPatternFrame(patternData, frames);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(frame);

        return animation;
    }

    const animationData = animations?.[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? this.frameTime;
        const animationFrames = animationData.frames ?? [];

        animation.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = frames[frameID];

            if(frameData) {
                const frame = this.createFrame(frameData);

                animation.addFrame(frame);
            } else {
                const patternData = patterns[frameID];
                const frame = this.createPatternFrame(patternData, frames);

                animation.addFrame(frame);
            }
        }

        return animation;
    }

    return animation;
}

TileGraphics.prototype.createPatternFrame = function(pattern, frames) {
    if(!pattern) {
        return [];
    }

    const frame = [];

    for(let i = 0; i < pattern.length; i++) {
        const { id, shiftX, shiftY } = pattern[i];
        const frameData = frames[id];

        if(!frameData) {
            Logger.log(Logger.CODE.ENGINE_WARN, "Frame does not exist!", "TileGraphics.prototype.createPatternFrame", { "frameID": id });

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

TileGraphics.prototype.createFrame = function(frameData) {
    if(!frameData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "FrameData does not exist!", "TileGraphics.prototype.createFrame");
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