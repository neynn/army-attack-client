export const Graphic = function() {
    this.type = Graphic.TYPE.NONE;
    this.image = null;
    this.frames = [];
    this.frameTime = 1;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

Graphic.TYPE = {
    NONE: 0,
    FRAME: 1,
    PATTERN: 2,
    ANIMATION: 3
};

Graphic.prototype.setType = function(typeID) {
    this.type = typeID;
} 

Graphic.prototype.setImage = function(image) {
    this.image = image;
}

Graphic.prototype.getFrameTime = function() {
    return this.frameTime;
}

Graphic.prototype.getFrameCount = function() {
    return this.frameCount;
}

Graphic.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Graphic.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

Graphic.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

Graphic.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

Graphic.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}