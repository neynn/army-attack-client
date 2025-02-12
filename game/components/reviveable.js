import { ActiveComponent } from "../../source/component/activeComponent.js";

export const ReviveableComponent = function() {
    this.isElite = false;
    this.state = ReviveableComponent.STATE.NO_DECAY;
    this.passedTime = 0;
}

ReviveableComponent.prototype = Object.create(ActiveComponent.prototype);
ReviveableComponent.prototype.constructor = ReviveableComponent;

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
    if(this.state === ReviveableComponent.STATE.NO_DECAY) {
        this.state = ReviveableComponent.STATE.DECAY;
    }
}

ReviveableComponent.prototype.update = function(gameContext, entity) {
    if(this.state === ReviveableComponent.STATE.DECAY) {
        const { timer, world } = gameContext;
        const settings = world.getConfig("Settings");
        const fixedDeltaTime = timer.getFixedDeltaTime();

        this.passedTime += fixedDeltaTime;

        if(this.passedTime >= settings.downDuration) {
            this.passedTime = settings.downDuration;
            this.state = ReviveableComponent.STATE.DEAD;
            //TODO: Emit ENTITY_DEATH event!
            console.error(entity, "IS DEAD!");
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
    } = config;

    reviveableComponent.state = state;
    reviveableComponent.passedTime = passedTime;

    return reviveableComponent;
} 