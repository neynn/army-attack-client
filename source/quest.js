export const Quest = function() {
    this.rewards = []; //list of reward items -> rewardType = Item, Resource
    this.narrator = null; //id of the narrator
    this.objectives = []; //list of objectives
}

//checks all objectives and returns false if only one is not completed.
Quest.prototype.getCompleted = function() {
    for(const objective of this.objectives) {
        const isCompleted = objective.getCompleted();

        if(!isCompleted) {
            return false;
        }
    }

    return true;
}


//hooks into world events.
export const Objective = function() {
    this.state = Objective.STATE.INCOMPLETE; //objective starts as incomplete
    this.type = ""; //tid of the objective.
    //need: parameter of the values passed in.
    //need: count of the values passed in.

    //e.g. kill_entity -> value: "red_scout", count: "5"
    //when kill_entity -> 
}

Objective.STATE = {
    "COMPLETE": 0,
    "INCOMPLETE": 1
};

//mutateable? KillEntity = Objective; onCheck = (blob) -> { "entityID", "attackers", "messengerID" }
//messengerid is used by the questManager to determine who the progress gets attributed to.
//but client events?
Objective.prototype.onCheck = function() {}

Objective.prototype.complete = function() {
    this.state = Objective.STATE.COMPLETE;
}

Objective.prototype.getCompleted = function() {
    return this.state === Objective.STATE.COMPLETE;
}