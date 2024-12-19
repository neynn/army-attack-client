import { NETWORK_EVENTS, ROOM_EVENTS } from "../events.js";
import { RoomManager } from "../room/roomManager.js";
import { ClientManager } from "../client/clientManager.js";
import { EventEmitter } from "../../events/eventEmitter.js";
import { Logger } from "../../logger.js";

export const ServerContext = function(io) {
    this.io = io;
    this.events = new EventEmitter();
    this.clientManager = new ClientManager();
    this.roomManager = new RoomManager();

    this.events.listen(ServerContext.EVENT_CONNECT);
    this.events.listen(ServerContext.EVENT_DISCONNECT);

    this.initializeEvents();
    this.io.on('connection', (socket) => this.handleConnect(socket));
}

ServerContext.EVENT_CONNECT = 0;
ServerContext.EVENT_DISCONNECT = 1;

ServerContext.prototype.initializeEvents = function() {
    this.events.subscribe(ServerContext.EVENT_CONNECT, EventEmitter.SUPER_SUBSCRIBER_ID, (socket) => console.log(`${socket.id} has connected to the server!`));
    this.events.subscribe(ServerContext.EVENT_DISCONNECT, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID) => console.log(`${clientID} has disconnected from the server!`));
    this.roomManager.events.subscribe(RoomManager.EVENT_ROOM_OPENED, EventEmitter.SUPER_SUBSCRIBER_ID, (roomID) => console.log(`Room ${roomID} has been opened!`));
    this.roomManager.events.subscribe(RoomManager.EVENT_ROOM_CLOSED, EventEmitter.SUPER_SUBSCRIBER_ID, (roomID) => console.log(`Room ${roomID} has been closed!`));
    this.roomManager.events.subscribe(RoomManager.EVENT_CLIENT_JOINED, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID));
    this.roomManager.events.subscribe(RoomManager.EVENT_CLIENT_LEFT, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID));
    this.roomManager.events.subscribe(RoomManager.EVENT_CLIENT_LEADER, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID, roomID) => this.sendRoomUpdate(clientID, roomID));
    this.roomManager.events.subscribe(RoomManager.EVENT_MESSAGE_RECEIVED, EventEmitter.SUPER_SUBSCRIBER_ID, (roomID, messengerID, message) => console.log(`Message received! ${roomID, messengerID}`));
    this.roomManager.events.subscribe(RoomManager.EVENT_MESSAGE_LOST, EventEmitter.SUPER_SUBSCRIBER_ID, (roomID, messengerID, message) => `Message lost! ${roomID, messengerID}`);
    this.roomManager.events.subscribe(RoomManager.EVENT_MESSAGE_SEND, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID, message) => this.io.to(clientID).emit(NETWORK_EVENTS.MESSAGE, message));
    this.roomManager.events.subscribe(RoomManager.EVENT_MESSAGE_BROADCAST, EventEmitter.SUPER_SUBSCRIBER_ID, (roomID, message) => this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message));
    this.clientManager.events.subscribe(ClientManager.EVENT_CLIENT_CREATE, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID) => console.log(`${clientID} has been created!`));
    this.clientManager.events.subscribe(ClientManager.EVENT_CLIENT_DELETE, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID) => console.log(`${clientID} has been removed!`));
    this.clientManager.events.subscribe(ClientManager.EVENT_USERID_ADDED, EventEmitter.SUPER_SUBSCRIBER_ID, (clientID, userID) => console.log(`${clientID} is now named ${userID}!`));
}

ServerContext.prototype.sendRoomUpdate = function(clientID, roomID) {
    const information = this.roomManager.getRoomInformationMessage(roomID);
    const message = { "type": ROOM_EVENTS.ROOM_UPDATE, "payload": information };

    this.io.in(roomID).emit(NETWORK_EVENTS.MESSAGE, message);

    console.log(`${clientID} left room ${roomID}`);
}

ServerContext.prototype.handleConnect = function(socket) {
    this.registerNetworkEvents(socket);
    this.clientManager.createClient(socket);
    this.events.emit(ServerContext.EVENT_CONNECT, socket);
}

ServerContext.prototype.handleDisconnect = function(clientID) {
    this.handleRoomLeave(clientID);
    this.clientManager.destroyClient(clientID);
    this.events.emit(ServerContext.EVENT_DISCONNECT, clientID);
}

ServerContext.prototype.handleRoomLeave = function(clientID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.LEAVE_ROOM_REQUEST", { clientID });

        return false;
    }

    const roomID = client.getRoomID();

    if(roomID === null) {
        Logger.log(false, "Client is not in a room!", "NETWORK_EVENTS.LEAVE_ROOM_REQUEST", { clientID, roomID });

        return false;
    }

    client.leaveRoom();

    this.roomManager.removeClientFromRoom(clientID, roomID);

    return true;
}

ServerContext.prototype.handleRegister = function(clientID, data) {
    this.clientManager.addUserID(clientID, data["user-id"]);

    return true;
}

ServerContext.prototype.handleRoomCreate = async function(clientID, roomType) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", null, { clientID });

        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== null) {
        Logger.log(false, "Client is already in room!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", { clientID, clientRoomID });

        return false;
    }

    const room = await this.roomManager.createRoom(roomType);

    if(!room) {
        Logger.log(false, "Room was not created!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", { roomType });

        return false;
    }

    const roomID = room.getID();
    const isJoinable = this.roomManager.canJoin(clientID, roomID);

    if(!isJoinable) {
        Logger.log(false, "Room is not joinable!", "NETWORK_EVENTS.CREATE_ROOM_REQUEST", null);

        return false;
    }

    const userID = client.getUserID();

    client.joinRoom(roomID);

    this.roomManager.addClientToRoom(clientID, userID, roomID);
    this.roomManager.appointLeader(roomID, clientID);

    return true;
}

ServerContext.prototype.handleRoomJoin = function(clientID, roomID) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID });

        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID !== null) {
        Logger.log(false, "Client is already in room!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID, clientRoomID});

        return false;
    }

    const isJoinable = this.roomManager.canJoin(clientID, roomID);

    if(!isJoinable) {
        Logger.log(false, "Room is not joinable!", "NETWORK_EVENTS.JOIN_ROOM_REQUEST", { clientID, roomID });

        return false;
    }

    const userID = client.getUserID();

    client.joinRoom(roomID);

    this.roomManager.addClientToRoom(clientID, userID, roomID);

    return true;
}

ServerContext.prototype.handleRoomMessage = function(clientID, message) {
    const client = this.clientManager.getClient(clientID);

    if(!client) {
        Logger.log(false, "Client does not exist!", "NETWORK_EVENTS.MESSAGE_ROOM_REQUEST", { clientID });

        return false;
    }

    const clientRoomID = client.getRoomID();

    if(clientRoomID === null) {
        Logger.log(false, "Client is not in a room!", "NETWORK_EVENTS.MESSAGE_ROOM_REQUEST", { clientID });

        return false;
    }
    
    this.roomManager.processMessage(clientRoomID, clientID, message);

    return true;
}

ServerContext.prototype.registerNetworkEvents = function(socket) {
    socket.on(NETWORK_EVENTS.DISCONNECT, () => this.handleDisconnect(socket.id));
	socket.on(NETWORK_EVENTS.REGISTER, (data, request) => request(this.handleRegister(socket.id, data)));
    socket.on(NETWORK_EVENTS.CREATE_ROOM_REQUEST, (roomType, request) => request(this.handleRoomCreate(socket.id, roomType)));
    socket.on(NETWORK_EVENTS.JOIN_ROOM_REQUEST, (roomID, request) => request(this.handleRoomJoin(socket.id, roomID)));
    socket.on(NETWORK_EVENTS.LEAVE_ROOM_REQUEST, (request) => request(this.handleRoomLeave(socket.id)));
    socket.on(NETWORK_EVENTS.MESSAGE_ROOM_REQUEST, (message, request) => request(this.handleRoomMessage(socket.id, message)));
}

ServerContext.prototype.start = function() {
    this.roomManager.start();
    this.clientManager.start();
}