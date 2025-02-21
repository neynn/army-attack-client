import { EventEmitter } from "../events/eventEmitter.js";

export const Keyboard = function() {
    this.keybinds = new Set();
    this.activeKeys = new Set();

    this.events = new EventEmitter();
    this.events.listen(Keyboard.EVENT.KEY_PRESSED);
    this.events.listen(Keyboard.EVENT.KEY_RELEASED);
    this.events.listen(Keyboard.EVENT.KEY_DOWN);
    this.events.listen(Keyboard.EVENT.KEY_BOUND);
    this.events.listen(Keyboard.EVENT.KEY_UNBOUND);

    this.init();
}

Keyboard.EVENT = {
    KEY_PRESSED: "KEY_PRESSED",
    KEY_RELEASED: "KEY_RELEASED",
    KEY_DOWN: "KEY_DOWN",
    KEY_BOUND: "KEY_BOUND",
    KEY_UNBOUND: "KEY_UNBOUND"
};

Keyboard.prototype.init = function() {
    document.addEventListener("keydown", (event) => {
        const { key } = event;

        if(this.keybinds.has(key)) {
            event.preventDefault();
            this.onKeyDown(event.key);
        }
    });

    document.addEventListener("keyup", (event) => {
        const { key } = event;

        if(this.keybinds.has(key)) {
            event.preventDefault();
            this.onKeyUp(event.key);
        }
    });
}

Keyboard.prototype.onKeyDown = function(keyID) {
    if(!this.activeKeys.has(keyID)) {
        this.activeKeys.add(keyID);
        this.events.emit(Keyboard.EVENT.KEY_PRESSED, keyID);
    }
}

Keyboard.prototype.onKeyUp = function(keyID) {
    if(this.activeKeys.has(keyID)) {
        this.activeKeys.delete(keyID);
        this.events.emit(Keyboard.EVENT.KEY_RELEASED, keyID);
    }
}

Keyboard.prototype.reserve = function(keyID) {
    if(this.keybinds.has(keyID)) {
        return;
    }

    this.keybinds.add(keyID);
    this.events.emit(Keyboard.EVENT.KEY_BOUND, keyID);
}

Keyboard.prototype.free = function(keyID) {
    if(!this.keybinds.has(keyID)) {
        return;
    }

    this.keybinds.delete(keyID);
}

Keyboard.prototype.update = function() {
    for(const keyID of this.activeKeys) {
        this.events.emit(Keyboard.EVENT.KEY_DOWN, keyID);
    }
}