export const ReviveableComponent = function() {
    this.isElite = false;
    this.state = ReviveableComponent.STATE.NO_DECAY;
    this.passedTime = 0;
    this.maxTime = 0;
}

ReviveableComponent.STATE = {
    "NO_DECAY": 0,
    "DECAY": 1,
    "DEAD": 2
};

ReviveableComponent.prototype.isAlive = function() {
    return this.state === ReviveableComponent.STATE.NO_DECAY;
}

ReviveableComponent.prototype.isDead = function() {
    return this.state === ReviveableComponent.STATE.DEAD;
}

ReviveableComponent.prototype.beginDecay = function() {
    if(!this.isElite && this.state === ReviveableComponent.STATE.NO_DECAY) {
        this.state = ReviveableComponent.STATE.DECAY;
    }
}

ReviveableComponent.prototype.update = function(gameContext) {
    if(this.state === ReviveableComponent.STATE.DECAY) {
        const { timer } = gameContext;
        const fixedDeltaTime = timer.getFixedDeltaTime();

        this.passedTime += fixedDeltaTime;

        if(this.passedTime >= this.maxTime) {
            this.passedTime = this.maxTime;
            this.state = ReviveableComponent.STATE.DEAD;
        }
    }
}

ReviveableComponent.prototype.save = function() {
    return {
        "state": this.state,
        "passedTime": this.passedTime
    }
}

ReviveableComponent.create = function(config) {
    const reviveableComponent = new ReviveableComponent();
    const {
        state = ReviveableComponent.STATE.NO_DECAY,
        passedTime = 0,
        maxTime = 0
    } = config;

    reviveableComponent.state = state;
    reviveableComponent.passedTime = passedTime;
    reviveableComponent.maxTime = maxTime;

    return reviveableComponent;
} 