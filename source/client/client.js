import { Cursor } from "./cursor.js";
import { Keyboard } from "./keyboard.js";
import { MusicPlayer } from "./musicPlayer.js";
import { Socket } from "./network/socket.js";
import { SoundPlayer } from "./soundPlayer.js";

export const Client = function() {
    this.id = "CLIENT";
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
    this.socket = new Socket();

    this.socket.events.subscribe(Socket.EVENT_CONNECTED_TO_SERVER, this.id, (socketID) => {
        console.log(`${socketID} is connected to the server!`);
    });

    this.socket.events.subscribe(Socket.EVENT_DISCONNECTED_FROM_SERVER, this.id, (reason) => {
        console.log(`${reason} is disconnected from the server!`);
    });
}

Client.prototype.update = function(gameContext) {
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