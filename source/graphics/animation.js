export const Animation = function() {
    this.frames = [];
    this.frameTime = 1;
    this.frameIndex = 0;
}

Animation.prototype.getFrameCount = function() {
    return this.frames.length;
}

Animation.prototype.getFrameTime = function() {
    return this.frameTime;
}

Animation.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % (this.frames.length * this.frameTime);
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Animation.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
    }
}

Animation.prototype.addFrame = function(frame) {
    if(frame.length < 1) {
        return;
    }

    this.frames.push(frame);
}

Animation.prototype.getCurrentFrame = function() {
    return this.frames[this.frameIndex];
}

Animation.prototype.getFrame = function(frameIndex) {
    if(frameIndex < 0 || frameIndex >= this.frames.length) {
        return [];
    }

    return this.frames[frameIndex];
}