import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

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

EventEmitter.prototype.on = function(eventType, onCall, options) {
    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    if(typeof onCall !== "function") {
        console.warn("onCall must be a function!");
        return;
    }

    const observerType = listener.getType(options);
    const observerID = listener.getID(options);

    listener.addObserver(observerType, observerID, onCall);

    return observerID;
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(subscriberID === Listener.ID.SUPER) {
        return;
    }

    const listener = this.listeners.get(eventType);

    if(!listener) {
        return;
    }

    listener.filterObservers((observer) => observer.subscriber !== subscriberID);
}

EventEmitter.prototype.unsubscribeAll = function(subscriberID) {
    if(subscriberID === Listener.ID.SUPER) {
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

    listener.filterObservers((observer) => observer.subscriber === Listener.ID.SUPER);
}

EventEmitter.prototype.muteAll = function() {
    this.listeners.forEach((listener) => {
        listener.filterObservers((observer) => observer.subscriber === Listener.ID.SUPER);
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