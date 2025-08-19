export const EventBus = function() {
    this.emitable = {};
    this.handlers = [];
}

EventBus.prototype.setEmitableTable = function(table) {
    if(typeof table === "object") {
        this.emitable = table;
    }
}

EventBus.prototype.clear = function() {
    this.emitable = {};
    this.handlers = [];
}

EventBus.prototype.onEvent = function(handler) {
    if(typeof handler !== "function") {
        return;
    }

    this.handlers.push(handler);
}

EventBus.prototype.isEmitable = function(eventID) {
    const status = this.emitable[eventID];
    const isEmitable = status != 0;

    return isEmitable;
}

EventBus.prototype.emit = function(eventID, eventData) {
    if(!this.isEmitable(eventID)) {
        return;
    }

    for(let i = 0; i < this.handlers.length; i++) {
        this.handlers[i](eventID, eventData);
    }
}