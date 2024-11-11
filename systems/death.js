import { PositionComponent } from "../components/position.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";

export const DeathSystem = function() {}

DeathSystem.playDeathAnimation = function(gameContext, entity) {
    const { spriteManager, client } = gameContext;
    const { soundPlayer } = client;
    const positionComponent = entity.getComponent(PositionComponent);
    const deathAnimation = spriteManager.createSprite(entity.config.sprites.death, SpriteManager.LAYER_MIDDLE);

    deathAnimation.setLooping(false);
    deathAnimation.setPosition(positionComponent.positionX, positionComponent.positionY);

    soundPlayer.playRandom(entity.config.sounds.death);
}