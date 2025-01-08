import { EventEmitter } from "../source/events/eventEmitter.js";

export const MessageReceiver = function() {
    this.events = new EventEmitter();
}

MessageReceiver.prototype.on = function(messageID, onMessage) {
    this.events.listen(messageID);
    this.events.subscribe(messageID, messageID, onMessage);
}

MessageReceiver.prototype.silence = function(messageID) {
    this.events.deafen(messageID);
}
