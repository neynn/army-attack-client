import { Animation } from "./animation.js";

export const SpriteSheet = function() {
    this.frames = {};
    this.bounds = {"x":0,"y": 0,"w":0,"h":0};
    this.frameTime = 1;
    this.animations = new Map();
}

SpriteSheet.DEFAULT_ANIMATION_ID = "default";

SpriteSheet.prototype.getBounds = function() {
    return this.bounds;
}

SpriteSheet.prototype.getAnimations = function() {
    return this.animations;
}

SpriteSheet.prototype.load = function(config) {
    const { bounds, frameTime, frames  } = config;

    if(frameTime) {
        this.frameTime = frameTime;
    }

    if(frames) {
        this.frames = frames;
    }

    if(bounds) {
        this.bounds.x = bounds.x;
        this.bounds.y = bounds.y;
        this.bounds.w = bounds.w;
        this.bounds.h = bounds.h;
    }
}

SpriteSheet.prototype.createFrame = function(frameID) {
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

SpriteSheet.prototype.addAnimation = function(animationID, animation) {
    const frameCount = animation.getFrameCount();

    if(frameCount < 1) {
        console.error(`Animation ${animationID} has no frames!`);
        return;
    }

    this.animations.set(animationID, animation);
}

SpriteSheet.prototype.defineDefaultAnimation = function() {
    const defaultAnimation = new Animation();

    defaultAnimation.setFrameTime(this.frameTime);

    for(const frameID in this.frames) {
        const frame = this.createFrame(frameID);
        
        defaultAnimation.addFrame(frame);
    }

    this.addAnimation(SpriteSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
}

SpriteSheet.prototype.getAnimation = function(key) {
    const animation = this.animations.get(key);

    if(!animation) {
        return this.animations.get(SpriteSheet.DEFAULT_ANIMATION_ID);
    }

    return animation;
}