export const Timer = function() {
    this.tick = 0;
    this.realTime = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;

    this.updateProxy = (timestamp) => {
        this.realTime = timestamp / 1000;
        this.deltaTime = this.realTime - this.lastTime;
        this.accumulatedTime += this.deltaTime;
        
        this.input();
    
        while(this.accumulatedTime > Timer.FIXED_SECONDS_PER_FRAME) {
            this.tick = (this.tick + 1) % Timer.FIXED_FRAMES_PER_SECOND;
            this.update();
            this.accumulatedTime -= Timer.FIXED_SECONDS_PER_FRAME;
        }
    
        this.render();
    
        this.lastTime = this.realTime;
        this.queue();
    }
}

Timer.FIXED_FRAMES_PER_SECOND = 60;
Timer.FIXED_SECONDS_PER_FRAME = 1 / Timer.FIXED_FRAMES_PER_SECOND;

Timer.prototype.input = function(realTime, deltaTime) {}

Timer.prototype.update = function(gameTime, fixedDeltaTime) {}

Timer.prototype.render = function(realTime, deltaTime) {}

Timer.prototype.queue = function() {
    requestAnimationFrame(this.updateProxy);
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
    return Timer.FIXED_SECONDS_PER_FRAME;
}

Timer.prototype.getDeltaTime = function() {
    return this.deltaTime;
}