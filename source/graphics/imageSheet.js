import { Animation } from "./animation.js";

export const ImageSheet = function(image, config) {
    this.id = null;
    this.directory = null;
    this.source = null;
    this.frames = {};
    this.animations = {};
    this.patterns = {};
    this.offset = {"x": 0, "y": 0};
    this.frameTime = 1;
    this.allowFlip = false;
    this.buffers = new Map();
    this.loadedAnimations = new Map();
    this.image = image;
    
    this.loadFromConfig(config);
}

ImageSheet.USE_IMAGE_DATA = false;
ImageSheet.BUFFER_NOT_FLIPPED = 0;
ImageSheet.BUFFER_FLIPPED = 1;
ImageSheet.DEFAULT_ANIMATION_ID = "default";

ImageSheet.prototype.toBuffer = function() {
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

    this.image = canvas;
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
    const { id, directory, source, offset, frameTime, frames, allowFlip, animations, patterns, autoTiler } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.frameTime = frameTime;
    this.allowFlip = allowFlip;

    if(allowFlip) {
        this.allowFlip = allowFlip;
    }

    if(frameTime) {
        this.frameTime = frameTime;
    }

    if(offset) {
        this.offset.x = offset.x;
        this.offset.y = offset.y;
    }

    if(frames) {
        this.frames = frames;
    }

    if(animations) {
        this.animations = animations;
    }

    if(patterns) {
        this.patterns = patterns;
    }

    if(autoTiler) {
        this.autoTiler = autoTiler;
    }
}

ImageSheet.prototype.getFrameByID = function(frameID) {
    const frame = this.frames[frameID];

    return frame;
}

ImageSheet.prototype.getBuffersByID = function(frameID) {
    const { bufferKey } = this.frames[frameID];
    const buffers = this.buffers.get(bufferKey);

    return buffers;
}

ImageSheet.prototype.defineFrame = function(frameID) {
    const {x, y, w, h, offset, bufferKey} = this.frames[frameID];

    if(this.buffers.has(bufferKey) || bufferKey === undefined) {
        return false;
    }

    const flipBuffers = this.allowFlip ? [false, true] : [false];

    const buffers = flipBuffers.map(isFlipped => {
        const buffer = {"width": w, "height": h, "offset": { "x": this.offset.x, "y": this.offset.y }, "bitmap": null, "context": null, "imageData": null};
        const bitmap = document.createElement("canvas");
        const context = bitmap.getContext("2d");
    
        bitmap.width = buffer.width;
        bitmap.height = buffer.height;

        if(offset) {
            buffer.offset.x = offset.x;
            buffer.offset.y = offset.y;
        }

        if(isFlipped) {
            context.scale(-1, 1);
            context.translate(-buffer.width, 0);
            buffer.offset.x = 0 - buffer.offset.x - buffer.width;
        } 
    
        context.drawImage(this.image, x, y, w, h, 0, 0, w, h);
        buffer.context = context;
        buffer.bitmap = bitmap;

        if(ImageSheet.USE_IMAGE_DATA) {
            buffer.imageData = context.getImageData(0, 0, w, h);
        }

        return buffer;
    });

    this.buffers.set(bufferKey, buffers);

    return true;
}

ImageSheet.prototype.defineFrames = function() {
    for(const key in this.frames) {
        const frameData = this.frames[key];

        if(!frameData.bufferKey) {
            const {x, y, w, h} = frameData;
            frameData.bufferKey = `${x}-${y}-${w}-${h}`;
        }

        this.defineFrame(key);
    }

    return true;
}

ImageSheet.prototype.defineDefaultAnimation = function() {
    const defaultAnimation = new Animation(ImageSheet.DEFAULT_ANIMATION_ID);

    defaultAnimation.setFrameTime(this.frameTime);

    for(const frameID in this.frames) {
        const frame = this.createSingleFrame(frameID);
        defaultAnimation.addFrame(frame);
    }

    this.loadedAnimations.set(ImageSheet.DEFAULT_ANIMATION_ID, defaultAnimation);
}

ImageSheet.prototype.createSingleFrame = function(frameID) {
    const frame = [];
    
    if(!this.frames[frameID]) {
        console.error(`Frame ${id} does not exist!`);
        return frame;
    }

    const component = {"id": frameID, "offsetX": 0, "offsetY": 0};
    
    frame.push(component);

    return frame;
}

ImageSheet.prototype.createPatternFrame = function(patternID) {
    const compositeFrame = [];
    const pattern = this.patterns[patternID];

    if(!pattern || pattern.length === 0) {
        console.error(`Pattern ${patternID} does not exist or is empty!`);
        return compositeFrame;
    }

    for(const config of pattern) {
        const { id, offset } = config;
        const component = { "id": id, "offsetX": 0, "offsetY": 0 }

        if(!this.frames[id]) {
            console.error(`Frame ${id} does not exist!`);
            continue;
        }

        if(offset) {
            component.offsetX = offset.x;
            component.offsetY = offset.y;
        }

        compositeFrame.push(component);
    }

    return compositeFrame;
}

ImageSheet.prototype.defineAnimations = function() {
    for(const patternID in this.patterns) {
        const animation = new Animation(patternID);
        const patternFrame = this.createPatternFrame(patternID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(patternFrame);

        this.loadedAnimations.set(patternID, animation);
    }
    
    for(const frameID in this.frames) {
        const animation = new Animation(frameID);
        const frame = this.createSingleFrame(frameID);

        animation.setFrameTime(this.frameTime);
        animation.addFrame(frame);

        this.loadedAnimations.set(frameID, animation);
    }

    for(const animationID in this.animations) {
        const { id, frames, frameTime } = this.animations[animationID];
        const animation = new Animation(animationID);

        animation.setFrameTime(frameTime);

        for(const frameID of frames) {
            if(this.frames[frameID]) {
                const frame = this.createSingleFrame(frameID);
                animation.addFrame(frame);
            } else {
                const patternFrame = this.createPatternFrame(frameID);
                animation.addFrame(patternFrame);
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