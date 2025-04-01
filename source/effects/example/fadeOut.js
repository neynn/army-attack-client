import { Graph } from "../../graphics/graph.js";
import { clampValue } from "../../math/math.js";
import { Effect } from "../effect.js";

export const createFadeOutEffect = function(drawable, decrement = 0.1, limit = 0) {
    if(!(drawable instanceof Graph)) {
        return null;
    }

    const effect = new Effect();
    const minimum = clampValue(limit, 1, 0);

    effect.update = (context, deltaTime) => {
        const currentOpactiy = drawable.getOpacity();
        const nextOpacity = currentOpactiy - (decrement * deltaTime);
        const clampedOpactiy = clampValue(nextOpacity, 1, minimum);

        drawable.setOpacity(clampedOpactiy);
    };

    effect.isFinished = () => {
        const currentOpactiy = drawable.getOpacity();

        return currentOpactiy <= minimum;
    }

    return effect;
}