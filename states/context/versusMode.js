import { CONTEXT_STATES, GAME_EVENTS } from "../../enums.js";
import { ROOM_EVENTS } from "../../source/client/network/events.js";
import { Socket } from "../../source/client/network/socket.js";
import { State } from "../../source/state/state.js";

export const VersusModeState = function() {
    State.call(this);
}

VersusModeState.prototype = Object.create(State.prototype);
VersusModeState.prototype.constructor = VersusModeState;

VersusModeState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { mapLoader, actionQueue, client } = gameContext;
    const { socket } = client;
    
    socket.events.subscribe(Socket.EVENT_MESSAGE_FROM_SERVER, gameContext.id, (type, payload) => {
        console.log(type, payload, "FROM SERVER");

        switch(type) {
            case ROOM_EVENTS.ROOM_UPDATE: {
                break;
            }
            case ROOM_EVENTS.START_INSTANCE: {
                this.states.setNextState(CONTEXT_STATES.VERSUS_MODE_PLAY);
                break;
            }
            case GAME_EVENTS.INSTANCE_CONTROLLER: {
                gameContext.initializeController(payload);
                break;
            }
            case GAME_EVENTS.INSTANCE_MAP: {
                const { id } = payload;

                mapLoader.loadMap(id).then(map2D => {
                    if(!map2D) {
                        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": false, "error": "NO_MAP_FILE" });
                    } else {
                        gameContext.initializeMap(id);
                        gameContext.initializeTilemap(id);
                        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
                    }
                })
                break;
            }
            case GAME_EVENTS.INSTANCE_MAP_FROM_DATA: {
                const { id, data } = payload;

                mapLoader.createMapFromData(id, data);
                gameContext.initializeMap(id);
                gameContext.initializeTilemap(id);

                socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
                break;
            }
            case GAME_EVENTS.INSTANCE_ENTITY: {
                const { id, setup } = payload;
                gameContext.initializeEntity(setup, id);
                break;
            }
            case GAME_EVENTS.INSTANCE_ENTITY_BATCH: {
                const { batch } = payload;
                
                for(const setup of batch) {
                    gameContext.initializeEntity(setup, setup.id);
                }
                break;
            }
            case GAME_EVENTS.ENTITY_ACTION: {
                //payload = request!
                actionQueue.queueAction(payload);
                break;
            }
            case GAME_EVENTS.ENTITY_DEATH: {
                //Handles the death of an entity
                break;
            }
            case GAME_EVENTS.DROP_ITEM: {
                //handles the drop of an item.
                break;
            }
            default: {
                console.log("Unknown message type " + type);
            }
        }
    });

    client.socket.connect();

    this.states.setNextState(CONTEXT_STATES.VERSUS_MODE_LOBBY);
}

VersusModeState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, client } = gameContext;
    const { musicPlayer } = client;
}