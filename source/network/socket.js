import { EventEmitter } from "../events/eventEmitter.js";
import { NETWORK_EVENTS } from "./events.js";

export const Socket = function() {
    this.config = {};
    this.socket = null;
    this.isConnected = false;
    this.events = new EventEmitter();

    this.events.listen(Socket.EVENT_CONNECTED_TO_SERVER);
    this.events.listen(Socket.EVENT_DISCONNECTED_FROM_SERVER);
    this.events.listen(Socket.EVENT_MESSAGE_FROM_SERVER);
}

Socket.EVENT_CONNECTED_TO_SERVER = 0;
Socket.EVENT_DISCONNECTED_FROM_SERVER = 1;
Socket.EVENT_MESSAGE_FROM_SERVER = 2;

Socket.prototype.load = function(config) {
    if(typeof config === "object") {
        this.config = config;
    } else {
        //TODO
    }
}

Socket.prototype.connect = async function() {
    await import(this.config.version).then(moduleID => {});

    const socket = io(this.config.server, {
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        timeout: this.config.timeout
    });

    socket.on(NETWORK_EVENTS.CONNECT, () => {
        this.isConnected = true;
        this.socket = socket;
        this.events.emit(Socket.EVENT_CONNECTED_TO_SERVER, socket.id);
    });

    socket.on(NETWORK_EVENTS.MESSAGE, (message) => {
        if(typeof message !== "object") {
            return;
        }

        const { type, payload } = message;

        if(!type || !payload) {
            return;
        }
        
        this.events.emit(Socket.EVENT_MESSAGE_FROM_SERVER, type, payload);
    });

    socket.on(NETWORK_EVENTS.DISCONNECT, (reason) => {
        this.isConnected = false;
        this.events.emit(Socket.EVENT_DISCONNECTED_FROM_SERVER, reason);
    });
}

Socket.prototype.messageRoom = function(type, payload) {
    if(!this.socket || !this.isConnected) {
        return false;
    }

    const message = {
        "type": type,
        "payload": payload
    }

    this.socket.emit(NETWORK_EVENTS.MESSAGE_ROOM_REQUEST, message, (response) => {
        console.log(response);
    });
}

Socket.prototype.createRoom = function(roomType) {
    if(!this.socket || !this.isConnected) {
        return false;
    }

    this.socket.emit(NETWORK_EVENTS.CREATE_ROOM_REQUEST, roomType, (response) => {
        console.log(response);
    });
}

Socket.prototype.leaveRoom = function() {
    if(!this.socket || !this.isConnected) {
        return false;
    }

    this.socket.emit(NETWORK_EVENTS.LEAVE_ROOM_REQUEST, (response) => {
        console.log(response);
    });
}

Socket.prototype.joinRoom = function(roomID) {
    if(!this.socket || !this.isConnected) {
        return false;
    }

    
    this.socket.emit(NETWORK_EVENTS.JOIN_ROOM_REQUEST, roomID, (response) => {
        console.log(response);
    });
}