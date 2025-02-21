import { EventEmitter } from "../events/eventEmitter.js";

export const Keyboard = function() {
    this.keyBinds = new Map();
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

Keyboard.KEY = {
    W: "w",
    A: "a",
    S: "s",
    D: "d",
    E: "e",
    V: "v",
    SPACE: " ",
    SHIFT: "Shift",
    ENTER: "Enter",
    ESCAPE: "Escape",
    ARROW_UP: "ArrowUp",
    ARROW_DOWN: "ArrowDown",
    ARROW_LEFT: "ArrowLeft",
    ARROW_RIGHT: "ArrowRight",
};

Keyboard.prototype.init = function() {
    document.addEventListener("keydown", (event) => {
        const { key } = event;
        const keybind = this.keyBinds.get(key);

        if(keybind !== undefined) {
            event.preventDefault();
            this.onKeyDown(event.key, keybind);
        }
    });

    document.addEventListener("keyup", (event) => {
        const { key } = event;
        const keybind = this.keyBinds.get(key);

        if(keybind !== undefined) {
            event.preventDefault();
            this.onKeyUp(event.key, keybind);
        }
    });
}

Keyboard.prototype.onKeyDown = function(keyID, action) {
    if(!this.activeKeys.has(keyID)) {
        this.activeKeys.add(keyID);
        this.events.emit(Keyboard.EVENT.KEY_PRESSED, keyID, action);
    }
}

Keyboard.prototype.onKeyUp = function(keyID, action) {
    if(this.activeKeys.has(keyID)) {
        this.activeKeys.delete(keyID);
        this.events.emit(Keyboard.EVENT.KEY_RELEASED, keyID, action);
    }
}

Keyboard.prototype.bindKey = function(keyID, action) {
    if(this.keyBinds.has(keyID)) {
        return;
    }

    this.keyBinds.set(keyID, action);
    this.events.emit(Keyboard.EVENT.KEY_BOUND, keyID, action);
}

Keyboard.prototype.unbindKey = function(keyID) {
    if(!this.keyBinds.has(keyID)) {
        return;
    }

    this.keyBinds.delete(keyID);
}

Keyboard.prototype.unbindAction = function(action) {
    const unboundKeys = [];

    for(const [keyID, actionID] of this.keyBinds) {
        if(actionID === action) {
            unboundKeys.push(keyID);
        }
    }

    for(let i = 0; i < unboundKeys.length; i++) {
        const keyID = unboundKeys[i];

        this.keyBinds.delete(keyID);
        this.events.emit(Keyboard.EVENT.KEY_UNBOUND, keyID, action);
    }
}

Keyboard.prototype.update = function() {
    for(const keyID of this.activeKeys) {
        const keybind = this.keyBinds.get(keyID);

        this.events.emit(Keyboard.EVENT.KEY_DOWN, keyID, keybind);
    }
}