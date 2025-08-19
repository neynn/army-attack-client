export const TileContainer = function() {
    this.texture = null;
    this.frames = [];
    this.frameTime = TileContainer.DEFAULT.FRAME_TIME;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

TileContainer.DEFAULT = {
    FRAME_TIME: 1
};

TileContainer.createComponent = function(x, y, w, h, offsetX, offsetY) {
    return {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": offsetX,
        "shiftY": offsetY 
    }
}

TileContainer.createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return [];
    }

    const { x, y, w, h, offset } = frameData;
    const offsetX = (offset?.x ?? 0);
    const offsetY = (offset?.y ?? 0);
    const component = TileContainer.createComponent(x, y, w, h, offsetX, offsetY);
    
    return [component];
}

TileContainer.createPatternFrame = function(pattern, frames) {
    const frame = [];

    if(!pattern) {
        return frame;
    }

    for(let i = 0; i < pattern.length; i++) {
        const { id, shiftX, shiftY } = pattern[i];
        const frameData = frames[id];

        if(!frameData) {
            console.warn(`Frame ${id} does not exist!`);
            continue;
        }

        const { x, y, w, h, offset } = frameData;
        const offsetX = (offset?.x ?? 0) + (shiftX ?? 0);
        const offsetY = (offset?.y ?? 0) + (shiftY ?? 0);
        const component = TileContainer.createComponent(x, y, w, h, offsetX, offsetY);

        frame.push(component);
    }

    return frame;
}

TileContainer.prototype.setTexture = function(texture) {
    this.texture = texture;
}

TileContainer.prototype.getFrameTime = function() {
    return this.frameTime;
}

TileContainer.prototype.getFrameCount = function() {
    return this.frameCount;
}

TileContainer.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

TileContainer.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

TileContainer.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

TileContainer.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

TileContainer.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}