import { LimitGroup } from "./limitGroup.js";

export const UnitLimitHandler = function() {
    this.groups = new Map();
    this.current = null;
}

UnitLimitHandler.prototype.clear = function() {
    this.groups.clear();
    this.current = null;
}

UnitLimitHandler.prototype.deselectGroup = function() {
    this.current = null;
}

UnitLimitHandler.prototype.selectGroup = function(groupID) {
    const group = this.groups.get(groupID);

    if(group) {
        this.current = group;
    } else {
        this.current = null;
    }
}

UnitLimitHandler.prototype.createGroup = function(groupID, onCreate) {
    if(this.groups.has(groupID)) {
        return;
    }

    const group = new LimitGroup();

    if(typeof onCreate === "function") {
        onCreate(group);
    }

    this.groups.set(groupID, group);
}