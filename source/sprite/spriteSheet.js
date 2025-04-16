import { Animation } from "./animation.js";

export const SpriteSheet = function() {
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.animations = new Map();
}

SpriteSheet.DEFAULT = {
    FRAME_TIME: 1,
    ANIMATION_ID: "default"
};

SpriteSheet.prototype.load = function(config) {
    const { bounds, frameTime, frames, animations } = config;
    const defaultFrameTime = frameTime ?? SpriteSheet.DEFAULT.FRAME_TIME;

    if(bounds) {
        this.boundsX = bounds.x;
        this.boundsY = bounds.y;
        this.boundsW = bounds.w;
        this.boundsH = bounds.h;
    }

    if(frames && animations) {
        defineAnimations(animations, frames, defaultFrameTime, (id, animation) => this.animations.set(id, animation));
    }
}

SpriteSheet.prototype.getAnimation = function(key) {
    const animation = this.animations.get(key);

    if(!animation) {
        return null;
    }

    return animation;
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

        const animation = new Animation();

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
