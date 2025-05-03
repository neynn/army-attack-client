import { Effect } from "./effect.js";

export const EffectManager = function() {
    this.activeEffects = new Map();
}

EffectManager.prototype.update = function(display, deltaTime) {
    const deleteable = [];

    this.activeEffects.forEach(effect => {
        effect.update(display, deltaTime);

        const effectID = effect.getID();
        const isFinished = effect.isFinished();

        if(isFinished) {
            deleteable.push(effectID);
        }
    });

    for(const effectID of deleteable) {
        this.removeEffect(effectID);
    }
}

EffectManager.prototype.addEffect = function(effect) {
    if(!(effect instanceof Effect)) {
        return;
    }
    
    const effectID = effect.getID();

    this.activeEffects.set(effectID, effect);
}

EffectManager.prototype.removeEffect = function(effectID) {
    if(this.activeEffects.has(effectID)) {
        this.activeEffects.delete(effectID);
    }
}