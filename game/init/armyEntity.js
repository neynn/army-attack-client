import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";

import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { SpriteComponent } from "../components/sprite.js";
import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";
import { CAMERA_TYPES } from "../enums.js";
import { ReviveableComponent } from "../components/reviveable.js";
import { AttackComponent } from "../components/attack.js";
import { MoveComponent } from "../components/move.js";
import { ConstructionComponent } from "../components/construction.js";
import { ProductionComponent } from "../components/production.js";
import { EntityFactory } from "../../source/entity/entityFactory.js";

export const ArmyEntity = function(config, DEBUG_NAME) {
    Entity.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.setConfig(config);
}

ArmyEntity.ARCHETYPE = {
    "UNIT": "Unit",
    "DEFENSE": "Defense",
    "CONSTRUCTION": "Construction",
    "BUILDING": "Building"
};

ArmyEntity.EVENT = {
    "HEALTH_UPDATE": 0,
    "DAMAGE_UPDATE": 1
};

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;

ArmyEntity.prototype.update = function(gameContext) {
    if(this.hasComponent(ReviveableComponent)) {
        const reviveable = this.getComponent(ReviveableComponent);

        reviveable.update(gameContext);

        if(reviveable.isDead()) {
            //REMOVE from game.
        }
    }

    if(this.hasComponent(ProductionComponent)) {
        const production = this.getComponent(ProductionComponent);

        production.update(gameContext, this.config.collectableTimeSeconds);

        if(production.isFinished()) {
            console.error("TODO FINISH PRODUCTION");
        }
    }
}

export const ArmyEntityFactory = function() {
    EntityFactory.call(this, "ARMY_ENTITY_FACTORY");
}

ArmyEntityFactory.prototype = Object.create(EntityFactory.prototype);
ArmyEntityFactory.prototype.constructor = ArmyEntityFactory;

ArmyEntityFactory.prototype.loadDefaultComponents = function(entity, config) {
    const { mode, tileX, tileY } = config;

    const positionComponent = PositionComponent.create();
    const spriteComponent = SpriteComponent.create();
    const directionComponent = DirectionComponent.create();
    const teamComponent = TeamComponent.create(config);
    const healthComponent = HealthComponent.create(entity.config.stats[mode]);

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    entity.addComponent(positionComponent);
    entity.addComponent(spriteComponent);
    entity.addComponent(directionComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(teamComponent);
}

ArmyEntityFactory.prototype.createDefaultSprite = function(gameContext, entity, config) {
    const { spriteManager, renderer } = gameContext;
    const { tileX, tileY } = config;

    const spriteType = entity.config.sprites["idle"];
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.createSprite(spriteType, SpriteManager.LAYER_MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getID();

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);

    return sprite;
}

ArmyEntityFactory.prototype.onCreate = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { mode, components, type } = config;

    const entityType = this.getEntityType(type);

    if(!entityType) {
        return null;
    }

    const entity = new ArmyEntity(entityType, type);
    const { archetype, stats } = entityType;
    const statConfig = stats[mode];

    this.loadDefaultComponents(entity, config);

    const sprite = this.createDefaultSprite(gameContext, entity, config);

    switch(archetype) {
        case ArmyEntity.ARCHETYPE.UNIT: {
            const attackComponent = AttackComponent.create(statConfig);
            const moveComponent = MoveComponent.create(statConfig, entityType);
            
            attackComponent.toActive();
        
            entity.addComponent(attackComponent);
            entity.addComponent(moveComponent);
            entity.getComponent(SpriteComponent).allowFlip();
            break;
        }
        case ArmyEntity.ARCHETYPE.DEFENSE: {
            const attackComponent = AttackComponent.create(statConfig);
    
            attackComponent.toPassive();
                
            entity.addComponent(attackComponent);
            break;
        }
        case ArmyEntity.ARCHETYPE.CONSTRUCTION: {
            const constructionComponent = ConstructionComponent.create(entityType);

            entity.addComponent(constructionComponent);
        
            sprite.freeze();
            sprite.setFrame(0);
            break;
        }
        case ArmyEntity.ARCHETYPE.BUILDING: {
            const productionComponent = ProductionComponent.create(entityType);

            productionComponent.state = ProductionComponent.STATE.PRODUCING;

            entity.addComponent(productionComponent);
            break;
        }
        default: {
            console.warn(`Archetype ${archetype} is not defined!`);
            break;
        }
    }

    entityManager.loadTraits(entity, statConfig.traits);
    entityManager.loadComponents(entity, components);

    return entity;
}