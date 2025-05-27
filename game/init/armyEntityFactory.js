import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { Factory } from "../../source/factory/factory.js";
import { ArmyEntity } from "./armyEntity.js";

export const ArmyEntityFactory = function() {
    Factory.call(this, "ARMY_ENTITY_FACTORY");
}

ArmyEntityFactory.prototype = Object.create(Factory.prototype);
ArmyEntityFactory.prototype.constructor = ArmyEntityFactory;

const initAttackComponent = function(entityType, component, stats) {
    const {
        damage = 0,
        attackRange = 0
    } = stats;

    component.damage = damage;
    component.range = attackRange;
}

const initConstructionComponent = function(entityType, component, stats) {
    const {
        constructionSteps,
        constructionResult
    } = entityType;

    component.stepsRequired = constructionSteps;
    component.result = constructionResult;
}

const initMoveComponent = function(entityType, component, stats) {
    const {
        passability = []
    } = entityType;

    const {
        moveRange = 0,
        moveSpeed = 480
    } = stats;

    for(let i = 0; i < passability.length; i++) {
        component.passability.add(passability[i]);
    }

    component.range = moveRange;
    component.speed = moveSpeed;
}

const setupComponents = function(entity, stats, tileX, tileY, teamID, customHealth) {
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const {
        health = 1,
        maxHealth = health
    } = stats;

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    if(customHealth === undefined) {
        healthComponent.health = health;
    } else {
        healthComponent.health = customHealth;
    }

    healthComponent.maxHealth = maxHealth;

    teamComponent.teamID = teamID;
}

const createSprite = function(gameContext, entity, tileX, tileY) {
    const { spriteManager, transform2D } = gameContext;
    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.IDLE);
    const sprite = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.setIndex(sprite.getIndex());
    sprite.setPosition(x, y);

    return sprite;
}

const COMPONENT_INIT = {
    [ArmyEntity.COMPONENT.ATTACK]: initAttackComponent,
    [ArmyEntity.COMPONENT.CONSTRUCTION]: initConstructionComponent,
    [ArmyEntity.COMPONENT.MOVE]: initMoveComponent
};

ArmyEntityFactory.prototype.onCreate = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { tileX = -1, tileY = -1, team = null, type = null, health } = config;
    const entityType = entityManager.getEntityType(type);

    if(!entityType) {
        return null;
    }

    const modeID = gameContext.getGameModeName();
    const { archetype, stats } = entityType;
    const statConfig = stats[modeID];

    if(!statConfig) {
        return null;
    }

    const entity = new ArmyEntity(entityType, type);
    
    entityManager.addArchetypeComponents(entity, archetype);

    setupComponents(entity, statConfig, tileX, tileY, team, health);

    const sprite = createSprite(gameContext, entity, tileX, tileY);

    entityManager.addTraitComponents(entity, statConfig.traits);

    for(const componentID in COMPONENT_INIT) {
        const component = entity.getComponent(componentID);

        if(component) {
            COMPONENT_INIT[componentID](entityType, component, statConfig);
        }
    }

    if(archetype === ArmyEntity.TYPE.CONSTRUCTION) {
        sprite.freeze();
        sprite.setFrame(0);
    }
    
    return entity;
}