import { Logger } from "../logger.js";
import { Animation } from "./animation.js";

export const ImageSheet = function() {
    this.frames = {};
    this.animations = {};
    this.patterns = {};
    this.bounds = {"x":0,"y": 0,"w":0,"h":0};
    this.frameTime = 1;
    this.loadedAnimations = new Map();
}

ImageSheet.DEFAULT_ANIMATION_ID = "default";

ImageSheet.prototype.getBounds = function() {
    return this.bounds;
}

ImageSheet.prototype.getAnimations = function() {
    return this.loadedAnimations;
}

ImageSheet.prototype.load = function(config) {
    const { bounds, frameTime, frames, animations, patterns } = config;

    if(frameTime) this.frameTime = frameTime;
    if(frames) this.frames = frames;
    if(animations) this.animations = animations;
    if(patterns) this.patterns = patterns;
    if(bounds) {
        this.bounds.x = bounds.x;
        this.bounds.y = bounds.y;
        this.bounds.w = bounds.w;
        this.bounds.h = bounds.h;
    }
}

ImageSheet.prototype.createFrame = function(frameID) {
    const frame = [];
    const frameData = this.frames[frameID];

    if(!frameData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Frame does not exist!", "ImageSheet.prototype.createFrame", { frameID });

        return frame;
    }

    const { offset } = frameData;
    const { x, y } = offset;

    const component = {
        "frame": frameData,
        "shiftX": x,
        "shiftY": y
    };
    
    frame.push(component);

    return frame;
}

ImageSheet.prototype.createPatternFrame = function(patternID) {
    const frame = [];
    const pattern = this.patterns[patternID];

    if(!pattern) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Pattern does not exist!", "ImageSheet.prototype.createPatternFrame", { patternID });

        return frame;
    }

    for(const frameSetup of pattern) {
        const { id, shiftX, shiftY } = frameSetup;
        const frameData = this.frames[id];

        if(!frameData) {
            Logger.log(Logger.CODE.ENGINE_WARN, "Frame does not exist!", "ImageSheet.prototype.createPatternFrame", { "frameID": id });

            continue;
        }

        const { offset } = frameData;
        const { x, y } = offset;

        const component = {
            "frame": frameData,
            "shiftX": x + (shiftX ?? 0),
            "shiftY": y + (shiftY ?? 0)
        };

        frame.push(component);
    }

    return frame;
}

ImageSheet.prototype.addAnimation = function(animationID, animation) {
    const frameCount = animation.getFrameCount();

    if(frameCount < 1) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Animation has no frames!", "ImageSheet.prototype.addAnimation", { animationID });
        
        return;
    }

    this.loadedAnimations.set(animationID, animation);
}

ImageSheet.prototype.defineDefaultAnimation = function() {
    const defaultAnimation = new Animation();

    defaultAnimation.setFrameTime(this.frameTime);

    for(const frameID in this.frames) {
        const frame = this.createFrame(frameID);
        
        defaultAnimation.addFrame(frame);
    }

    this.addAnimation(ImageSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
}

ImageSheet.prototype.definePatterns = function() {
    for(const patternID in this.patterns) {
        const animation = new Animation();
        const patternFrame = this.createPatternFrame(patternID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(patternFrame);

        this.addAnimation(patternID, animation);
    }
}

ImageSheet.prototype.defineFrames = function() {
    for(const frameID in this.frames) {
        const animation = new Animation();
        const frame = this.createFrame(frameID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(frame);

        this.addAnimation(frameID, animation);
    }
}

ImageSheet.prototype.defineAnimations = function() {
    for(const animationID in this.animations) {
        const { frames, frameTime } = this.animations[animationID];
        const animation = new Animation();

        animation.setFrameTime(frameTime);

        for(const frameID of frames) {
            if(this.frames[frameID]) {
                const frame = this.createFrame(frameID);

                animation.addFrame(frame);
            } else {
                const patternFrame = this.createPatternFrame(frameID);

                animation.addFrame(patternFrame);
            }
        }

        this.addAnimation(animationID, animation);
    }
}

ImageSheet.prototype.getAnimation = function(key) {
    const animation = this.loadedAnimations.get(key);

    if(!animation) {
        return this.loadedAnimations.get(ImageSheet.DEFAULT_ANIMATION_ID);
    }

    return animation;
}