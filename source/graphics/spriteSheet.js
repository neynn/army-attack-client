import { Logger } from "../logger.js";
import { Animation } from "./animation.js";

export const SpriteSheet = function() {
    this.frames = {};
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.frameTime = 1;
    this.animations = new Map();
}

SpriteSheet.DEFAULT_ANIMATION_ID = "default";

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
        this.boundsX = bounds.x;
        this.boundsY = bounds.y;
        this.boundsW = bounds.w;
        this.boundsH = bounds.h;
    }
}

SpriteSheet.prototype.createFrame = function(frameID) {
    const frame = [];
    const frameData = this.frames[frameID];

    if(!frameData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Frame does not exist!", "SpriteSheet.prototype.createFrame", { frameID });

        return frame;
    }

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

SpriteSheet.prototype.addAnimation = function(animationID, animation) {
    const frameCount = animation.getFrameCount();

    if(frameCount < 1) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Animation has no frames!", "SpriteSheet.prototype.addAnimation", { animationID });

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