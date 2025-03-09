import { Controller } from "../../source/controller/controller.js";
import { GAME_EVENT } from "../enums.js";

export const Enemy = function() {
    Controller.call(this);

    this.teamID = null;
}

Enemy.prototype = Object.create(Controller.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.makeChoice = function(gameContext) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(GAME_EVENT.CHOICE_MADE, this.id);
}