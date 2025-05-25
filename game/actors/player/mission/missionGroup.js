import { Mission } from "./mission.js";

export const MissionGroup = function() {
    this.missions = new Map();
}

MissionGroup.prototype.load = function(missions) {
    const { started, finished } = missions;
        
    for(const missionID of finished) {
        const mission = this.missions.get(missionID);

        if(mission) {
            mission.state = Mission.STATE.COMPLETED;
        }
    }

    for(const { id, objectives } of started) {
        const mission = this.missions.get(id);

        if(mission) {
            mission.loadProgress(objectives);
        }
    }

    this.unlockMissions();
}

MissionGroup.prototype.save = function() {
    const started = [];
    const finished = [];

    for(const [missionID, mission] of this.missions) {
        switch(mission.state) {
            case Mission.STATE.STARTED: {
                started.push({
                    "id": missionID,
                    "objectives": mission.saveProgress()
                });
                break;
            }
            case Mission.STATE.COMPLETED: {
                finished.push(missionID);
                break;
            }
        }
    }

    return {
        "started": started,
        "finished": finished
    }
}

MissionGroup.prototype.loadMissions = function(missions) {
    for(const missionID in missions) {
        if(!this.missions.has(missionID)) {
            const mission = new Mission(missions[missionID]);

            this.missions.set(missionID, mission);
        }
    }
}

MissionGroup.prototype.allRequiredCompleted = function(required) {
    for(let i = 0; i < required.length; i++) {
        const missionID = required[i];
        const mission = this.missions.get(missionID);

        if(!mission || mission.state !== Mission.STATE.COMPLETED) {
            return false;
        }
    }

    return true;
}

MissionGroup.prototype.unlockMissions = function() {
    for(const [missionID, mission] of this.missions) {
        if(mission.state === Mission.STATE.HIDDEN) {
            const required = mission.getRequired();
            const allCompleted = this.allRequiredCompleted(required);

            if(allCompleted) {
                mission.start();
            }
        }
    }
}