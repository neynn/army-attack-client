import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEvent } from "./armyEvent.js";

export const MissionCompleteEvent = function() {}

MissionCompleteEvent.prototype = Object.create(ArmyEvent.prototype);
MissionCompleteEvent.prototype.constructor = MissionCompleteEvent;

MissionCompleteEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;

    const { id, mission, actorID } = event;
    const rewards = mission.getRewards();

    if(rewards.length !== 0) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, {
            "drops": rewards,
            "receiverID": actorID
        });
    }
}