export const EventBus = function() {
    this.state = EventBus.STATE.UNMUTED;
    this.events = new Map();
}

EventBus.RESPONSE = {
    NONE: 0,
    DELETE: 1
};

EventBus.STATE = {
    UNMUTED: 0,
    MUTED: 1
};

EventBus.prototype.mute = function() {
    this.state = EventBus.STATE.MUTED;
}

EventBus.prototype.unmute = function() {
    this.state = EventBus.STATE.UNMUTED;
}

EventBus.prototype.register = function(eventID) {
    if(this.events.has(eventID)) {
        return;
    }

    this.events.set(eventID, []);
}

EventBus.prototype.remove = function(eventID) {
    if(this.events.has(eventID)) {
        this.events.delete(eventID);
    }
}

EventBus.prototype.on = function(eventID, onEvent) {
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    eventList.push(onEvent);
}

EventBus.prototype.emit = function(eventID, ...eventData) {
    if(this.state === EventBus.STATE.MUTED) {
        return;
    }

    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    const toRemove = [];

    for(let i = 0; i < eventList.length; i++) {
        const onEvent = eventList[i];
        const response = onEvent(...eventData);

        switch(response) {
            case EventBus.RESPONSE.DELETE: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        eventList.splice(i, 1);
    }
}

EventBus.prototype.force = function(eventID, eventData) {
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    const toRemove = [];

    for(let i = 0; i < eventList.length; i++) {
        const onEvent = eventList[i];
        const response = onEvent(...eventData);

        switch(response) {
            case EventBus.RESPONSE.DELETE: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        eventList.splice(i, 1);
    }
}