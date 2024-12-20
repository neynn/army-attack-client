export const Timer = function(timeStep) {
    this.FIXED_FRAMES_PER_SECOND = timeStep;
    this.FIXED_SECONDS_PER_FRAME = 1 / timeStep;
    this.tick = 0;
    this.totalFixedTime = 0;
    this.accumulatedTime = 0;
    this.lastTime = 0;
    this.realTime = 0;
    this.deltaTime = 0;

    this.updateProxy = (timestamp) => {
        this.realTime = timestamp / 1000;
        this.deltaTime = this.realTime - this.lastTime;
        this.accumulatedTime += this.deltaTime;
        
        this.input(this.realTime, this.deltaTime);
    
        while(this.accumulatedTime > this.FIXED_SECONDS_PER_FRAME) {
            this.tick = (this.tick + 1) % this.FIXED_FRAMES_PER_SECOND;
            this.totalFixedTime += this.FIXED_SECONDS_PER_FRAME;
            this.update(this.totalFixedTime, this.FIXED_SECONDS_PER_FRAME);
            this.accumulatedTime -= this.FIXED_SECONDS_PER_FRAME;
        }
    
        this.render(this.realTime, this.deltaTime);
    
        this.lastTime = this.realTime;
        this.queue();
    }
}

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
    return this.FIXED_SECONDS_PER_FRAME;
}

Timer.prototype.getDeltaTime = function() {
    return this.deltaTime;
}