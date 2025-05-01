export const WorldEventHandler = function() {
    this.events = new Map();
    this.tellable = new Set();
}

WorldEventHandler.RESPONSE = {
    NONE: 0,
    DELETE: 1
};

WorldEventHandler.STATUS = {
    EMITABLE: 0
};

WorldEventHandler.prototype.exit = function() {
    this.events.clear();
    this.tellable.clear();
}

WorldEventHandler.prototype.clear = function() {
    this.events.clear();
}

WorldEventHandler.prototype.register = function(eventID, status) {
    if(this.events.has(eventID)) {
        return;
    }

    this.events.set(eventID, []);

    if(status === WorldEventHandler.STATUS.EMITABLE) {
        this.tellable.add(eventID);
    }
}

WorldEventHandler.prototype.remove = function(eventID) {
    if(this.events.has(eventID)) {
        this.events.delete(eventID);
    }

    if(this.tellable.has(eventID)) {
        this.tellable.delete(eventID);
    }
}

WorldEventHandler.prototype.on = function(eventID, onEvent) {
    if(typeof onEvent !== "function") {
        return;
    }
    
    const eventList = this.events.get(eventID);

    if(!eventList) {
        return;
    }

    eventList.push(onEvent);
}

WorldEventHandler.prototype.updateEventList = function(eventList, eventData) {
    const toRemove = [];

    for(let i = 0; i < eventList.length; i++) {
        const onEvent = eventList[i];
        const response = onEvent(eventData);

        if(response === WorldEventHandler.RESPONSE.DELETE) {
            toRemove.push(i);
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        const index = toRemove[i];

        eventList.splice(index, 1);
    }
}

WorldEventHandler.prototype.emit = function(eventID, eventData) {
    const isEmitable = this.tellable.has(eventID);
    const eventList = this.events.get(eventID);

    if(!isEmitable || !eventList || eventList.length === 0) {
        return;
    }

    this.updateEventList(eventList, eventData);
}

WorldEventHandler.prototype.force = function(eventID, eventData) {
    const eventList = this.events.get(eventID);

    if(!eventList || eventList.length === 0) {
        return;
    }

    this.updateEventList(eventList, eventData);
}