import { EventEmitter } from "../../../../source/events/eventEmitter.js";
import { GameEvent } from "../../../gameEvent.js";
import { Mission } from "./mission.js";

export const MissionHandler = function() {
    this.missions = new Map();

    this.events = new EventEmitter();
    this.events.listen(MissionHandler.EVENT.MISSION_STARTED);
}

MissionHandler.EVENT = {
    MISSION_STARTED: "MISSION_STARTED"
};

MissionHandler.prototype.init = function(missions) {
    for(const missionID in missions) {
        if(!this.missions.has(missionID)) {
            const mission = new Mission(missions[missionID]);

            this.missions.set(missionID, mission);
        }
    }

    this.unlockMissions();
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
    const { started, finished } = blob;
    
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

MissionHandler.prototype.save = function() {
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

MissionHandler.prototype.onObjective = function(gameContext, type, parameter, count, actorID) {
    const { world } = gameContext;
    const { eventBus } = world;

    for(const [missionID, mission] of this.missions) {
        mission.onObjective(type, parameter, count);

        const isCompleteable = mission.isCompleteable();

        if(isCompleteable) {
            const isFirstCompletion = mission.complete();

            if(isFirstCompletion) {
                eventBus.emit(GameEvent.TYPE.MISSION_COMPLETE, {
                    "id": missionID,
                    "mission": mission,
                    "actor": actorID
                });
            }
        }
    }
}