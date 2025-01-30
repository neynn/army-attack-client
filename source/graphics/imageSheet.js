import { Animation } from "./animation.js";

export const ImageSheet = function(id) {
    this.id = id;
    this.directory = null;
    this.source = null;
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
    const { id, directory, source, bounds, frameTime, frames, animations, patterns } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.frameTime = frameTime;

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

ImageSheet.prototype.defineDefaultAnimation = function() {
    const defaultAnimation = new Animation(ImageSheet.DEFAULT_ANIMATION_ID);

    defaultAnimation.setFrameTime(this.frameTime);

    for(const frameID in this.frames) {
        const frame = this.createFrame(frameID);
        
        defaultAnimation.addFrame(frame);
    }

    this.addAnimation(ImageSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
}

ImageSheet.prototype.createFrame = function(frameID) {
    const frame = [];
    const frameData = this.frames[frameID];

    if(!frameData) {
        console.error(`Frame ${id} does not exist!`);
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
        console.error(`Pattern ${patternID} does not exist!`);
        return frame;
    }

    for(const frameSetup of pattern) {
        const { id, shiftX, shiftY } = frameSetup;
        const frameData = this.frames[id];

        if(!frameData) {
            console.error(`Frame ${id} does not exist!`);
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
        console.error(`Animation ${animationID} has no frames!`);
        return;
    }

    this.loadedAnimations.set(animationID, animation);
}

ImageSheet.prototype.defineAnimations = function() {
    for(const patternID in this.patterns) {
        const animation = new Animation(patternID);
        const patternFrame = this.createPatternFrame(patternID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(patternFrame);

        this.addAnimation(patternID, animation);
    }
    
    for(const frameID in this.frames) {
        const animation = new Animation(frameID);
        const frame = this.createFrame(frameID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(frame);

        this.addAnimation(frameID, animation);
    }

    for(const animationID in this.animations) {
        const { id, frames, frameTime } = this.animations[animationID];
        const animation = new Animation(animationID);

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