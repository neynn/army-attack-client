import { DefaultTypes } from "../../../defaultTypes.js";
import { PlaceSystem } from "../../../systems/place.js";
import { SpawnSystem } from "../../../systems/spawn.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const PlayerPlaceState = function() {
    this.buildSpriteIndex = -1;
    this.entityType = null;
    this.buyType = null;
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

    this.buildSpriteIndex = -1;
    this.entityType = null;
    this.buyType = null;
}

PlayerPlaceState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const { entityType, buyType } = transition;
    const { tileManager } = gameContext;
    const player = stateMachine.getContext();
    const tileID = tileManager.getTileIDByArray(player.config.overlays.enable);

    player.rangeVisualizer.disable(gameContext);
    player.camera.place.fill(tileID);

    this.entityType = entityType;
    this.buyType = buyType;
    this.setupBuildSprite(gameContext, player);
    this.highlightPlaceableTiles(gameContext, player);
}

PlayerPlaceState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.hover.alignSpriteTile(gameContext);
}

PlayerPlaceState.prototype.onClick = function(gameContext, stateMachine) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    const player = stateMachine.getContext();
    const { hover, teamID } = player;
    const { tileX, tileY } = hover;

    const isPlaceable = PlaceSystem.isEntityPlaceable(gameContext, tileX, tileY, this.entityType.dimX, this.entityType.dimY, teamID);

    if(!isPlaceable) {
        soundPlayer.play(player.config.sounds.error);
        return;
    }

    const spawnConfig = DefaultTypes.createSpawnConfig(this.entityType.id, teamID, player.getID(), tileX, tileY);
    const entity = SpawnSystem.createEntity(gameContext, spawnConfig);

    if(entity) {
        soundPlayer.play(player.config.sounds.place);
        player.inventory.removeBuyType(this.buyType);
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
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
    const { tileManager } = gameContext;
    const tileID = tileManager.getTileIDByArray(player.config.overlays.disabled);
    const blockedIndices = PlaceSystem.getBlockedPlaceIndices(gameContext, player.teamID);
    const layer = player.camera.place;

    for(const [index, state] of blockedIndices) {
        switch(state) {
            case PlaceSystem.BLOCK_STATE.ENTITY_ATTACK: {
                layer.setItem(tileID, index);
                break;
            }
            default: {
                layer.clearItem(index);
                break;
            }
        }
    }
} 