import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { Factory } from "../../source/factory/factory.js";

import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { SpriteComponent } from "../components/sprite.js";
import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";
import { CAMERA_TYPES } from "../enums.js";
import { AttackComponent } from "../components/attack.js";
import { MoveComponent } from "../components/move.js";
import { ConstructionComponent } from "../components/construction.js";
import { ProductionComponent } from "../components/production.js";
import { ArmyEntity } from "./armyEntity.js";

export const ArmyEntityFactory = function() {
    Factory.call(this, "ARMY_ENTITY_FACTORY");
}

ArmyEntityFactory.TYPE = {
    "UNIT": "Unit",
    "DEFENSE": "Defense",
    "CONSTRUCTION": "Construction",
    "BUILDING": "Building"
};

ArmyEntityFactory.prototype = Object.create(Factory.prototype);
ArmyEntityFactory.prototype.constructor = ArmyEntityFactory;

ArmyEntityFactory.prototype.loadDefaultComponents = function(entity, config) {
    const positionComponent = new PositionComponent();
    const spriteComponent = new SpriteComponent();
    const directionComponent = new DirectionComponent();
    const healthComponent = new HealthComponent();
    const teamComponent = new TeamComponent();

    const { 
        mode,
        tileX = 0,
        tileY = 0,
        team = null
    } = config;

    const {
        health = 1,
        maxHealth = health
    } = entity.config.stats[mode];;

    healthComponent.health = config.health ?? health;
    healthComponent.maxHealth = config.maxHealth ?? maxHealth;

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    teamComponent.teamID = team;

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
    const sprite = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getID();

    sprite.setPosition(x, y);

    return sprite;
}

ArmyEntityFactory.prototype.onCreate = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { mode, components, type } = config;
    const entityType = this.getType(type);

    if(!entityType) {
        return null;
    }

    const { archetype, stats } = entityType;
    const statConfig = stats[mode];

    const entity = new ArmyEntity(entityType, type);

    this.loadDefaultComponents(entity, config);

    const sprite = this.createDefaultSprite(gameContext, entity, config);

    switch(archetype) {
        case ArmyEntityFactory.TYPE.UNIT: {
            const attackComponent = new AttackComponent();
            const moveComponent = new MoveComponent();
            
            moveComponent.custom(statConfig, entityType);
            attackComponent.custom(statConfig);
            attackComponent.toActive();
        
            entity.addComponent(attackComponent);
            entity.addComponent(moveComponent);
            entity.getComponent(SpriteComponent).allowFlip();
            break;
        }
        case ArmyEntityFactory.TYPE.DEFENSE: {
            const attackComponent = new AttackComponent();
    
            attackComponent.custom(statConfig);
            attackComponent.toPassive();
                
            entity.addComponent(attackComponent);
            break;
        }
        case ArmyEntityFactory.TYPE.CONSTRUCTION: {
            const constructionComponent = new ConstructionComponent();

            constructionComponent.custom(entityType);
            entity.addComponent(constructionComponent);
        
            sprite.freeze();
            sprite.setFrame(0);
            break;
        }
        case ArmyEntityFactory.TYPE.BUILDING: {
            const productionComponent = new ProductionComponent();

            productionComponent.state = ProductionComponent.STATE.PRODUCING;

            entity.addComponent(productionComponent);
            break;
        }
        default: {
            console.warn(`Archetype ${archetype} is not defined!`);
            break;
        }
    }

    entityManager.initTraits(entity, statConfig.traits);
    entityManager.loadComponents(entity, components);

    return entity;
}