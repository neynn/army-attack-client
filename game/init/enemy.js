import { Actor } from "../../source/turn/actor.js";
import { GAME_EVENT } from "../enums.js";

export const Enemy = function() {
    Actor.call(this);

    this.teamID = null;
}

Enemy.prototype = Object.create(Actor.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.makeChoice = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(GAME_EVENT.CHOICE_MADE, this.id);
}