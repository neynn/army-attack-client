export const WorldEventHandler = function() {
    this.events = new Map();
    this.emitable = {};
}

WorldEventHandler.prototype.setEmitableTable = function(table) {
    if(typeof table === "object") {
        this.emitable = table;
    }
}

WorldEventHandler.prototype.clear = function() {
    this.emitable = {};
    this.events.clear();
}

WorldEventHandler.prototype.on = function(eventID, handler) {
    if(this.events.has(eventID) || typeof handler !== "function") {
        return;
    }

    this.events.set(eventID, handler);
}

WorldEventHandler.prototype.remove = function(eventID) {
    if(this.events.has(eventID)) {
        this.events.delete(eventID);
    }
}

WorldEventHandler.prototype.isEmitable = function(eventID) {
    const status = this.emitable[eventID];

    return status !== undefined && status !== 0;
}

WorldEventHandler.prototype.emit = function(eventID, eventData) {
    const handler = this.events.get(eventID);

    if(!handler || !this.isEmitable(eventID)) {
        return;
    }

    handler(eventData);
}