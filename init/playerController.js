import { Controller } from "../source/controller/controller.js";

export const PlayerController = function(id) {
    Controller.call(this, id);
}

PlayerController.prototype = Object.create(Controller.prototype);
PlayerController.prototype.constructor = PlayerController;