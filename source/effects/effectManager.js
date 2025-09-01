export const EffectManager = function() {
    this.effects = [];
}

EffectManager.prototype.update = function(display, deltaTime) {
    const finishedEffects = [];

    for(let i = 0; i < this.effects.length; i++) {
        const effect = this.effects[i];

        effect.update(display, deltaTime);

        if(effect.isFinished()) {
            finishedEffects.push(i);
        }
    }

    for(let i = finishedEffects.length - 1; i >= 0; i--) {
        this.effects[i] = this.effects[this.effects.length - 1];
        this.effects.pop();
    }
}

EffectManager.prototype.addEffect = function(effect) {
    this.effects.push(effect);
}