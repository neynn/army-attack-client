export const EventQueue = function() {
    this.state = EventQueue.STATE.UNMUTED;
    this.events = new Map();
}

EventQueue.RESPONSE = {
    NONE: 0,
    DELETE: 1
};

EventQueue.STATE = {
    UNMUTED: 0,
    MUTED: 1
};

EventQueue.prototype.mute = function() {
    this.state = EventQueue.STATE.MUTED;
}

EventQueue.prototype.unmute = function() {
    this.state = EventQueue.STATE.UNMUTED;
}

EventQueue.prototype.register = function(eventID) {
    if(this.events.has(eventID)) {
        return;
    }

    this.events.set(eventID, []);
}

EventQueue.prototype.remove = function(eventID) {
    if(this.events.has(eventID)) {
        this.events.delete(eventID);
    }
}

EventQueue.prototype.on = function(eventID, onEvent) {
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    eventList.push(onEvent);
}

EventQueue.prototype.emit = function(eventID, ...eventData) {
    if(this.state === EventQueue.STATE.MUTED) {
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
            case EventQueue.RESPONSE.DELETE: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        eventList.splice(i, 1);
    }
}

EventQueue.prototype.force = function(eventID, eventData) {
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    const toRemove = [];

    for(let i = 0; i < eventList.length; i++) {
        const onEvent = eventList[i];
        const response = onEvent(...eventData);

        switch(response) {
            case EventQueue.RESPONSE.DELETE: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        eventList.splice(i, 1);
    }
}