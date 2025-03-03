import { ROOM_EVENTS } from "../../../source/network/events.js";
import { Socket } from "../../../source/network/socket.js";
import { StateMachine } from "../../../source/state/stateMachine.js";
import { CLIENT_EVENTS } from "../../enums.js";
import { VersusModeLobbyState } from "./versus/versusModeLobby.js";
import { VersusModePlayState } from "./versus/versusModePlay.js";
import { ServerEvents } from "../../serverEvents.js";
import { ArmyContext } from "../../armyContext.js";

export const VersusModeState = function() {
    StateMachine.call(this);

    this.addState(ArmyContext.STATE.VERSUS_MODE_LOBBY, new VersusModeLobbyState());
    this.addState(ArmyContext.STATE.VERSUS_MODE_PLAY, new VersusModePlayState());
}

VersusModeState.prototype = Object.create(StateMachine.prototype);
VersusModeState.prototype.constructor = VersusModeState;

VersusModeState.prototype.onServerMessage = function(gameContext, type, payload) {
    console.log(type, payload, "FROM SERVER");

    switch(type) {
        case ROOM_EVENTS.ROOM_UPDATE: {
            ServerEvents.roomUpdate(gameContext, payload);
            break;
        }
        case ROOM_EVENTS.START_INSTANCE: {
            this.setNextState(ArmyContext.STATE.VERSUS_MODE_PLAY);

            ServerEvents.startVersusInstance(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.INSTANCE_CONTROLLER: {
            ServerEvents.instanceController(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.INSTANCE_MAP: {
            ServerEvents.instanceMapFromID(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.INSTANCE_MAP_FROM_DATA: {
            ServerEvents.instanceMapFromData(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.INSTANCE_ENTITY_BATCH: {
            ServerEvents.instanceEntityBatch(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.ACTION: {
            ServerEvents.queueAction(gameContext, payload);
            break;
        }
        case CLIENT_EVENTS.EVENT: {
            ServerEvents.gameEvent(gameContext, payload);
            break;
        }
        default: {
            console.log("Unknown message type " + type);
            break;
        }
    }
}

VersusModeState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const contextID = gameContext.getID();
    const { client } = gameContext;
    const { socket } = client;

    gameContext.setGameMode(ArmyContext.GAME_MODE.VERSUS);
    socket.events.subscribe(Socket.EVENT.MESSAGE_FROM_SERVER, contextID, (type, payload) => this.onServerMessage(gameContext, type, payload));
    socket.connect();

    this.setNextState(ArmyContext.STATE.VERSUS_MODE_LOBBY);
}

VersusModeState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();

    gameContext.setGameMode(ArmyContext.GAME_MODE.NONE);
}