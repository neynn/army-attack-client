export const TileGraphic = function(sheet) {
    this.sheet = sheet;
    this.frames = [];
    this.frameTime = 1;
    this.frameIndex = 0;
}

TileGraphic.prototype.getFrameCount = function() {
    return this.frames.length;
}

TileGraphic.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % (this.frames.length * this.frameTime);
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

TileGraphic.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
    }
}

TileGraphic.prototype.addFrame = function(frame) {
    if(frame.length > 0) {
        this.frames.push(frame);
    }
}