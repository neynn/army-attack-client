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
    this.createMouseListener(Cursor.EVENT.LEFT_MOUSE_DOWN, InputRouter.PREFIX.DOWN, InputRouter.CURSOR_INPUT.M1);
    this.createMouseListener(Cursor.EVENT.LEFT_MOUSE_CLICK, InputRouter.PREFIX.UP, InputRouter.CURSOR_INPUT.M1);
    this.createMouseListener(Cursor.EVENT.RIGHT_MOUSE_DOWN, InputRouter.PREFIX.DOWN, InputRouter.CURSOR_INPUT.M2);
    this.createMouseListener(Cursor.EVENT.RIGHT_MOUSE_CLICK, InputRouter.PREFIX.UP, InputRouter.CURSOR_INPUT.M2);
}

Client.prototype.createKeyboardListener = function(eventID, prefixID) {    
    this.keyboard.events.subscribe(eventID, EventEmitter.SUPER_ID, (keyID) => {
        this.router.handleInput(prefixID, keyID);
    });
}

Client.prototype.createMouseListener = function(eventID, prefixID, buttonID) {
    this.cursor.events.subscribe(eventID, EventEmitter.SUPER_ID, (cursorX, cursorY) => {
        this.router.handleInput(prefixID, buttonID);
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