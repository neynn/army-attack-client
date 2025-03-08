import { Controller } from "../../source/controller/controller.js";

export const Enemy = function() {
    Controller.call(this);

    this.teamID = null;
}

Enemy.prototype = Object.create(Controller.prototype);
Enemy.prototype.constructor = Enemy;