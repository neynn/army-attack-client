import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

EventEmitter.SUPER_SUBSCRIBER_ID = "#";

EventEmitter.prototype.listen = function(eventType) {
    if(this.listeners.has(eventType)) {
        return;
    }

    const listener = new Listener(eventType);
    
    this.listeners.set(eventType, listener);
}

EventEmitter.prototype.deafen = function(eventType) {
    if(!this.listeners.has(eventType)) {
        return;
    }

    this.listeners.delete(eventType);
}

EventEmitter.prototype.kill = function() {
    this.listeners.clear();
}

EventEmitter.prototype.subscribe = function(eventType, subscriberID, onCall) {
    if(!this.listeners.has(eventType)) {
        return;
    }

    const listener = this.listeners.get(eventType);
    const observer = {
        "subscriber": subscriberID,
        "onCall": onCall 
    };

    listener.observers.push(observer);
}

EventEmitter.prototype.unsubscribeAll = function(subscriberID) {
    if(subscriberID === EventEmitter.SUPER_SUBSCRIBER_ID) {
        return;
    }

    for(const [listenerID, listener] of this.listeners) {
        const { observers } = listener;
        const remainingObservers = [];

        for(const observer of observers) {
            const { subscriber } = observer;

            if(subscriber !== subscriberID) {
                remainingObservers.push(observer);
            }
        }

        listener.observers = remainingObservers;
    }
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(!this.listeners.has(eventType)) {
        return;
    }

    if(subscriberID === EventEmitter.SUPER_SUBSCRIBER_ID) {
        return;
    }

    const remainingObservers = [];
    const listener = this.listeners.get(eventType);

    for(const observer of listener.observers) {
        const { subscriber } = observer;

        if(subscriber !== subscriberID) {
            remainingObservers.push(observer);
        }
    }

    listener.observers = remainingObservers;
}

EventEmitter.prototype.emit = function(eventType, ...args) {
    if(!this.listeners.has(eventType)) {
        return;
    }

    const listener = this.listeners.get(eventType);

    for(const { onCall } of listener.observers) {
        onCall(...args);
    }
}

EventEmitter.prototype.muteAll = function() {
    for(const [listenerID, listener] of this.listeners) {
        const { observers } = listener;
        const remainingObservers = [];

        for(const observer of observers) {
            const { subscriber } = observer;

            if(subscriber === EventEmitter.SUPER_SUBSCRIBER_ID) {
                remainingObservers.push(observer);
            }
        }

        listener.observers = remainingObservers;
    }
}

EventEmitter.prototype.mute = function(eventType) {
    if(!this.listeners.has(eventType)) {
        return;
    }

    const remainingObservers = [];
    const listener = this.listeners.get(eventType);

    for(const observer of listener.observers) {
        const { subscriber } = observer;

        if(subscriber === EventEmitter.SUPER_SUBSCRIBER_ID) {
            remainingObservers.push(observer);
        }
    }

    listener.observers = remainingObservers;
}