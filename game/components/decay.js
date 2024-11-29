export const DecayComponent = function() {
    this.isReviveable = false;
    this.isElite = false;
    this.decayProgress = 0;
    this.decayType = DecayComponent.DECAY_TYPE_TIME;
}

DecayComponent.DECAY_TYPE_TIME = 0;
DecayComponent.DECAY_TYPE_TURN = 1;