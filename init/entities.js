import { AttackComponent } from "../components/attack.js";
import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { ENTITY_EVENTS } from "../enums.js";
import { SimpleText } from "../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../source/graphics/applyable/textStyle.js";
import { componentSetup } from "./componentSetup.js";
import { PositionComponent } from "../components/position.js";
import { SpriteComponent } from "../components/sprite.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";

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

const createUnit = function(gameContext, entity, sprite, type, setup) {
    const attackComponent = componentSetup.setupAttackComponent(type, type.stats[MODE_STAT_TYPE_ID]);
    const moveComponent = componentSetup.setupMoveComponent(type, type.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
    
    createStatCard(gameContext, entity, sprite);
}

const createDefense = function(gameContext, entity, sprite, type, setup) {
    const attackComponent = componentSetup.setupAttackComponent(type, type.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(attackComponent);

    createStatCard(gameContext, entity, sprite);
}

const createDeco = function(gameContext, entity, sprite, type, setup) {}

const createBuilding = function(gameContext, entity, sprite, type, setup) {}

const createHFE = function(gameContext, entity, sprite, type, setup) {}

const createTown = function(gameContext, entity, sprite, type, setup) {}

const createConstruction = function(gameContext, entity, sprite, type, setup) {
    const constructionComponent = componentSetup.setupConstructionComponent(setup, type);

    sprite.freeze();
    sprite.setFrame(2);

    entity.addComponent(constructionComponent);
}

const createBaseEntity = function(gameContext, entity, sprite, type, setup) {
    const { spriteManager } = gameContext;
    const { stats } = type;
    const usedStats = stats[MODE_STAT_TYPE_ID];

    const directionComponent = componentSetup.setupDirectionComponent();
    const positionComponent = componentSetup.setupPositionComponent(setup);
    const teamComponent = componentSetup.setupTeamComponent(setup);
    const spriteComponent = componentSetup.setupSpriteComponent(sprite);
    const sizeComponent = componentSetup.setupSizeComponent(type);
    const healthComponent = componentSetup.setupHealthComponent(type, usedStats);

    entity.initializeEvents();

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

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);
}

const finalizeEntity = function(gameContext, entity, type, setup) {
    const { entityManager } = gameContext;
    const { stats } = type;
    const usedStats = stats[MODE_STAT_TYPE_ID];

    entityManager.loadTraits(entity, usedStats.traits);
    entityManager.loadComponents(entity, setup.components);

    entity.events.emit(ENTITY_EVENTS.STAT_UPDATE);
}

export const buildUnit = function(gameContext, entity, type, setup) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite(type.sprites.idle, SpriteManager.LAYER_MIDDLE);

    createBaseEntity(gameContext, entity, sprite, type, setup);
    createUnit(gameContext, entity, sprite, type, setup);
    finalizeEntity(gameContext, entity, type, setup);
}

export const buildDefense = function(gameContext, entity, type, setup) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite(type.sprites.idle, SpriteManager.LAYER_MIDDLE);

    createBaseEntity(gameContext, entity, sprite, type, setup);
    createDefense(gameContext, entity, sprite, type, setup);
    finalizeEntity(gameContext, entity, type, setup);
}