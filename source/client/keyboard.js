import { EventEmitter } from "../events/eventEmitter.js";

export const Keyboard = function() {
    this.keys = new Set();
    this.activeKeys = new Set();

    this.addEventHandler("keydown", (event) => this.eventKeyPress(event.key));
    this.addEventHandler("keyup", (event) => this.eventKeyRelease(event.key));

    this.events = new EventEmitter();
    this.events.listen(Keyboard.EVENT.KEY_PRESSED);
    this.events.listen(Keyboard.EVENT.KEY_RELEASED);
    this.events.listen(Keyboard.EVENT.KEY_DOWN);

    this.keys.add("w");
    this.keys.add("a");
    this.keys.add("s");
    this.keys.add("d");
    this.keys.add("b");
    this.keys.add("e");
    this.keys.add(" ");
    this.keys.add("Shift");
}

Keyboard.EVENT = {
    "KEY_PRESSED": "KEY_PRESSED",
    "KEY_RELEASED": "KEY_RELEASED",
    "KEY_DOWN": "KEY_DOWN"
};

Keyboard.prototype.eventKeyPress = function(key) {
    if(!this.activeKeys.has(key)) {
        this.activeKeys.add(key);
        this.events.emit(Keyboard.EVENT.KEY_PRESSED, key, this);
    }
}

Keyboard.prototype.eventKeyRelease = function(key) {
    if(this.activeKeys.has(key)) {
        this.activeKeys.delete(key);
        this.events.emit(Keyboard.EVENT.KEY_RELEASED, key, this);
    }
}

Keyboard.prototype.addEventHandler = function(type, onEvent) {
    document.addEventListener(type, (event) => {
        if(this.keys.has(event.key)) {
            event.preventDefault();
            onEvent(event);
        }
    });
}

Keyboard.prototype.addEvent = function(eventID, keyID, onCall) {
    if(!this.keys.has(keyID)) {
        return;
    }

    this.events.subscribe(eventID, keyID, (key, keyboard) => {
        if(key === keyID) {
            onCall(key, keyboard);
        }
    });
}

Keyboard.prototype.update = function() {
    for(const key of this.activeKeys) {
        this.events.emit(Keyboard.EVENT.KEY_DOWN, key, this);
    }
}