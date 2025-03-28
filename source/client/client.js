import { Cursor } from "./cursor.js";
import { Keyboard } from "./keyboard.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./sound/soundPlayer.js";
import { InputRouter } from "./inputRouter.js";
import { MusicPlayer } from "./music/musicPlayer.js";
import { EventEmitter } from "../events/eventEmitter.js";

export const Client = function() {
    this.router = new InputRouter();
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
    this.socket = new Socket();

    this.createKeyboardListener(Keyboard.EVENT.KEY_PRESSED, InputRouter.PREFIX.DOWN);
    this.createKeyboardListener(Keyboard.EVENT.KEY_RELEASED, InputRouter.PREFIX.UP);
    this.createMouseListener(Cursor.EVENT.BUTTON_DOWN, InputRouter.PREFIX.DOWN);
    this.createMouseListener(Cursor.EVENT.BUTTON_CLICK, InputRouter.PREFIX.UP);
}

Client.BUTTON_MAP = {
    [Cursor.BUTTON.LEFT]: InputRouter.CURSOR_INPUT.M1,
    [Cursor.BUTTON.MIDDLE]: InputRouter.CURSOR_INPUT.M3,
    [Cursor.BUTTON.RIGHT]: InputRouter.CURSOR_INPUT.M2
};

Client.prototype.createKeyboardListener = function(eventID, prefixID) {    
    this.keyboard.events.subscribe(eventID, EventEmitter.SUPER_ID, (keyID) => {
        this.router.handleInput(prefixID, keyID);
    });
}

Client.prototype.createMouseListener = function(eventID, prefixID) {
    this.cursor.events.subscribe(eventID, EventEmitter.SUPER_ID, (buttonID) => {
        const inputID = Client.BUTTON_MAP[buttonID];

        if(inputID !== undefined) {
            this.router.handleInput(prefixID, inputID);
        }
    });
}

Client.prototype.update = function() {
    this.keyboard.update();
    this.cursor.update();
}

Client.prototype.isOnline = function() {
    if(!this.socket.isConnected) {
        return false;
    }

    if(!this.socket.socket) {
        return false;
    }

    return true;
}