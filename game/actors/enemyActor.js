import { Actor } from "../../source/turn/actor.js";
import { GameEvent } from "../gameEvent.js";

export const EnemyActor = function() {
    Actor.call(this);

    this.teamID = null;
}

EnemyActor.prototype = Object.create(Actor.prototype);
EnemyActor.prototype.constructor = EnemyActor;

EnemyActor.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(GameEvent.TYPE.STORY_AI_CHOICE_MADE, { "actorID": this.id });
}