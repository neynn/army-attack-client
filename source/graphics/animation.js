export const Animation = function(id) {
    this.id = id;
    this.frameList = [];
    this.frameTime = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 0;
    this.frameIndex = 0;
}

Animation.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % (this.frameCount * this.frameTime);
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Animation.prototype.initialize = function(frameList, frameTime) {
    this.frameList = frameList;
    this.frameTime = frameTime;
    this.frameCount = frameList.length;
    this.frameIndex = 0;
}

Animation.prototype.setFrameTime = function(frameTime) {
    this.frameTime = frameTime;
}

Animation.prototype.addFrame = function(frame) {
    this.frameList.push(frame);
    this.frameCount++;
}

Animation.prototype.getCurrentFrame = function() {
    return this.frameList[this.frameIndex];
}

Animation.prototype.getFrame = function(frameIndex) {
    if(frameIndex >= this.frameCount || frameIndex < 0) {
        return [];
    }

    return this.frameList[frameIndex];
}