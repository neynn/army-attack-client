export const FPSCounter = function() {
    this.fps = 60;
    this.smoothedFPS = 60;
    this.smoothingFactor = 0.05;
}

FPSCounter.prototype.getFPS = function() {
    return this.fps;
}

FPSCounter.prototype.getSmoothFPS = function() {
    return this.smoothedFPS;
}

FPSCounter.prototype.update = function(deltaTime) {
    const fps = 1 / deltaTime;
    const smoothedFPS = (1 - this.smoothingFactor) * this.smoothedFPS + this.smoothingFactor * fps;

    this.smoothedFPS = smoothedFPS;
    this.fps = fps;
}