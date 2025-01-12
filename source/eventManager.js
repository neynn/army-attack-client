import { EventEmitter } from "./events/eventEmitter.js";

export const EventManager = function() {
    this.eventTypes = {};
    this.events = new EventEmitter();
    this.events.listen(EventManager.EVENT.BROADCAST);
}

EventManager.EVENT = {
    "BROADCAST": "BROADCAST"
};

EventManager.prototype.load = function(eventTypes) {
    if(!eventTypes) {
        return;
    }

    this.eventTypes = eventTypes;
}

EventManager.prototype.emitEvent = function(type, event) {
    const eventType = this.eventTypes[type];

    if(!eventType) {
        return;
    }
}