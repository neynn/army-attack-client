import { AvianComponent } from "../components/avian.js";
import { DecayComponent } from "../components/decay.js";
import { MorphSystem } from "./morph.js";

export const DecaySystem = function() {}

DecaySystem.isReviveable = function(entity) {
    const decayComponent = entity.getComponent(DecayComponent);

    if(!decayComponent) {
        return false;
    }
    
    return decayComponent.isReviveable;
}

DecaySystem.update = function(gameContext, entity) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();
    const decayComponent = entity.getComponent(DecayComponent);

    if(decayComponent && decayComponent.decayState === DecayComponent.DECAY_STATE_DECAY) {
        decayComponent.decayProgress += fixedDeltaTime;

        //TODO
    }
}

DecaySystem.beginDecay = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const decayComponent = entity.getComponent(DecayComponent);

    if(!decayComponent) {
        return;
    }

    if(entity.hasComponent(AvianComponent)) {
        const avianComponent = entity.getComponent(AvianComponent);
        avianComponent.state = AvianComponent.STATE_GROUNDED;
    }

    if(!decayComponent.isElite) {
        decayComponent.decayState = DecayComponent.DECAY_STATE_DECAY;
    }

    MorphSystem.toDown(gameContext, entity);
    soundPlayer.playRandom(entity.config.sounds.death);
}