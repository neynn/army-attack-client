export const FrameContainer = function() {
    this.texture = null;
    this.frames = [];
    this.frameTime = FrameContainer.DEFAULT.FRAME_TIME;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

FrameContainer.DEFAULT = {
    FRAME_TIME: 1
};

FrameContainer.createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return null;
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

FrameContainer.createPatternFrame = function(pattern, frames) {
    if(!pattern) {
        return null;
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

    if(frame.length === 0) {
        return null;
    }

    return frame;
}

FrameContainer.prototype.setTexture = function(texture) {
    this.texture = texture;
}

FrameContainer.prototype.getFrameTime = function() {
    return this.frameTime;
}

FrameContainer.prototype.getFrameCount = function() {
    return this.frameCount;
}

FrameContainer.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

FrameContainer.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

FrameContainer.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

FrameContainer.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

FrameContainer.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}