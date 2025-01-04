import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { Archetype } from "../../../source/entity/archetype.js";

import { HealthComponent } from "../../components/health.js";
import { TeamComponent } from "../../components/team.js";
import { CAMERA_TYPES } from "../../enums.js";
import { SpriteComponent } from "../../components/sprite.js";
import { DirectionComponent } from "../../components/direction.js";
import { PositionComponent } from "../../components/position.js";
import { EventEmitter } from "../../../source/events/eventEmitter.js";

export const DefaultArchetype = function() {}

DefaultArchetype.prototype = Object.create(Archetype.prototype);
DefaultArchetype.prototype.constructor = DefaultArchetype;

DefaultArchetype.prototype.onInitialize = function(entity, type, setup) {}

DefaultArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {}

DefaultArchetype.prototype.initializeEntity = function(entity, type, setup) {
    const { stats } = type;
    const { mode } = setup;

    const positionComponent = PositionComponent.create();
    const spriteComponent = SpriteComponent.create();
    const directionComponent = DirectionComponent.create();
    const teamComponent = TeamComponent.create(setup);
    const healthComponent = HealthComponent.create(stats[mode]);

    entity.addComponent(positionComponent);
    entity.addComponent(spriteComponent);
    entity.addComponent(directionComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(teamComponent);

    this.onInitialize(entity, type, setup);
}

DefaultArchetype.prototype.finalizeEntity = function(gameContext, entity, type, setup) {
    const { spriteManager, renderer } = gameContext;
    const { sprites } = type;
    const { tileX, tileY } = setup;

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.createSprite(sprites["idle"], SpriteManager.LAYER_MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;
    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getID();

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);

    this.onFinalize(gameContext, entity, sprite, type, setup);
}

DefaultArchetype.prototype.build = function(gameContext, entity, type, setup) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { stats } = type;
    const { mode, components } = setup;
    const { traits } = stats[mode];

    entity.events = new EventEmitter();
    
    this.initializeEntity(entity, type, setup);
    entityManager.loadTraits(entity, traits);
    entityManager.loadCustomComponents(entity, components);
    this.finalizeEntity(gameContext, entity, type, setup);
}
