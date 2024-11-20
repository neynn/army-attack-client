import { CONTEXT_STATES, GAME_EVENTS } from "../../enums.js";
import { ActionQueue } from "../../source/action/actionQueue.js";
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
    const contextID = gameContext.getID();
    const { mapLoader, actionQueue, client } = gameContext;
    const { socket } = client;
    
    actionQueue.events.subscribe(ActionQueue.EVENT_ACTION_VALID, contextID, (request) => {
        socket.messageRoom(GAME_EVENTS.ENTITY_ACTION, request);
    });

    socket.events.subscribe(Socket.EVENT_MESSAGE_FROM_SERVER, contextID, (type, payload) => {
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
                const { id, setup } = payload;

                gameContext.createController(setup, id);
                break;
            }
            case GAME_EVENTS.INSTANCE_MAP: {
                const { id } = payload;

                gameContext.loadMap(id).then(result => {
                    if(!result) {
                        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": false, "error": "NO_MAP_FILE" });
                    } else {
                        gameContext.initializeTilemap(id);
                        socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
                    }
                });
                break;
            }
            case GAME_EVENTS.INSTANCE_MAP_FROM_DATA: {
                const { id, data } = payload;

                mapLoader.createMapFromData(id, data);

                gameContext.loadMap(id).then(result => {
                    gameContext.initializeTilemap(id);
                    socket.messageRoom(GAME_EVENTS.INSTANCE_MAP, { "success": true, "error": null });
                });
                break;
            }
            case GAME_EVENTS.INSTANCE_ENTITY: {
                const { id, master, setup } = payload;

                gameContext.createEntity(setup, master, id);
                break;
            }
            case GAME_EVENTS.INSTANCE_ENTITY_BATCH: {
                const { batch } = payload;
                
                for(const setup of batch) {
                    const { id, master } = setup;

                    gameContext.createEntity(setup, master, id);
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
                //Handles the drop of an item.
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