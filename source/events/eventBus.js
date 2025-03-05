export const EventBus = function() {
    this.events = new Map();
    this.emitable = new Set();
}

EventBus.RESPONSE = {
    NONE: 0,
    DELETE: 1
};

EventBus.STATUS = {
    EMITABLE: 0,
    NOT_EMITABLE: 1
};

EventBus.prototype.clear = function() {
    this.events.clear();
}

EventBus.prototype.register = function(eventID, status) {
    if(this.events.has(eventID)) {
        return;
    }

    this.events.set(eventID, []);

    switch(status) {
        case EventBus.STATUS.EMITABLE: {
            this.emitable.add(eventID);
            break;
        }
        default: {
            break;
        }
    }
}

EventBus.prototype.remove = function(eventID) {
    if(this.events.has(eventID)) {
        this.events.delete(eventID);
    }

    if(this.emitable.has(eventID)) {
        this.emitable.delete(eventID);
    }
}

EventBus.prototype.on = function(eventID, onEvent) {
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    eventList.push(onEvent);
}

EventBus.prototype.updateEventList = function(eventList, eventData) {
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
        const index = toRemove[i];

        eventList.splice(index, 1);
    }
}

EventBus.prototype.emit = function(eventID, ...eventData) {
    const isEmitable = this.emitable.has(eventID);
    const eventList = this.events.get(eventID);

    if(!isEmitable || !eventList || eventList.length === 0) {
        return;
    }

    this.updateEventList(eventList, eventData);
}

EventBus.prototype.force = function(eventID, eventData) {
    const eventList = this.events.get(eventID);

    if(!eventList || eventList.length === 0) {
        return;
    }

    this.updateEventList(eventList, eventData);
}