import { EventEmitter } from "../source/events/eventEmitter.js";

export const MessageReceiver = function() {
    this.events = new EventEmitter();
}

MessageReceiver.prototype.on = function() {
    
}