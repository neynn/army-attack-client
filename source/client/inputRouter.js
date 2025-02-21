import { Cursor } from "./cursor.js";

export const InputRouter = function() {
    this.id = "ROUTER";
    this.commandBinds = new Map();
    this.commands = new Map();
}

InputRouter.PREFIX = {
    DOWN: "+",
    UP: "-"
};

InputRouter.CURSOR_MAP = {
    [Cursor.BUTTON_LEFT]: "M1",
    [Cursor.BUTTON_RIGHT]: "M2",
    [Cursor.BUTTON_MIDDLE]: "M3"
};

InputRouter.INPUT = {
    KEY_W: "w",
    KEY_A: "a",
    KEY_S: "s",
    KEY_D: "d",
    KEY_E: "e",
    KEY_V: "v",
    KEY_SPACE: " ",
    KEY_SHIFT: "Shift",
    KEY_ENTER: "Enter",
    KEY_ESCAPE: "Escape",
    KEY_ARROW_UP: "ArrowUp",
    KEY_ARROW_DOWN: "ArrowDown",
    KEY_ARROW_LEFT: "ArrowLeft",
    KEY_ARROW_RIGHT: "ArrowRight",
    MOUSE_LEFT: "M1",
    MOUSE_RIGHT: "M2",
    MOUSE_MIDDLE: "M3"
};

InputRouter.prototype.load = function(gameContext, binds) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const commandID in binds) {
        const inputID = binds[commandID];
        
        if(inputID.length <= 1) {
            continue;
        }

        const prefixID = inputID[0];

        if(prefixID !== InputRouter.PREFIX.DOWN && prefixID !== InputRouter.PREFIX.UP) {
            continue;
        }

        const keyID = inputID.slice(1);

        keyboard.reserve(keyID);

        this.bindInput(inputID, commandID);
    }
}

InputRouter.prototype.bindInput = function(inputID, commandID) {
    if(this.commandBinds.has(inputID)) {
        return;
    }

    this.commandBinds.set(inputID, commandID);
}

InputRouter.prototype.freeInput = function(inputID) {
    if(!this.commandBinds.has(inputID)) {
        return;
    }

    this.commandBinds.delete(inputID);
}

InputRouter.prototype.on = function(commandID, command) {
    if(this.commands.has(commandID) || typeof command !== "function") {
        return;
    }

    this.commands.set(commandID, command);
}

InputRouter.prototype.createKeyboardListener = function(eventID, prefixID, keyboard) {
    const { events } = keyboard;

    events.subscribe(eventID, this.id, (keyID) => this.handleInput(keyID, prefixID));
}

InputRouter.prototype.handleInput = function(inputID, prefix) {
    const prefixedID = prefix + inputID;

    if(!this.commandBinds.has(prefixedID)) {
        return;
    }

    const commandID = this.commandBinds.get(prefixedID);
    const command = this.commands.get(commandID);

    if(command) {
        command();
    }
} 

InputRouter.prototype.createMouseListener = function(eventID, prefixID, cursor) {
    const { events } = cursor;

    events.subscribe(eventID, this.id, (buttonID) => {
        const inputID = InputRouter.CURSOR_MAP[buttonID];

        if(inputID !== undefined) {
            this.handleInput(inputID, prefixID);
        }
    });
}