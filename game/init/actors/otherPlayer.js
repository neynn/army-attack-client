import { Actor } from "../../../source/turn/actor.js";

export const OtherPlayer = function() {
    Actor.call(this);
}

OtherPlayer.prototype = Object.create(Actor.prototype);
OtherPlayer.prototype.constructor = OtherPlayer;