export const Animation = function() {
    this.frames = [];
    this.frameTime = 1;
}

Animation.prototype.getFrameCount = function() {
    return this.frames.length;
}

Animation.prototype.getFrameTime = function() {
    return this.frameTime;
}

Animation.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
    }
}

Animation.prototype.addFrame = function(frame) {
    if(frame.length > 0) {
        this.frames.push(frame);
    }
}

Animation.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}