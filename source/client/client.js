import { Cursor } from "./cursor.js";
import { Keyboard } from "./keyboard.js";
import { MusicPlayer } from "./musicPlayer.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./soundPlayer.js";

export const Client = function() {
    this.id = null;
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
    this.socket = new Socket();
}

Client.prototype.update = function() {
    this.keyboard.update();
    this.cursor.update();
}

Client.prototype.setID = function(id) {
    if(!id) {
        return;
    }

    this.id = id;
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