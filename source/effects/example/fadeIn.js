import { Graph } from "../../graphics/graph.js";
import { clampValue } from "../../math/math.js";
import { Effect } from "../effect.js";

export const createFadeInEffect = function(drawable, increment = 0.1, limit = 1) {
    if(!(drawable instanceof Graph)) {
        return null;
    }

    const effect = new Effect();
    const maximum = clampValue(limit, 1, 0);

    effect.update = (context, deltaTime) => {
        const currentOpactiy = drawable.getOpacity();
        const nextOpacity = currentOpactiy + (increment * deltaTime);
        const clampedOpactiy = clampValue(nextOpacity, maximum, 0);

        drawable.setOpacity(clampedOpactiy);
    };

    effect.isFinished = () => {
        const currentOpactiy = drawable.getOpacity();

        return currentOpactiy >= maximum;
    }

    return effect;
}