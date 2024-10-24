import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

EventEmitter.prototype.listen = function(eventType) {
    if(this.listeners.has(eventType)) {
        return false;
    }

    const listener = new Listener(eventType);
    this.listeners.set(eventType, listener);

    return true;
}

EventEmitter.prototype.subscribe = function(eventType, subscriberID, callback) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);
    const observer = { "subscriber": subscriberID, "callback": callback };
    listener.observers.push(observer);

    return true;
}

EventEmitter.prototype.emit = function(eventType, ...args) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);

    for(const { callback } of listener.observers) {
        callback(...args);
    }

    return true;
}

EventEmitter.prototype.deafen = function(eventType) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);
    listener.observers = [];

    return true;
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(!this.listeners.has(eventType)) {
        return false;
    }

    const listener = this.listeners.get(eventType);
    const remainingObservers = listener.observers.filter(observer => observer.subscriber !== subscriberID);
    listener.observers = remainingObservers;

    return true;
}