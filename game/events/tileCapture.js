import { ArmyEventHandler } from "../armyEventHandler.js";
import { ConquerSystem } from "../systems/conquer.js";
import { ArmyEvent } from "./armyEvent.js";

export const TileCaptureEvent = function() {}

TileCaptureEvent.prototype = Object.create(ArmyEvent.prototype);
TileCaptureEvent.prototype.constructor = TileCaptureEvent;

TileCaptureEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;

    const { actorID, teamID, tiles, count } = event;
    const actor = turnManager.getActor(actorID);

    ConquerSystem.conquer(gameContext, teamID, tiles);

    if(actor && actor.missions) {
        actor.missions.onObjective(ArmyEventHandler.OBJECTIVE_TYPE.CONQUER, null, count);
    }
}