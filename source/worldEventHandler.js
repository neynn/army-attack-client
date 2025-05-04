export const WorldEventHandler = function() {
    this.events = new Map();
}

WorldEventHandler.prototype.clear = function() {
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

WorldEventHandler.prototype.emit = function(eventID, eventData) {
    const handler = this.events.get(eventID);

    if(!handler) {
        return;
    }

    handler(eventData);
}