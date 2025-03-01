import { Logger } from "../logger.js";
import { Animation } from "./animation.js";

export const TileSheet = function() {
    this.defaultFrameTime = 1;
    this.animations = new Map();
}

TileSheet.ERROR_CODE = {
    SUCCESS: 0,
    MISSING_CONFIG: 1
};

TileSheet.prototype.init = function(config) {
    if(!config) {
        return TileSheet.ERROR_CODE.MISSING_CONFIG;
    }

    const { frameTime, frames, patterns, animations } = config;

    if(frameTime) {
        this.defaultFrameTime = frameTime;
    }

    this.defineFrames(frames);
    this.definePatterns(patterns, frames);
    this.defineAnimations(animations, patterns, frames)
}

TileSheet.prototype.addAnimation = function(animationID, animation) {
    const frameCount = animation.getFrameCount();

    if(frameCount < 1) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Animation has no frames!", "TileSheet.prototype.addAnimation", { animationID });

        return;
    }

    this.animations.set(animationID, animation);
}

TileSheet.prototype.createPatternFrame = function(pattern, frames) {
    if(!pattern) {
        return [];
    }

    const frame = [];

    for(let i = 0; i < pattern.length; i++) {
        const { id, shiftX, shiftY } = pattern[i];
        const frameData = frames[id];

        if(!frameData) {
            Logger.log(Logger.CODE.ENGINE_WARN, "Frame does not exist!", "TileSheet.prototype.createPatternFrame", { "frameID": id });

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

TileSheet.prototype.createFrame = function(frameData) {
    if(!frameData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "FrameData does not exist!", "TileSheet.prototype.createFrame");

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

TileSheet.prototype.defineFrames = function(frameTypes) {
    for(const frameID in frameTypes) {
        const frameData = frameTypes[frameID];
        const animation = new Animation();
        const frame = this.createFrame(frameData);

        animation.setFrameTime(this.defaultFrameTime);
        animation.addFrame(frame);

        this.addAnimation(frameID, animation);
    }
}

TileSheet.prototype.definePatterns = function(patternTypes, frameTypes) {
    for(const patternID in patternTypes) {
        const pattern = patternTypes[patternID];
        const animation = new Animation();
        const patternFrame = this.createPatternFrame(pattern, frameTypes);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(patternFrame);

        this.addAnimation(patternID, animation);
    }
}

TileSheet.prototype.defineAnimations = function(animationTypes, patternTypes, frameTypes) {
    for(const animationID in animationTypes) {
        const { frames, frameTime } = animationTypes[animationID];
        const animation = new Animation();

        animation.setFrameTime(frameTime);

        for(let i = 0; i < frames.length; i++) {
            const frameID = frames[i];
            const frameData = frameTypes[frameID];

            if(frameData) {
                const frame = this.createFrame(frameData);

                animation.addFrame(frame);
            } else {
                const pattern = patternTypes[frameID];
                const frame = this.createPatternFrame(pattern, frameTypes);

                animation.addFrame(frame);
            }
        }

        this.addAnimation(animationID, animation);
    }
}


TileSheet.prototype.getAnimation = function(animationID) {
    return this.animations.get(animationID);
}

TileSheet.prototype.getDynamicAnimations = function() {
    const animations = [];

    for(const [animationID, animation] of this.animations) {
        const frameCount = animation.getFrameCount();

        if(frameCount > 1) {
            animations.push(animationID);
        }
    }

    return animations;
}