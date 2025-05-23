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
        const config = objectives[i];
        const { type = null, parameter = null, value = 0 } = config;
        const objective = new Objective(config, type, parameter, value);

        this.objectives.push(objective);
    }
}

Mission.prototype.onObjective = function(type, parameter, count) {
    if(this.state !== Mission.STATE.STARTED) {
        return;
    }

    for(let i = 0; i < this.objectives.length; i++) {
        this.objectives[i].onObjective(type, parameter, count);
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

Mission.prototype.isCompleteable = function() {
    if(this.state !== Mission.STATE.STARTED) {
        return false;
    }

    let allObjectivesCompleted = true;

    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];

        if(objective.state === Objective.STATE.INCOMPLETE) {
            allObjectivesCompleted = false;
            break;
        }
    }

    return allObjectivesCompleted;
}

Mission.prototype.complete = function() {
    const previousState = this.state;

    this.state = Mission.STATE.COMPLETED;

    return previousState !== Mission.STATE.COMPLETED;
}

Mission.prototype.start = function() {
    if(this.state !== Mission.STATE.HIDDEN) {
        return false;
    }

    const previousState = this.state;

    this.state = Mission.STATE.STARTED;

    return previousState === Mission.STATE.HIDDEN;
}