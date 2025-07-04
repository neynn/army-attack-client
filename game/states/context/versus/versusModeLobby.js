import { ROOM_EVENTS } from "../../../../source/network/events.js";
import { State } from "../../../../source/state/state.js";
import { ArmyContext } from "../../../armyContext.js";

export const VersusModeLobbyState = function() {}

VersusModeLobbyState.prototype = Object.create(State.prototype);
VersusModeLobbyState.prototype.constructor = VersusModeLobbyState;

VersusModeLobbyState.prototype.onEnter = function(gameContext, stateMachine) {
    const { uiManager, client } = gameContext;
    const versusInterface = uiManager.createUIByID("VERSUS_MODE_HUB", gameContext);

    versusInterface.addClick("BUTTON_CREATE_ROOM", () => {
        client.socket.createRoom("VERSUS"); //TODO
    });

    versusInterface.addClick("BUTTON_JOIN_ROOM", () => {
        const roomID = prompt("ROOM-ID?");
        client.socket.joinRoom(roomID);
    });

    versusInterface.addClick("BUTTON_LEAVE_ROOM", () => {
        client.socket.leaveRoom();
    });

    versusInterface.addClick("BUTTON_START_INSTANCE", () => {
        client.socket.messageRoom(ROOM_EVENTS.START_INSTANCE, {
            "mapID": "pvp_valleys"
        });
    });

    versusInterface.addClick("BUTTON_BACK", () => {
        gameContext.states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU);
    });
}

VersusModeLobbyState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyUI("VERSUS_MODE_HUB");
}