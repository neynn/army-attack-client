import { Actor } from "../../source/turn/actor.js";
import { GameEvent } from "../gameEvent.js";

export const EnemyActor = function(id) {
    Actor.call(this, id);

    this.teamID = null;
}

EnemyActor.prototype = Object.create(Actor.prototype);
EnemyActor.prototype.constructor = EnemyActor;

EnemyActor.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(GameEvent.TYPE.ACTION_REQUEST, { "actorID": this.id });
}