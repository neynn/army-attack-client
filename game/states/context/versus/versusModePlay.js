import { State } from "../../../../source/state/state.js";

export const VersusModePlayState = function() {
    State.call(this);
}

VersusModePlayState.prototype = Object.create(State.prototype);
VersusModePlayState.prototype.constructor = VersusModePlayState;