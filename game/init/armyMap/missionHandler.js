import { EventEmitter } from "../../../source/events/eventEmitter.js";
import { Mission } from "./mission.js";

export const MissionHandler = function() {
    this.missions = new Map();

    this.events = new EventEmitter();
    this.events.listen(MissionHandler.EVENT.MISSION_STARTED);
    this.events.listen(MissionHandler.EVENT.MISSION_COMPLETED);
}

MissionHandler.EVENT = {
    MISSION_STARTED: "MISSION_STARTED",
    MISSION_COMPLETED: "MISSION_COMPLETED"
};

MissionHandler.prototype.init = function(missions) {
    for(const missionID in missions) {
        if(!this.missions.has(missionID)) {
            const mission = new Mission(missions[missionID]);

            this.missions.set(missionID, mission);
        }
    }
}

MissionHandler.prototype.allRequiredCompleted = function(required) {
    for(let i = 0; i < required.length; i++) {
        const missionID = required[i];
        const mission = this.missions.get(missionID);

        if(!mission || mission.state !== Mission.STATE.COMPLETED) {
            return false;
        }
    }

    return true;
}

MissionHandler.prototype.unlockMissions = function() {
    for(const [missionID, mission] of this.missions) {
        if(mission.state === Mission.STATE.HIDDEN) {
            const required = mission.getRequired();
            const allCompleted = this.allRequiredCompleted(required);

            if(allCompleted) {
                const hasStarted = mission.start();

                if(hasStarted) {
                    this.events.emit(MissionHandler.EVENT.MISSION_STARTED, missionID, mission);
                }
            }
        }
    }
}

MissionHandler.prototype.load = function(blob) {
    for(const missionID in blob) {
        const mission = this.missions.get(missionID);

        if(mission) {
            mission.state = blob[missionID];
        }
    }

    this.unlockMissions();
}

MissionHandler.prototype.save = function() {
    const blob = {};

    for(const [missionID, mission] of this.missions) {
        blob[missionID] = mission.state;
    }

    return blob;
}

MissionHandler.prototype.onObjective = function(objectiveType, parameter) {
    for(const [missionID, mission] of this.missions) {
        if(mission.state === Mission.STATE.STARTED) {
            //check objective.
            //if objective is done, then proceed.
        }
    }
}