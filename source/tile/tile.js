export const Tile = function() {
    this.sheet = null;
    this.frames = [];
    this.frameTime = 1;
    this.frameIndex = 0;
}

Tile.prototype.setSheet = function(sheet) {
    this.sheet = sheet;
}

Tile.prototype.getFrameCount = function() {
    return this.frames.length;
}

Tile.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % (this.frames.length * this.frameTime);
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Tile.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
    }
}

Tile.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
    }
}