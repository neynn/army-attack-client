import { Drawable } from "../graphics/drawable.js";
import { IDGenerator } from "../idGenerator.js";
import { clampValue } from "../math/math.js";

export const EffectManager = function() {
    this.idGenerator = new IDGenerator("@EFFECT");
    this.activeEffects = new Map();
    this.effectsToDelete = [];
    this.effectTypes = {
        [EffectManager.EFFECT_TYPE_FADE_IN]: "addFadeIn",
        [EffectManager.EFFECT_TYPE_FADE_OUT]: "addFadeOut"
    };
}

EffectManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
EffectManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

EffectManager.prototype.addEffect = function(drawable, effectList) {
    if(!Array.isArray(effectList)) {
        return;
    }

    if(!(drawable instanceof Drawable)) {
        return;
    }

    for(const effect of effectList) {
        const { type, value, threshold } = effect;
        const effectID = this.effectTypes[type];

        if(!effectID) {
            continue;
        }

        this[effectID](drawable, value, threshold);
    }
}

EffectManager.prototype.addFadeIn = function(drawable, increment = 0.1, threshold = 1) {
    if(threshold > 1) {
        threshold = 1;
    }

    const drawableID = drawable.getID();
    const effectID = this.idGenerator.getID();

    const effect = (drawable, deltaTime) => {
        const opacity = drawable.opacity + (increment * deltaTime);
        const clampedOpactiy = clampValue(opacity, threshold, 0);

        drawable.setOpacity(clampedOpactiy);

        if(clampedOpactiy === threshold) {
            this.markEffectForDeletion(effectID);
        }
    }

    this.activeEffects.set(effectID, {
        "drawableID": drawableID,
        "onCall": effect
    });
}

EffectManager.prototype.addFadeOut = function(drawable, decrement = 0.1, threshold = 0) {
    if(threshold < 0) {
        threshold = 0;
    }

    const drawableID = drawable.getID();
    const effectID = this.idGenerator.getID();

    const effect = (drawable, deltaTime) => {
        const opacity = drawable.opacity - (decrement * deltaTime);
        const clampedOpactiy = clampValue(opacity, 1, threshold);

        drawable.setOpacity(clampedOpactiy);

        if(clampedOpactiy === threshold) {
            this.markEffectForDeletion(effectID);
        }
    }

    this.activeEffects.set(effectID, {
        "drawableID": drawableID,
        "effectID": effectID,
        "effect": effect
    });
}

EffectManager.prototype.deleteCompletedEffects = function() {
    for(const effectID of this.effectsToDelete) {
        this.activeEffects.delete(effectID);
    }

    this.effectsToDelete = [];
}

EffectManager.prototype.markEffectForDeletion = function(effectID) {
    if(this.activeEffects.has(effectID)) {
        this.effectsToDelete.push(effectID);
    }
}

EffectManager.prototype.getActiveEffects = function() {
    return this.activeEffects;
}