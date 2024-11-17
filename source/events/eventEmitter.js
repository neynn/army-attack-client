import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

EventEmitter.SUPER_SUBSCRIBER_ID = "#";

EventEmitter.prototype.listen = function(eventType) {
    if(this.listeners.has(eventType)) {
        return false;
    }

    const listener = new Listener(eventType);
    
    this.listeners.set(eventType, listener);

    return true;
}

EventEmitter.prototype.deafen = function(eventType) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    this.listeners.delete(eventType);

    return true;
}

EventEmitter.prototype.kill = function() {
    this.listeners.clear();
}

EventEmitter.prototype.subscribe = function(eventType, subscriberID, onCall) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);
    const observer = {
        "subscriber": subscriberID,
        "onCall": onCall 
    };

    listener.observers.push(observer);

    return true;
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    if(subscriberID === EventEmitter.SUPER_SUBSCRIBER_ID) {
        return false;
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

    return true;
}

EventEmitter.prototype.emit = function(eventType, ...args) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);

    for(const { onCall } of listener.observers) {
        onCall(...args);
    }

    return true;
}

EventEmitter.prototype.mute = function(eventType) {
    if(!this.listeners.has(eventType)) {
        return false;
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

    return true;
}