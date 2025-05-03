import { Actor } from "../../source/turn/actor.js";
import { GAME_EVENT } from "../enums.js";

export const EnemyActor = function() {
    Actor.call(this);

    this.teamID = null;
}

EnemyActor.prototype = Object.create(Actor.prototype);
EnemyActor.prototype.constructor = EnemyActor;

EnemyActor.prototype.onMakeChoice = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(GAME_EVENT.MAKE_CHOICE, { "actorID": this.id });
}