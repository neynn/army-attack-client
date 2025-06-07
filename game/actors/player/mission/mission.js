import { Objective } from "./objective.js";

export const Mission = function(config) {
    this.config = config;
    this.state = Mission.STATE.HIDDEN;
    this.objectives = [];

    if(config.objectives) {
        this.initObjectives(config.objectives);
    }
}

Mission.STATE = {
    HIDDEN: 0,
    STARTED: 1,
    COMPLETED: 2
};

Mission.prototype.saveProgress = function() {
    const objectives = [];

    for(let i = 0; i < this.objectives.length; i++) {
        objectives.push(this.objectives[i].save());
    }

    return objectives;
}

Mission.prototype.loadProgress = function(objectives) {
    for(let i = 0; i < this.objectives.length; i++) {
        this.objectives[i].load(objectives[i]);
    }
}

Mission.prototype.initObjectives = function(objectives) {
    this.objectives.length = 0;

    for(let i = 0; i < objectives.length; i++) {
        const { type = null, parameter = null, value = 0 } = objectives[i];
        const objective = new Objective(type, parameter, value);

        this.objectives.push(objective);
    }
}

Mission.prototype.onObjective = function(type, parameter, count) {
    if(this.state !== Mission.STATE.STARTED) {
        return;
    }

    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];
        const isMatching = objective.isMatching(type, parameter);

        if(isMatching) {
            objective.progress(count);
        }
    }
}

Mission.prototype.getSetup = function() {
    const setup = this.config.setup;

    if(!setup) {
        return [];
    }
    
    return setup;
}

Mission.prototype.getRewards = function() {
    const rewards = this.config.rewards;

    if(!rewards) {
        return [];
    }

    return rewards;
}

Mission.prototype.getRequired = function() {
    const required = this.config.required;

    if(!required) {
        return [];
    }

    return required;
}

Mission.prototype.complete = function() {
    if(this.state === Mission.STATE.COMPLETED) {
        return false;
    }

    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];

        if(objective.state === Objective.STATE.INCOMPLETE) {
            return false;
        }
    }

    this.state = Mission.STATE.COMPLETED;

    return true;
}

Mission.prototype.start = function() {
    if(this.state !== Mission.STATE.HIDDEN) {
        return false;
    }

    this.state = Mission.STATE.STARTED;

    return true;
}