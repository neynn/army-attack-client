export const Timer = function(timeStep) {
    this.timeStep = 1/timeStep;
    this.gameTime = 0;
    this.accumulatedTime = 0;
    this.lastTime = 0;
    this.realTime = 0;
    this.passedTime = 0;

    this.updateProxy = (deltaTime) => {
        this.realTime = deltaTime / 1000;
        this.passedTime = this.realTime - this.lastTime;
    
        this.input(this.realTime, this.passedTime);
    
        this.accumulatedTime += this.passedTime;
    
        while(this.accumulatedTime > this.timeStep) {
            this.gameTime += this.timeStep;
            this.update(this.gameTime, this.timeStep);
            this.accumulatedTime -= this.timeStep;
        }
    
        this.render(this.realTime, this.passedTime);
    
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

Timer.prototype.start = function() {
    this.queue();
}

Timer.prototype.getRealTime = function() {
    return this.realTime;
}

Timer.prototype.getFixedDeltaTime = function() {
    return this.timeStep;
}

Timer.prototype.getDeltaTime = function() {
    return this.passedTime;
}