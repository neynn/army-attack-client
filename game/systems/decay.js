import { AvianComponent } from "../components/avian.js";
import { ReviveableComponent } from "../components/reviveable.js";
import { MorphSystem } from "./morph.js";

export const DecaySystem = function() {}

DecaySystem.beginDecay = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const reviveableComponent = entity.getComponent(ReviveableComponent);

    if(!reviveableComponent) {
        return;
    }

    const avianComponent = entity.getComponent(AvianComponent);

    if(avianComponent) {
        avianComponent.toGround();
    }

    reviveableComponent.beginDecay();
    MorphSystem.toDown(gameContext, entity);
    soundPlayer.playRandom(entity.config.sounds.death);
}