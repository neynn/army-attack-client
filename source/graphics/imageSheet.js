import { Animation } from "./animation.js";

export const ImageSheet = function(image, config) {
    this.id = null;
    this.directory = null;
    this.source = null;
    this.frames = {};
    this.animations = {};
    this.patterns = {};
    this.bounds = {"x":0,"y": 0,"w":0,"h":0};
    this.frameTime = 1;
    this.allowFlip = false;
    this.loadedAnimations = new Map();
    this.image = image;
    this.buffer = null;
    
    this.loadFromConfig(config);
}

ImageSheet.DEFAULT_ANIMATION_ID = "default";

ImageSheet.prototype.getBounds = function() {
    return this.bounds;
}

ImageSheet.prototype.getImage = function() {
    if(this.buffer) {
        return this.buffer;
    }

    return this.image;
}

ImageSheet.prototype.toBuffer = function() {
    if(this.buffer) {
        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = this.image.width;
    canvas.height = this.image.height;

    const context = canvas.getContext("2d");
    
    context.imageSmoothingEnabled = false;

    context.drawImage(
        this.image,
        0, 0, canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height
    );

    this.buffer = canvas;
}

ImageSheet.prototype.hasAnimation = function(animationID) {
    return this.loadedAnimations.has(animationID);
}

ImageSheet.prototype.hasFrame = function(frameID) {
    return this.frames[frameID] !== undefined;
}

ImageSheet.prototype.getAnimations = function() {
    return this.loadedAnimations;
}

ImageSheet.prototype.loadFromConfig = function(config) {
    const { id, directory, source, bounds, frameTime, frames, allowFlip, animations, patterns } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.frameTime = frameTime;
    this.allowFlip = allowFlip;

    if(allowFlip) this.allowFlip = allowFlip;
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

ImageSheet.prototype.getFrameByID = function(frameID) {
    const frame = this.frames[frameID];

    return frame;
}

ImageSheet.prototype.defineDefaultAnimation = function() {
    const defaultAnimation = new Animation(ImageSheet.DEFAULT_ANIMATION_ID);

    defaultAnimation.setFrameTime(this.frameTime);

    for(const frameID in this.frames) {
        const frame = this.createFrame(frameID);
        defaultAnimation.addFrame(frame);
    }

    this.loadedAnimations.set(ImageSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
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
        "id": frameID,
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
            "id": id,
            "shiftX": x + (shiftX ?? 0),
            "shiftY": y + (shiftY ?? 0)
        };

        frame.push(component);
    }

    return frame;
}

ImageSheet.prototype.defineAnimations = function() {
    for(const patternID in this.patterns) {
        const animation = new Animation(patternID);
        const patternFrame = this.createPatternFrame(patternID);

        animation.setFrameTime(this.frameTime);

        if(patternFrame.length > 0) {
            animation.addFrame(patternFrame);
        }

        this.loadedAnimations.set(patternID, animation);
    }
    
    for(const frameID in this.frames) {
        const animation = new Animation(frameID);
        const frame = this.createFrame(frameID);

        animation.setFrameTime(this.frameTime);

        if(frame.length > 0) {
            animation.addFrame(frame);
        }

        this.loadedAnimations.set(frameID, animation);
    }

    for(const animationID in this.animations) {
        const { id, frames, frameTime } = this.animations[animationID];
        const animation = new Animation(animationID);

        animation.setFrameTime(frameTime);

        for(const frameID of frames) {
            if(this.frames[frameID]) {
                const frame = this.createFrame(frameID);

                if(frame.length > 0) {
                    animation.addFrame(frame);
                }
            } else {
                const patternFrame = this.createPatternFrame(frameID);

                if(patternFrame.length > 0) {
                    animation.addFrame(patternFrame);
                }
            }
        }

        this.loadedAnimations.set(animationID, animation);
    }
}

ImageSheet.prototype.getAnimation = function(key) {
    const animation = this.loadedAnimations.get(key);

    if(!animation) {
        return this.loadedAnimations.get(ImageSheet.DEFAULT_ANIMATION_ID);
    }

    return animation;
}