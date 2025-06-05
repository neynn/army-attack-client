import { ArmyMap } from "../../../init/armyMap.js";
import { AllianceSystem } from "../../../systems/alliance.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const PlayerPlaceState = function() {
    this.entityType = null;
    this.buildSpriteIndex = -1;
}

PlayerPlaceState.prototype = Object.create(PlayerState.prototype);
PlayerPlaceState.prototype.constructor = PlayerPlaceState;

PlayerPlaceState.prototype.onExit = function(gameContext, stateMachine) {
    const { spriteManager } = gameContext;

    const player = stateMachine.getContext();
    const { hover, camera } = player;

    spriteManager.destroySprite(this.buildSpriteIndex);
    hover.hideSprite(gameContext);
    camera.clearPlace();

    this.entityType = null;
    this.buildSpriteIndex = -1;
}

PlayerPlaceState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const { typeID } = transition;
    const { world, tileManager } = gameContext;
    const { entityManager } = world;
    const entityType = entityManager.getEntityType(typeID);
    const player = stateMachine.getContext();
    const tileID = tileManager.getTileIDByArray(player.config.overlays.enable);

    player.rangeVisualizer.disable(gameContext);
    player.camera.place.fill(tileID);

    this.entityType = entityType;
    this.setupBuildSprite(gameContext, player);
    this.highlightPlaceableTiles(gameContext, player);
}

PlayerPlaceState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.hover.alignSpriteTile(gameContext);
}

PlayerPlaceState.prototype.setupBuildSprite = function(gameContext, player) {
    const { spriteManager } = gameContext;
    const { hover } = player;
    const buildID = this.entityType.sprites.idle;

    hover.updateSprite(gameContext, buildID);

    const spriteID = player.getSpriteType(Player.SPRITE_TYPE.PLACE, `${this.entityType.dimX}-${this.entityType.dimY}`);
    const buildSprite = spriteManager.createSprite(spriteID);

    if(buildSprite) {
        const playerSprite = spriteManager.getSprite(hover.spriteIndex);

        playerSprite.addChild(buildSprite);

        this.buildSpriteIndex = buildSprite.getIndex();
    }
}

PlayerPlaceState.prototype.highlightPlaceableTiles = function(gameContext, player) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const blockedIndices = worldMap.getBlockedPlaceIndices(gameContext, player.teamID);

    for(const index of blockedIndices) {
        player.camera.place.clearItem(index);
    }
} 