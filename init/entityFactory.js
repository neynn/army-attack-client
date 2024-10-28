import { AttackComponent } from "../components/attack.js";
import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { ENTITY_EVENTS, ENTITY_STATES } from "../enums.js";
import { ImageSheet } from "../source/graphics/imageSheet.js";
import { SimpleText } from "../source/graphics/simpleText.js";
import { UnitDownState } from "../states/unit/unitDown.js";
import { UnitIdleState } from "../states/unit/unitIdle.js";
import { ConstructionIdleState } from "../states/construction/constructionIdle.js";
import { TextStyle } from "../source/graphics/textStyle.js";
import { componentSetup } from "./components.js";
import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";

const EXAMPLE_SETUP = {"tileX": 0, "tileY": 0, "type": null, "team": null, "master": null, "components": {"Health": {"health": 5, "maxHealth": 20}}};
const MODE_STAT_TYPE_ID = "story";

const createStatCard = function(gameContext, entity, sprite) {
    const { spriteManager } = gameContext;

    const teamTypes = gameContext.getConfig("teamTypes");
    const starCardType = teamTypes[entity.getComponent(TeamComponent).teamID].sprites.statCard;
    const statCard = spriteManager.createChildSprite(sprite.id, starCardType, "STATS");
    const healthText = new SimpleText();
    const damageText = new SimpleText();

    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    healthText.setPosition(95, 90);
    damageText.setPosition(95, 78);

    healthText.setText(`${entity.getComponent(HealthComponent).health}/${entity.getComponent(HealthComponent).maxHealth}`);
    damageText.setText(`${entity.getComponent(AttackComponent).damage}`);

    statCard.setPosition(-48, -48);
    statCard.addChild(healthText, "HEALTH_TEXT");
    statCard.addChild(damageText, "DAMAGE_TEXT");

    entity.events.subscribe(ENTITY_EVENTS.STAT_UPDATE, "BUILDER", () => {
        const healthComponent = entity.getComponent(HealthComponent);
        const attackComponent = entity.getComponent(AttackComponent);

        healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);
        damageText.setText(`${attackComponent.damage}`);
    });
}

const createUnit = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    const attackComponent = componentSetup.setupAttackComponent(typeConfig, typeConfig.stats[MODE_STAT_TYPE_ID]);
    const moveComponent = componentSetup.setupMoveComponent(typeConfig, typeConfig.stats[MODE_STAT_TYPE_ID]);

    entity.states.addState(ENTITY_STATES.IDLE, new UnitIdleState());
    entity.states.addState(ENTITY_STATES.DOWN, new UnitDownState());

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
    
    createStatCard(gameContext, entity, entitySprite);

    return entity;
}

const createDefense = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    const attackComponent = componentSetup.setupAttackComponent(typeConfig, typeConfig.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(attackComponent);

    createStatCard(gameContext, entity, entitySprite);

    return entity;
}

const createDeco = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    return entity;
}

const createBuilding = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    return entity;
}

const createHFE = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    return entity;
}

const createTown = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    return entity;
}

const createConstruction = function(gameContext, entity, entitySprite, entitySetup, typeConfig) {
    const constructionComponent = componentSetup.setupConstructionComponent(entitySetup, typeConfig);

    entitySprite.setStatic(true);
    entitySprite.setFrame(2);

    entity.states.addState(ENTITY_STATES.IDLE, new ConstructionIdleState());

    entity.addComponent(constructionComponent);

    return entity;
}

export const entityFactory = {
    "Unit": createUnit,
    "Defense": createDefense,
    "Deco": createDeco,
    "Building": createBuilding,
    "Construction": createConstruction,
    "HFE": createHFE,
    "Town": createTown
};

entityFactory.isBuildable = function(archetype) {
    if(entityFactory[archetype]) {
        return true;
    }

    return true;
}

entityFactory.buildEntity = function(gameContext, entity, sprite, type, setup) {
    //Based on gamemode, grab the correct stats and give them to the component builder.
    const { spriteManager, entityManager } = gameContext;
    const directionComponent = componentSetup.setupDirectionComponent();
    const positionComponent = componentSetup.setupPositionComponent(setup);
    const teamComponent = componentSetup.setupTeamComponent(setup);
    const spriteComponent = componentSetup.setupSpriteComponent(sprite);
    const sizeComponent = componentSetup.setupSizeComponent(type);
    const healthComponent = componentSetup.setupHealthComponent(type, type.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(positionComponent);
    entity.addComponent(spriteComponent);
    entity.addComponent(directionComponent);
    entity.addComponent(sizeComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(teamComponent);

    entity.events.listen(ENTITY_EVENTS.POSITION_UPDATE);
    entity.events.listen(ENTITY_EVENTS.DIRECTION_UPDATE);
    entity.events.listen(ENTITY_EVENTS.SPRITE_UPDATE);
    entity.events.listen(ENTITY_EVENTS.STAT_UPDATE);

    entity.events.subscribe(ENTITY_EVENTS.POSITION_UPDATE, "BUILDER", () => {
        const positionComponent = entity.getComponent(PositionComponent);
        const spriteComponent = entity.getComponent(SpriteComponent);
        const { spriteID } = spriteComponent;
        const sprite = spriteManager.getSprite(spriteID);

        sprite.setPosition(positionComponent.positionX, positionComponent.positionY);
    });

    entity.events.subscribe(ENTITY_EVENTS.DIRECTION_UPDATE, "BUILDER", () => {

    });

    entity.events.subscribe(ENTITY_EVENTS.SPRITE_UPDATE, "BUILDER", () => {
        const spriteComponent = entity.getComponent(SpriteComponent);
        const { spriteID, spriteType, animationType, isFlipped } = spriteComponent;
        const sprite = spriteManager.getSprite(spriteID);
        
        sprite.flip(isFlipped);
        spriteManager.updateSprite(spriteID, spriteType, animationType);
    });

    entityFactory[type.archetype](gameContext, entity, sprite, setup, type);
    entityManager.loadComponents(entity, setup.components);
    entityManager.loadTraits(entity, type.stats[MODE_STAT_TYPE_ID].traits);

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);

    entity.states.setNextState(ENTITY_STATES.IDLE);
    entity.events.emit(ENTITY_EVENTS.STAT_UPDATE);
}
