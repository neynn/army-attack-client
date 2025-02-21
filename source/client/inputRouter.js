import { InputListener } from "./inputListener.js";

export const InputRouter = function() {
    this.id = "ROUTER";
    this.listeners = new Map();
}

InputRouter.prototype.on = function(eventID, actionID, onCall) {
    const listener = this.listeners.get(eventID);

    if(!listener) {
        return;
    }

    listener.registerInput(actionID, onCall);
}

InputRouter.prototype.createInputListener = function(eventID, keyboard) {
    const { events } = keyboard;

    if(this.listeners.has(eventID)) {
        return;
    }

    this.listeners.set(eventID, new InputListener(eventID));

    events.subscribe(eventID, this.id, (keyID, actionID) => {
        const listener = this.listeners.get(eventID);

        listener.handleInput(actionID);
    });
}

InputRouter.prototype.deleteInputListener = function(eventID, keyboard) {
    const { events } = keyboard;

    if(!this.listeners.has(keyboardEvent)) {
        return;
    }

    this.listeners.delete(eventID);

    events.unsubscribe(eventID, this.id);
}