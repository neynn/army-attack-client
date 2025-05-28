import { PlayerState } from "./playerState.js";

export const PlayerBuildState = function() {}

PlayerBuildState.prototype = Object.create(PlayerState.prototype);
PlayerBuildState.prototype.constructor = PlayerBuildState;