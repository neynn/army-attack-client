export const InputListener = function(id) {
    this.id = id;
    this.events = new Map();
}

InputListener.prototype.registerInput = function(actionID, onCall) {
    if(this.events.has(actionID) || typeof onCall !== "function") {
        return;
    }

    this.events.set(actionID, onCall);
}

InputListener.prototype.handleInput = function(actionID) {
    const event = this.events.get(actionID);

    if(event) {
        event();
    }
}