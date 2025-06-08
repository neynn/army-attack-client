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

MissionHandler.prototype.createGroup = function(groupID, missions, onCreate) {
    if(this.groups.has(groupID)) {
        return;
    }

    const group = new MissionGroup();

    if(typeof onCreate === "function") {
        onCreate(group);
    }

    group.init(missions);

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

MissionHandler.prototype.onObjective = function(type, parameter, count) {
    if(this.current) {
        this.current.handleObjective(type, parameter, count);
    }
}