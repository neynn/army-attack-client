export const DecayComponent = function() {
    this.isElite = false;
    this.isReviveable = false;
    this.decayState = DecayComponent.DECAY_STATE_REGULAR;
    this.decayProgress = 0;
}

DecayComponent.DECAY_STATE_REGULAR = 0;
DecayComponent.DECAY_STATE_DECAY = 1;

DecayComponent.prototype.save = function() {
    return {
        "decayState": this.decayState,
        "decayProgress": this.decayProgress
    }
}