export const Mission = function(config) {
    this.config = config;
    this.state = Mission.STATE.HIDDEN;
}

Mission.STATE = {
    HIDDEN: 0,
    STARTED: 1,
    COMPLETED: 2
};

Mission.prototype.getRequired = function() {
    const required = this.config.required;

    if(!required) {
        return [];
    }

    return required;
}

Mission.prototype.start = function() {
    if(this.state === Mission.STATE.COMPLETED) {
        return false;
    }

    const previousState = this.state;

    this.state = Mission.STATE.STARTED;

    return previousState === Mission.STATE.HIDDEN;
}

Mission.prototype.complete = function() {
    const previousState = this.state;

    this.state = Mission.STATE.COMPLETED;

    return previousState !== Mission.STATE.COMPLETED;
}