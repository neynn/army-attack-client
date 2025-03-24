import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

EventEmitter.SUPER_ID = "#";

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

EventEmitter.prototype.deafenAll = function() {
    this.listeners.clear();
}

EventEmitter.prototype.subscribe = function(eventType, subscriberID, onCall, options) {
    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    const observerType = options && options.once ? Listener.OBSERVER_TYPE.SINGLE : Listener.OBSERVER_TYPE.DEFAULT;

    listener.addObserver(observerType, subscriberID, onCall);
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(subscriberID === EventEmitter.SUPER_ID) {
        return;
    }

    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    listener.filterObservers((observer) => observer.subscriber !== subscriberID);
}

EventEmitter.prototype.unsubscribeAll = function(subscriberID) {
    if(subscriberID === EventEmitter.SUPER_ID) {
        return;
    }

    this.listeners.forEach((listener) => {
        listener.filterObservers((observer) => observer.subscriber !== subscriberID);
    });
}

EventEmitter.prototype.mute = function(eventType) {
    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    listener.filterObservers((observer) => observer.subscriber === EventEmitter.SUPER_ID);
}

EventEmitter.prototype.muteAll = function() {
    this.listeners.forEach((listener) => {
        listener.filterObservers((observer) => observer.subscriber === EventEmitter.SUPER_ID);
    });
}

EventEmitter.prototype.emit = function(eventType, ...args) {
    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    for(let i = 0; i < listener.observers.length; i++) {
        const observer = listener.observers[i];

        observer.onCall(...args);
    }

    for(let i = 0; i < listener.singleObservers.length; i++) {
        const observer = listener.singleObservers[i];

        observer.onCall(...args);
    }

    listener.singleObservers.length = 0;
}