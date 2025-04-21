export const Tile = function() {
    this.type = Tile.TYPE.NONE;
    this.bitmap = null;
    this.frames = [];
    this.frameTime = 1;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

Tile.TYPE = {
    NONE: 0,
    FRAME: 1,
    PATTERN: 2,
    ANIMATION: 3
};

Tile.prototype.setType = function(typeID) {
    this.type = typeID;
} 

Tile.prototype.setBitmap = function(bitmap) {
    this.bitmap = bitmap;
}

Tile.prototype.getFrameCount = function() {
    return this.frameCount;
}

Tile.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Tile.prototype.setFrameTime = function(frameTime = 1) {
    if(frameTime !== 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

Tile.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

Tile.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}