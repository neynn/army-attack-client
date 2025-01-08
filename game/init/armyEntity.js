import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";

import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { SpriteComponent } from "../components/sprite.js";
import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";
import { CAMERA_TYPES } from "../enums.js";

export const ArmyEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);

    this.events = new EventEmitter();
}

ArmyEntity.EVENT = {
    "HEALTH_UPDATE": 0,
    "DAMAGE_UPDATE": 1
}

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;

ArmyEntity.prototype.createDefaultSprite = function(gameContext, config) {
    const { spriteManager, renderer } = gameContext;
    const { tileX, tileY } = config;

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.createSprite(this.config.sprites["idle"], SpriteManager.LAYER_MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = this.getComponent(PositionComponent);
    const spriteComponent = this.getComponent(SpriteComponent);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getID();

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);

    return sprite;
}

ArmyEntity.prototype.createDefaultEntity = function(config) {
    const { mode, tileX, tileY } = config;

    const positionComponent = PositionComponent.create();
    const spriteComponent = SpriteComponent.create();
    const directionComponent = DirectionComponent.create();
    const teamComponent = TeamComponent.create(config);
    const healthComponent = HealthComponent.create(this.config.stats[mode]);

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    this.addComponent(positionComponent);
    this.addComponent(spriteComponent);
    this.addComponent(directionComponent);
    this.addComponent(healthComponent);
    this.addComponent(teamComponent);
}

ArmyEntity.prototype.loadDefaultTraits = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { mode, components } = config;
    const { traits } = this.config.stats[mode];

    entityManager.loadTraits(this, traits);
    entityManager.loadComponents(this, components);
}

ArmyEntity.prototype.onCreate = function(gameContext, config) {
    console.warn("OnCreate has not been defined!");
}

ArmyEntity.prototype.update = function(gameContext) {
    
}
