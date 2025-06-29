import { EventEmitter } from "../../../../source/events/eventEmitter.js";
import { Mission } from "./mission.js";

export const MissionGroup = function() {
    this.missions = new Map();
    this.state = MissionGroup.STATE.INCOMPLETE;

    this.events = new EventEmitter();
    this.events.listen(MissionGroup.EVENT.ALL_COMPLETED);
    this.events.listen(MissionGroup.EVENT.MISSION_STARTED);
    this.events.listen(MissionGroup.EVENT.MISSION_COMPLETED);
}

MissionGroup.EVENT = {
    ALL_COMPLETED: "ALL_COMPLETED",
    MISSION_STARTED: "MISSION_STARTED",
    MISSION_COMPLETED: "MISSION_COMPLETED"
};

MissionGroup.STATE = {
    INCOMPLETE: 0,
    COMPLETE: 1
};

MissionGroup.KEY = {
    STARTED: "missions_started",
    FINISHED: "missions_finished"
};

MissionGroup.prototype.load = function(missions) {
    const started = missions[MissionGroup.KEY.STARTED];
    const finished = missions[MissionGroup.KEY.FINISHED];
        
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
    this.updateState();
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
        [MissionGroup.KEY.STARTED]: started,
        [MissionGroup.KEY.FINISHED]: finished
    }
}

MissionGroup.prototype.init = function(missions) {
    for(const missionID in missions) {
        if(!this.missions.has(missionID)) {
            const mission = new Mission(missions[missionID]);

            this.missions.set(missionID, mission);
        }
    }

    this.unlockMissions();
    this.updateState();
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

MissionGroup.prototype.updateState = function() {
    if(this.state !== MissionGroup.STATE.INCOMPLETE) {
        return;
    }

    for(const [missionID, mission] of this.missions) {
        if(mission.state !== Mission.STATE.COMPLETED) {
            this.state = MissionGroup.STATE.INCOMPLETE;
            return;
        }
    }

    this.state = MissionGroup.STATE.COMPLETE;
    this.events.emit(MissionGroup.EVENT.ALL_COMPLETED);
}

MissionGroup.prototype.unlockMissions = function() {
    for(const [missionID, mission] of this.missions) {
        if(mission.state === Mission.STATE.HIDDEN) {
            const required = mission.getRequired();
            const allCompleted = this.allRequiredCompleted(required);

            if(allCompleted) {
                const hasStarted = mission.start();

                if(hasStarted) {
                    this.events.emit(MissionGroup.EVENT.MISSION_STARTED, missionID, mission);
                }
            }
        }
    }
}

MissionGroup.prototype.handleObjective = function(type, parameter, count) {
    for(const [missionID, mission] of this.missions) {
        mission.onObjective(type, parameter, count);

        const isCompleted = mission.complete();

        if(isCompleted) {
            this.events.emit(MissionGroup.EVENT.MISSION_COMPLETED, missionID, mission);
        }
    }

    this.unlockMissions();
    this.updateState();
}

MissionGroup.prototype.getActiveMissions = function() {
    const missions = [];

    for(const [missionID, mission] of this.missions) {
        if(mission.state === Mission.STATE.STARTED) {
            missions.push(mission);
        }
    }

    return missions;
}