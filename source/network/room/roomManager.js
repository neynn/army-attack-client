import { EventEmitter } from "../../events/eventEmitter.js";
import { IDGenerator } from "../../idGenerator.js";
import { Logger } from "../../logger.js";
import { Member } from "./member.js";

export const RoomManager = function() {
    this.rooms = new Map();
    this.events = new EventEmitter();
    this.idGenerator = new IDGenerator("@ROOM");
    this.roomTypes = {};

    this.events.listen(RoomManager.EVENT_ROOM_OPENED);
    this.events.listen(RoomManager.EVENT_ROOM_CLOSED);
    this.events.listen(RoomManager.EVENT_CLIENT_JOINED);
    this.events.listen(RoomManager.EVENT_CLIENT_LEFT);
    this.events.listen(RoomManager.EVENT_CLIENT_LEADER);
    this.events.listen(RoomManager.EVENT_MESSAGE_RECEIVED);
    this.events.listen(RoomManager.EVENT_MESSAGE_LOST);
    this.events.listen(RoomManager.EVENT_MESSAGE_SEND);
    this.events.listen(RoomManager.EVENT_MESSAGE_BROADCAST);
}

RoomManager.EVENT_ROOM_OPENED = 0;
RoomManager.EVENT_ROOM_CLOSED = 1;
RoomManager.EVENT_CLIENT_JOINED = 2;
RoomManager.EVENT_CLIENT_LEFT = 3;
RoomManager.EVENT_CLIENT_LEADER = 4;
RoomManager.EVENT_MESSAGE_RECEIVED = 5;
RoomManager.EVENT_MESSAGE_LOST = 6;
RoomManager.EVENT_MESSAGE_SEND = 7;
RoomManager.EVENT_MESSAGE_BROADCAST = 8;

RoomManager.prototype.start = function() {
    this.idGenerator.startGenerator();
}

RoomManager.prototype.end = function() {
    this.rooms.clear();
    this.idGenerator.stop();
}

RoomManager.prototype.getRoom = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return null;
    }

    return room;
}

RoomManager.prototype.registerRoomType = function(typeID, object) {
    if(this.roomTypes[typeID] !== undefined) {
        return false;
    }

    this.roomTypes[typeID] = object;

    return true;
}

RoomManager.prototype.processMessage = function(roomID, messengerID, message) {
    if(!message || !message.type || !message.payload) {
        this.events.emit(RoomManager.EVENT_MESSAGE_LOST, roomID, messengerID, message);

        return false;
    }

    const room = this.rooms.get(roomID);

    if(!room) {
        this.events.emit(RoomManager.EVENT_MESSAGE_LOST, roomID, messengerID, message);

        return false;
    }

    room.processMessage(messengerID, message);

    this.events.emit(RoomManager.EVENT_MESSAGE_RECEIVED, roomID, messengerID, message);

    return true;
}

RoomManager.prototype.createRoom = async function(typeID) {
    const RoomType = this.roomTypes[typeID];

    if(!RoomType) {
        return null;
    }

    const roomID = this.idGenerator.getID();
    const room = new RoomType(roomID);

    await room.initialize();
    
    room.onMessageSend = (message, clientID) => this.events.emit(RoomManager.EVENT_MESSAGE_SEND, clientID, message);
    room.onMessageBroadcast = (message) => this.events.emit(RoomManager.EVENT_MESSAGE_BROADCAST, roomID, message);

    this.rooms.set(roomID, room);
    this.events.emit(RoomManager.EVENT_ROOM_OPENED, roomID);
    
    return room;
}

RoomManager.prototype.appointLeader = function(roomID, clientID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.appointLeader", { roomID, clientID });

        return false;
    }

    if(!room.hasMember(clientID)) {
        Logger.log(false, "Client is not in room!", "RoomManager.prototype.appointLeader", { roomID, clientID });

        return false;
    }

    room.setLeader(clientID);

    this.events.emit(RoomManager.EVENT_CLIENT_LEADER, clientID, roomID);

    return true;
}

RoomManager.prototype.canJoin = function(clientID, roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return false;
    }

    return room.canJoin(clientID);
}

RoomManager.prototype.getRoomInformationMessage = function(roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        return {
            "id": roomID,
            "members": [],
            "maxMembers": 0
        };
    }

    const members = [];
    const maxClients = room.getMaxMembers();
    const clients = room.getMembers();

    for(const [clientID, client] of clients) {
        const name = client.getName();

        members.push(name);
    }

    return {
        "id": roomID,
        "members": members,
        "maxMembers": maxClients
    };
}

RoomManager.prototype.addClientToRoom = function(clientID, clientName, roomID) {
    if(!this.canJoin(clientID, roomID)) {
        Logger.log(false,  "Room is not joinable!", "RoomManager.prototype.addClientToRoom", { clientID, roomID });

        return false;
    }

    const room = this.rooms.get(roomID);
    const member = new Member(clientID, clientName);

    room.addMember(clientID, member);

    this.events.emit(RoomManager.EVENT_CLIENT_JOINED, clientID, roomID);

    return true;
}

RoomManager.prototype.removeClientFromRoom = function(clientID, roomID) {
    const room = this.rooms.get(roomID);

    if(!room) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.removeClientFromRoom", { clientID, roomID });

        return false;
    }

    if(!room.hasMember(clientID)) {
        Logger.log(false, "Client is not in room!", "RoomManager.prototype.removeClientFromRoom", { clientID, roomID });

        return false;
    }

    room.removeMember(clientID);

    this.events.emit(RoomManager.EVENT_CLIENT_LEFT, clientID, roomID);

    if(room.isEmpty()) {
        this.destroyRoom(roomID);

        return true;
    }

    if(!room.hasLeader()) {
        const nextLeader = room.getNextMember();
        this.appointLeader(nextLeader, roomID);
    }

    return true;
}

RoomManager.prototype.destroyRoom = function(roomID) {
    if(!this.rooms.has(roomID)) {
        Logger.log(false, "Room does not exist!", "RoomManager.prototype.destroyRoom", { roomID });

        return false;
    }

    this.rooms.delete(roomID);
    
    this.events.emit(RoomManager.EVENT_ROOM_CLOSED, roomID);

    if(this.rooms.size === 0) {
        this.idGenerator.reset();
    }

    return true;
}