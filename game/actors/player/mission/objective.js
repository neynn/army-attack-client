export const Objective = function(type, parameter, value) {
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

    if(value < 0) {
        this.value = 0;
    } else if(value > this.maxValue) {
        this.value = this.maxValue;
    } else {
        this.value = value;
    }
}

Objective.prototype.isMatching = function(type, parameter) {
    return this.state === Objective.STATE.INCOMPLETE && this.type === type && this.parameter === parameter;
}

Objective.prototype.progress = function(count) {
    this.value += count;

    if(this.value >= this.maxValue) {
        this.state = Objective.STATE.COMPLETE;
        this.value = this.maxValue;
    }

    return this.state;
}