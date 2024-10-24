export const Animation = function(id) {
    this.id = id;
    this.frameList = [];
    this.frameTime = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 0;
    this.frameIndex = 0;
}

Animation.prototype.setFrameIndex = function(frameIndex) {
    this.frameIndex = frameIndex;
}

Animation.prototype.initialize = function(frameList, frameTime) {
    this.frameList = frameList;
    this.frameTime = frameTime;
    this.frameCount = frameList.length;
    this.frameTimeTotal = frameTime * frameList.length;
    this.frameIndex = 0;
}

Animation.prototype.setFrameTime = function(frameTime) {
    this.frameTime = frameTime;
    this.frameTimeTotal = frameTime * this.frameList.length;
}

Animation.prototype.addFrame = function(frame) {
    this.frameList.push(frame);
    this.frameCount++;
    this.frameTimeTotal += this.frameTime;
}

Animation.prototype.getCurrentFrame = function() {
    return this.frameList[this.frameIndex];
}

Animation.prototype.getFrame = function(frameIndex) {
    if(frameIndex >= this.frameCount || frameIndex < 0) {
        return null;
    }

    return this.frameList[frameIndex];
}