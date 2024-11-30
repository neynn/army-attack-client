import { ActionQueue } from "../../../source/action/actionQueue.js";
import { ROOM_EVENTS } from "../../../source/network/events.js";
import { Socket } from "../../../source/network/socket.js";
import { MapParser } from "../../../source/map/mapParser.js";
import { State } from "../../../source/state/state.js";

import { CONTEXT_STATES, GAME_EVENTS } from "../../enums.js";

export const VersusModeState = function() {
    State.call(this);
}

VersusModeState.prototype = Object.create(State.prototype);
VersusModeState.prototype.constructor = VersusModeState;

VersusModeState.prototype.onRoomUpdate = function(gameContext, payload) {}

VersusModeState.prototype.onStartInstance = function(gameContext, payload) {
    this.states.setNextState(CONTEXT_STATES.VERSUS_MODE_PLAY);
}

VersusModeState.prototype.onInstanceController = function(gameContext, payload) {
    gameContext.createController(payload);
}

VersusModeState.prototype.onInstanceMap = function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { id } = payload;

    gameContext
    .parseMap(id, (id, data, meta) => MapParser.parseMap2D(id, data, meta, true))
    .then(success => {
        if(!success) {
            socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": false, "error": "NO_MAP_FILE" });
        } else {
            gameContext.initializeTilemap(id);

            socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
        }
    });
}

VersusModeState.prototype.onInstanceMapFromData = function(gameContext, payload) {
    const { client } = gameContext;
    const { socket } = client;
    const { id, data, meta } = payload;
    const gameMap = MapParser.parseMap2D(id, data, meta, true);

    gameContext.loadMap(id, gameMap);
    gameContext.initializeTilemap(id);

    socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
}

VersusModeState.prototype.onInstanceEntity = function(gameContext, payload) {
    gameContext.createEntity(payload);
}

VersusModeState.prototype.onInstanceEntityBatch = function(gameContext, payload) {
    const { batch } = payload;
            
    for(const setup of batch) {
        gameContext.createEntity(setup);
    }
}

VersusModeState.prototype.onEntityAction = function(gameContext, payload) {
    const { actionQueue } = gameContext;

    actionQueue.queueAction(payload);
}

VersusModeState.prototype.onEntityEvent = function(gameContext, payload) {}

VersusModeState.prototype.onServerMessage = function(gameContext, type, payload) {
    console.log(type, payload, "FROM SERVER");

    switch(type) {
        case ROOM_EVENTS.ROOM_UPDATE: return this.onRoomUpdate(gameContext, payload);
        case ROOM_EVENTS.START_INSTANCE: return this.onStartInstance(gameContext, payload);
        case GAME_EVENTS.INSTANCE_CONTROLLER: return this.onInstanceController(gameContext, payload);
        case GAME_EVENTS.INSTANCE_MAP: return this.onInstanceMap(gameContext, payload);
        case GAME_EVENTS.INSTANCE_MAP_FROM_DATA: return this.onInstanceMapFromData(gameContext, payload);
        case GAME_EVENTS.INSTANCE_ENTITY: return this.onInstanceEntity(gameContext, payload);
        case GAME_EVENTS.INSTANCE_ENTITY_BATCH: return this.onInstanceEntityBatch(gameContext, payload);
        case GAME_EVENTS.ENTITY_ACTION: return this.onEntityAction(gameContext, payload);
        case GAME_EVENTS.WORLD_EVENT: return this.onEntityEvent(gameContext, payload);
        default: return console.log("Unknown message type " + type);
    }
}

VersusModeState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const contextID = gameContext.getID();
    const { actionQueue, client } = gameContext;
    const { socket } = client;
    
    actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_VALID, contextID, (request, messengerID, priority) => {
        if(priority === ActionQueue.PRIORITY_NORMAL) {
            socket.messageRoom(GAME_EVENTS.ENTITY_ACTION, request);
        }
    });

    socket.events.subscribe(Socket.EVENT_MESSAGE_FROM_SERVER, contextID, (type, payload) => this.onServerMessage(gameContext, type, payload));
    client.socket.connect();

    this.states.setNextState(CONTEXT_STATES.VERSUS_MODE_LOBBY);
}