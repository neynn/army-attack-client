import { CONTEXT_STATES, GAME_EVENTS } from "../../enums.js";
import { ROOM_EVENTS } from "../../source/client/network/events.js";
import { Socket } from "../../source/client/network/socket.js";
import { State } from "../../source/state/state.js";

export const VersusModeLobbyState = function() {
    State.call(this);
}

VersusModeLobbyState.prototype = Object.create(State.prototype);
VersusModeLobbyState.prototype.constructor = VersusModeLobbyState;

VersusModeLobbyState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, spriteManager, controller, entityManager, mapLoader, actionQueue, client } = gameContext;
    const { socket } = client;
    
    socket.events.subscribe(Socket.EVENT_MESSAGE_FROM_SERVER, gameContext.id, (message) => {
        console.log(message);

        if(!message) {
            return;
        }

        const { type, payload } = message;

        if(!type || !payload) {
            return;
        }

        switch(type) {
            case ROOM_EVENTS.ROOM_UPDATE: {
                break;
            }
            case ROOM_EVENTS.START_INSTANCE: {
                stateMachine.setNextState(CONTEXT_STATES.VERSUS_MODE);
                break;
            }
            case GAME_EVENTS.INSTANCE_CONTROLLER: {
                gameContext.initializeController(payload);
                break;
            }
            case GAME_EVENTS.INSTANCE_MAP: {
                const { id, data } = payload;
                mapLoader.createMapFromData(id, data);
                gameContext.initMap(id);
                gameContext.initializeTilemap(id);
                break;
            }
            case GAME_EVENTS.INSTANCE_ENTITY: {
                const { id, setup } = payload;
                gameContext.initializeEntity(setup, id);
                break;
            }
            case GAME_EVENTS.ENTITY_ACTION: {
                actionQueue.queueAction(payload);
                break;
            }
            default: {
                console.log("Unknown message type " + type);
            }
        }
    });

    client.socket.connect();

    uiManager.parseUI("VERSUS_MODE_HUB", gameContext);

    uiManager.addClick("VERSUS_MODE_HUB", "BUTTON_CREATE_ROOM", () => {
        client.socket.createRoom();
    });

    uiManager.addClick("VERSUS_MODE_HUB", "BUTTON_JOIN_ROOM", () => {
        const roomID = prompt("ROOM-ID?");
        client.socket.joinRoom(roomID);
    });

    uiManager.addClick("VERSUS_MODE_HUB", "BUTTON_LEAVE_ROOM", () => {
        client.socket.leaveRoom();
    });

    uiManager.addClick("VERSUS_MODE_HUB", "BUTTON_START_INSTANCE", () => {
        client.socket.messageRoom(ROOM_EVENTS.START_INSTANCE, {
            "mapID": "pvp_valleys"
        });
    });
}

VersusModeLobbyState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("VERSUS_MODE_HUB", gameContext);
}