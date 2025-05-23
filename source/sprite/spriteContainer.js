export const SpriteContainer = function(texture, bounds, frameTime) {
    this.texture = texture;
    this.bounds = bounds;
    this.frameTime = frameTime;
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.frames = [];
}

SpriteContainer.prototype.initFrames = function(frames) {
    for(let i = 0; i < frames.length; i++) {
        const region = this.texture.getRegion(frames[i]);

        if(region) {
            this.frames.push(region);
        }
    }

    this.frameCount = this.frames.length;
    this.totalFrameTime = this.frameCount * this.frameTime;

    return this.frameCount;
}