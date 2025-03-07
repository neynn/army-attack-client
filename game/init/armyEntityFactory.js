import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { Factory } from "../../source/factory/factory.js";
import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { SpriteComponent } from "../components/sprite.js";
import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";
import { AttackComponent } from "../components/attack.js";
import { MoveComponent } from "../components/move.js";
import { ConstructionComponent } from "../components/construction.js";
import { ProductionComponent } from "../components/production.js";
import { ArmyEntity } from "./armyEntity.js";
import { Player } from "../player/player.js";

export const ArmyEntityFactory = function() {
    Factory.call(this, "ARMY_ENTITY_FACTORY");
}

ArmyEntityFactory.TYPE = {
    UNIT: "Unit",
    DEFENSE: "Defense",
    CONSTRUCTION: "Construction",
    BUILDING: "Building"
};

ArmyEntityFactory.prototype = Object.create(Factory.prototype);
ArmyEntityFactory.prototype.constructor = ArmyEntityFactory;

const initAttackComponent = function(component, stats) {
    const {
        damage = 0,
        attackRange = 0
    } = stats;

    component.damage = damage;
    component.range = attackRange;
}

const initConstructionComponent = function(component, type) {
    const {
        constructionSteps,
        constructionResult
    } = type;

    component.stepsRequired = constructionSteps;
    component.result = constructionResult;
}

const initMoveComponent = function(component, config, type) {
    const {
        passability = []
    } = type;

    const {
        moveRange = 0,
        moveSpeed = 480
    } = config;

    for(let i = 0; i < passability.length; i++) {
        component.passability.add(passability[i]);
    }

    component.range = moveRange;
    component.speed = moveSpeed;
}

const createDefaultEntity = function(defaultConfig, config, gameMode) {
    const { tileX = 0, tileY = 0, team = null, type } = config;
    const { stats } = defaultConfig;
    const entity = new ArmyEntity(type);
    const positionComponent = new PositionComponent();
    const spriteComponent = new SpriteComponent();
    const directionComponent = new DirectionComponent();
    const healthComponent = new HealthComponent();
    const teamComponent = new TeamComponent();

    const {
        health = 1,
        maxHealth = health
    } = stats[gameMode];

    healthComponent.health = config.health ?? health;
    healthComponent.maxHealth = config.maxHealth ?? maxHealth;

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    teamComponent.teamID = team;

    entity.setConfig(defaultConfig);
    entity.addComponent(ArmyEntity.COMPONENT.POSITION, positionComponent);
    entity.addComponent(ArmyEntity.COMPONENT.SPRITE, spriteComponent);
    entity.addComponent(ArmyEntity.COMPONENT.DIRECTION, directionComponent);
    entity.addComponent(ArmyEntity.COMPONENT.HEALTH, healthComponent);
    entity.addComponent(ArmyEntity.COMPONENT.TEAM, teamComponent);

    return entity;
}

const createDefaultSprite = function(gameContext, entity, config) {
    const { spriteManager, renderer } = gameContext;
    const { tileX, tileY } = config;

    const spriteType = entity.getSpriteID(ArmyEntity.SPRITE_TYPE.IDLE);
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const sprite = spriteManager.createSprite(spriteType, SpriteManager.LAYER.MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);

    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getIndex();

    sprite.setPosition(x, y);

    return sprite;
}

ArmyEntityFactory.prototype.onCreate = function(gameContext, config) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { components, type } = config;
    const gameMode = gameContext.getGameModeName();
    const entityType = this.getType(type);

    if(!entityType) {
        return null;
    }

    const entity = createDefaultEntity(entityType, config, gameMode);
    const sprite = createDefaultSprite(gameContext, entity, config);
    const { archetype, stats } = entityType;
    const statConfig = stats[gameMode] || {};

    switch(archetype) {
        case ArmyEntityFactory.TYPE.UNIT: {
            const attackComponent = new AttackComponent();
            const moveComponent = new MoveComponent();
            
            attackComponent.toActive();

            initMoveComponent(moveComponent, statConfig, entityType);
            initAttackComponent(attackComponent, statConfig);
        
            entity.addComponent(ArmyEntity.COMPONENT.ATTACK, attackComponent);
            entity.addComponent(ArmyEntity.COMPONENT.MOVE, moveComponent);
            entity.getComponent(ArmyEntity.COMPONENT.SPRITE).allowFlip();
            break;
        }
        case ArmyEntityFactory.TYPE.DEFENSE: {
            const attackComponent = new AttackComponent();
    
            attackComponent.toPassive();

            initAttackComponent(attackComponent, statConfig);
                
            entity.addComponent(ArmyEntity.COMPONENT.ATTACK, attackComponent);
            break;
        }
        case ArmyEntityFactory.TYPE.CONSTRUCTION: {
            const constructionComponent = new ConstructionComponent();

            initConstructionComponent(constructionComponent, entityType);

            entity.addComponent(ArmyEntity.COMPONENT.CONSTRUCTION, constructionComponent);
        
            sprite.freeze();
            sprite.setFrame(0);
            break;
        }
        case ArmyEntityFactory.TYPE.BUILDING: {
            const productionComponent = new ProductionComponent();

            productionComponent.state = ProductionComponent.STATE.PRODUCING;

            entity.addComponent(ArmyEntity.COMPONENT.PRODUCTION, productionComponent);
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