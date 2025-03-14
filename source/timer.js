export const Timer = function() {
    this.tick = 0;
    this.realTime = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
    this.rawFPS = Timer.VALUE.TARGET_FPS;
    this.smoothFPS = Timer.VALUE.TARGET_FPS;
    this.smoothFactor = 0.05;

    this.updateProxy = (timestamp) => {
        this.realTime = timestamp / 1000;
        this.deltaTime = this.realTime - this.lastTime;
        this.accumulatedTime += this.deltaTime;
        this.rawFPS = 1 / this.deltaTime;
        this.smoothFPS = (1 - this.smoothFactor) * this.smoothFPS + this.smoothFactor * this.rawFPS;

        this.input();
    
        while(this.accumulatedTime > Timer.VALUE.FIXED_SPF) {
            this.tick = ++this.tick % Timer.VALUE.FIXED_FPS;
            this.accumulatedTime -= Timer.VALUE.FIXED_SPF;

            this.update();
        }
    
        this.render();
    
        this.lastTime = this.realTime;
        this.queue();
    }
}

Timer.VALUE = {
    TARGET_FPS: 120,
    FIXED_FPS: 60,
    FIXED_SPF: 1 / 60
};

Timer.prototype.input = function() {}
Timer.prototype.update = function() {}
Timer.prototype.render = function() {}

Timer.prototype.queue = function() {
    requestAnimationFrame(this.updateProxy);
}

Timer.prototype.getFPS = function() {
    return this.smoothFPS;
}

Timer.prototype.getTick = function() {
    return this.tick;
}

Timer.prototype.start = function() {
    this.queue();
}

Timer.prototype.getRealTime = function() {
    return this.realTime;
}

Timer.prototype.getFixedDeltaTime = function() {
    return Timer.VALUE.FIXED_SPF;
}

Timer.prototype.getDeltaTime = function() {
    return this.deltaTime;
}