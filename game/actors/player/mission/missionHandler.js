import { GameEvent } from "../../../gameEvent.js";
import { MissionGroup } from "./missionGroup.js";

export const MissionHandler = function() {
    this.groups = new Map();
    this.current = null;
}

MissionHandler.prototype.clear = function() {
    this.groups.clear();
    this.current = null;
}

MissionHandler.prototype.deselectGroup = function() {
    this.current = null;
}

MissionHandler.prototype.selectGroup = function(groupID) {
    const group = this.groups.get(groupID);

    if(group) {
        this.current = group;
    } else {
        this.current = null;
    }
}

MissionHandler.prototype.createGroup = function(groupID, missions) {
    if(this.groups.has(groupID)) {
        return;
    }

    const group = new MissionGroup();

    group.loadMissions(missions);
    group.unlockMissions();

    this.groups.set(groupID, group);
}

MissionHandler.prototype.load = function(groups) {
    for(const groupID in groups) {
        const group = this.groups.get(groupID);

        if(group) {
            group.load(groups[groupID]);
        }
    }
}

MissionHandler.prototype.save = function() {
    const groups = {};

    for(const [groupID, group] of this.groups) {
        groups[groupID] = group.save();
    }

    return groups;
}

MissionHandler.prototype.onObjective = function(gameContext, type, parameter, count, actorID) {
    if(!this.current) {
        return;
    }

    const { world } = gameContext;
    const { eventBus } = world;
    const { missions } = this.current;

    for(const [missionID, mission] of missions) {
        mission.onObjective(type, parameter, count);

        const isCompleteable = mission.isCompleteable();

        if(isCompleteable) {
            const isFirstCompletion = mission.complete();

            if(isFirstCompletion) {
                eventBus.emit(GameEvent.TYPE.MISSION_COMPLETE, {
                    "id": missionID,
                    "mission": mission,
                    "actorID": actorID
                });
            }
        }
    }
}