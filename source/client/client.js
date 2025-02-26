import { Cursor } from "./cursor.js";
import { Keyboard } from "./keyboard.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./sound/soundPlayer.js";
import { InputRouter } from "./inputRouter.js";
import { MusicPlayer } from "./music/musicPlayer.js";

export const Client = function() {
    this.router = new InputRouter();
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
    this.socket = new Socket();

    this.router.createKeyboardListener(Keyboard.EVENT.KEY_PRESSED, InputRouter.PREFIX.DOWN, this.keyboard);
    this.router.createKeyboardListener(Keyboard.EVENT.KEY_RELEASED, InputRouter.PREFIX.UP, this.keyboard);
    this.router.createMouseListener(Cursor.EVENT.LEFT_MOUSE_CLICK, InputRouter.PREFIX.DOWN, this.cursor);
    this.router.createMouseListener(Cursor.EVENT.LEFT_MOUSE_UP, InputRouter.PREFIX.UP, this.cursor);
    this.router.createMouseListener(Cursor.EVENT.RIGHT_MOUSE_CLICK, InputRouter.PREFIX.DOWN, this.cursor);
    this.router.createMouseListener(Cursor.EVENT.RIGHT_MOUSE_UP, InputRouter.PREFIX.UP, this.cursor);
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