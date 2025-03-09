import { ActiveComponent } from "../../source/component/activeComponent.js";
import { ACTION_TYPES } from "../enums.js";

export const ReviveableComponent = function() {
    this.isElite = false;
    this.state = ReviveableComponent.STATE.NO_DECAY;
    this.passedTime = 0;
}

ReviveableComponent.prototype = Object.create(ActiveComponent.prototype);
ReviveableComponent.prototype.constructor = ReviveableComponent;

ReviveableComponent.STATE = {
    NO_DECAY: 0,
    DECAY: 1,
    DEAD: 2
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

ReviveableComponent.prototype.update = function(gameContext, entity) {
    if(this.state === ReviveableComponent.STATE.DECAY) {
        const { timer, world } = gameContext;
        const fixedDeltaTime = timer.getFixedDeltaTime();

        this.passedTime += fixedDeltaTime;

        if(this.passedTime >= gameContext.settings.downDuration) {
            const { actionQueue } = world;

            this.passedTime = gameContext.settings.downDuration;
            this.state = ReviveableComponent.STATE.DEAD;

            actionQueue.addImmediateRequest(ACTION_TYPES.DEATH, null, entity.getID());
        }
    }
}

ReviveableComponent.prototype.save = function() {
    return [this.state, this.passedTime];
}

ReviveableComponent.prototype.load = function(blob) {
    const [ state, passedTime ] = blob;

    this.state = state;
    this.passedTime = passedTime;
} 

ReviveableComponent.prototype.init = function(config) {
    const { elite } = config;

    if(elite) {
        this.isElite = elite;
    }
}