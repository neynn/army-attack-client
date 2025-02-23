import { EventEmitter } from "../events/eventEmitter.js";
import { Cursor } from "./cursor.js";

export const InputRouter = function() {
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

InputRouter.CURSOR_INPUT = {
    M1: "M1",
    M2: "M2",
    M3: "M3"
};

InputRouter.KEY_INPUT = {
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
    ARROW_RIGHT: "ArrowRight"
};

InputRouter.prototype.clearCommands = function() {
    this.commands.clear();
}

InputRouter.prototype.clearBinds = function(gameContext) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const [inputID, commandID] of this.commandBinds) {
        const keyID = inputID.slice(1);

        if(InputRouter.CURSOR_INPUT[keyID] === undefined) {
            keyboard.free(keyID);
        }
    }

    this.commandBinds.clear();
}

InputRouter.prototype.load = function(gameContext, binds) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const commandID in binds) {
        const inputID = binds[commandID];
        
        if(inputID.length === 0) {
            continue;
        }

        const prefixID = inputID[0];
        
        if(inputID.length > 1 && (prefixID === InputRouter.PREFIX.DOWN || prefixID === InputRouter.PREFIX.UP)) {
            const keyID = inputID.slice(1);

            this.bindInput(inputID, commandID);

            if(InputRouter.CURSOR_INPUT[keyID] === undefined) {
                keyboard.reserve(keyID);
            }
        } else {
            this.bindInput(InputRouter.PREFIX.DOWN + inputID, commandID);
            this.bindInput(InputRouter.PREFIX.UP + inputID, commandID);
    
            if(InputRouter.CURSOR_INPUT[inputID] === undefined) {
                keyboard.reserve(inputID);
            }
        }
    }
}

InputRouter.prototype.bindInput = function(inputID, commandID) {
    if(this.commandBinds.has(inputID)) {
        return;
    }

    this.commandBinds.set(inputID, commandID);
}

InputRouter.prototype.on = function(commandID, command) {
    if(this.commands.has(commandID) || typeof command !== "function") {
        return;
    }

    this.commands.set(commandID, command);
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

InputRouter.prototype.createKeyboardListener = function(eventID, prefixID, keyboard) {
    const { events } = keyboard;

    events.subscribe(eventID, EventEmitter.SUPER_ID, (keyID) => this.handleInput(keyID, prefixID));
}

InputRouter.prototype.createMouseListener = function(eventID, prefixID, cursor) {
    const { events } = cursor;

    events.subscribe(eventID, EventEmitter.SUPER_ID, (buttonID) => {
        const inputID = InputRouter.CURSOR_MAP[buttonID];

        if(inputID !== undefined) {
            this.handleInput(inputID, prefixID);
        }
    });
}