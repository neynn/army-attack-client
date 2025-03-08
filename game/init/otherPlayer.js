import { Controller } from "../../source/controller/controller.js";

export const OtherPlayer = function() {
    Controller.call(this);
}

OtherPlayer.prototype = Object.create(Controller.prototype);
OtherPlayer.prototype.constructor = OtherPlayer;