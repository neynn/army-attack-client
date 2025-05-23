export const Objective = function(config, type, parameter, value) {
    this.config = config;
    this.type = type;
    this.parameter = parameter;
    this.maxValue = value;
    this.value = 0;
    this.state = Objective.STATE.INCOMPLETE;
}

Objective.STATE = {
    INCOMPLETE: 0,
    COMPLETE: 1
};

Objective.prototype.save = function() {
    return {
        "value": this.value
    }
}

Objective.prototype.load = function(blob) {
    const { value } = blob;

    if(value >= 0 && value <= this.maxValue) {
        this.value = value;
    }
}

Objective.prototype.onObjective = function(type, parameter, count) {
    if(this.state !== Objective.STATE.INCOMPLETE || this.type !== type || this.parameter !== parameter) {
        return;
    }

    this.value += count;

    if(this.value >= this.maxValue) {
        this.state = Objective.STATE.COMPLETE;
        this.value = this.maxValue;
    }

    return this.state;
}