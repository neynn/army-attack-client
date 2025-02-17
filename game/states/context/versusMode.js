import { ROOM_EVENTS } from "../../../source/network/events.js";
import { Socket } from "../../../source/network/socket.js";
import { StateMachine } from "../../../source/state/stateMachine.js";
import { CAMERA_TYPES, GAME_EVENTS } from "../../enums.js";
import { VersusModeLobbyState } from "./versus/versusModeLobby.js";
import { VersusModePlayState } from "./versus/versusModePlay.js";
import { instanceMapFromData } from "../../serverEvents/instanceMapFromData.js";
import { instanceMapFromID } from "../../serverEvents/instanceMapFromID.js";
import { instanceEntity } from "../../serverEvents/instanceEntity.js";
import { instanceEntityBatch } from "../../serverEvents/instanceEntityBatch.js";
import { instanceController } from "../../serverEvents/instanceController.js";
import { roomUpdate } from "../../serverEvents/roomUpdate.js";
import { startVersusInstance } from "../../serverEvents/startVersusInstance.js";
import { queueAction } from "../../serverEvents/queueAction.js";
import { queueActionBatch } from "../../serverEvents/queueActionBatch.js";
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
        case ROOM_EVENTS.ROOM_UPDATE: return roomUpdate(gameContext, payload);
        case ROOM_EVENTS.START_INSTANCE: {
            this.setNextState(ArmyContext.STATE.VERSUS_MODE_PLAY);
            return startVersusInstance(gameContext, payload);
        }
        case GAME_EVENTS.INSTANCE_CONTROLLER: return instanceController(gameContext, payload);
        case GAME_EVENTS.INSTANCE_MAP: return instanceMapFromID(gameContext, payload);
        case GAME_EVENTS.INSTANCE_MAP_FROM_DATA: return instanceMapFromData(gameContext, payload);
        case GAME_EVENTS.INSTANCE_ENTITY: return instanceEntity(gameContext, payload);
        case GAME_EVENTS.INSTANCE_ENTITY_BATCH: return instanceEntityBatch(gameContext, payload);
        case GAME_EVENTS.ACTION: return queueAction(gameContext, payload);
        case GAME_EVENTS.ACTION_BATCH: return queueActionBatch(gameContext, payload);
        default: return console.log("Unknown message type " + type);
    }
}

VersusModeState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const contextID = gameContext.getID();
    const { client } = gameContext;
    const { socket } = client;

    gameContext.setGameMode(ArmyContext.GAME_MODE.VERSUS);
    gameContext.createCamera(CAMERA_TYPES.ARMY_CAMERA);
    socket.events.subscribe(Socket.EVENT_MESSAGE_FROM_SERVER, contextID, (type, payload) => this.onServerMessage(gameContext, type, payload));
    socket.connect();

    this.setNextState(ArmyContext.STATE.VERSUS_MODE_LOBBY);
}

VersusModeState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();

    gameContext.setGameMode(ArmyContext.GAME_MODE.NONE);
    gameContext.destroyCamera(CAMERA_TYPES.ARMY_CAMERA);
}