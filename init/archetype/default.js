import { AttackComponent } from "../../components/attack.js";
import { HealthComponent } from "../../components/health.js";
import { TeamComponent } from "../../components/team.js";
import { ENTITY_EVENTS } from "../../enums.js";
import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/applyable/textStyle.js";
import { componentSetup } from "../componentSetup.js";
import { SpriteComponent } from "../../components/sprite.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { Archetype } from "../../source/entity/archetype.js";
import { positionSizeOffset } from "../../source/camera/helpers.js";

const MODE_STAT_TYPE_ID = "story";

export const DefaultArchetype = function() {
    Archetype.call(this);
}

DefaultArchetype.prototype = Object.create(Archetype.prototype);
DefaultArchetype.prototype.constructor = DefaultArchetype;

DefaultArchetype.prototype.createStatCard = function(gameContext, entity, sprite) {
    const { spriteManager } = gameContext;
    const teamTypes = gameContext.getConfig("teamTypes");

    const healthComponent = entity.getComponent(HealthComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    const statCardType = teamTypes[teamComponent.teamID].sprites.stat_card;
    const statCard = spriteManager.createSprite(statCardType, null);
    const { x, y } = positionSizeOffset(entity.config.dimX, entity.config.dimY);

    const healthText = new SimpleText("HEALTH_TEXT");

    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.setPosition(x - 48, y - 48);
    statCard.addChild(healthText, "HEALTH_TEXT");

    entity.events.listen(ENTITY_EVENTS.HEALTH_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.HEALTH_UPDATE, "ARCHETYPE", (health, maxHealth) => {
        healthText.setText(`${health}/${maxHealth}`);
    });

    if(entity.hasComponent(AttackComponent)) {
        const attackComponent = entity.getComponent(AttackComponent);
        const damageText = new SimpleText("DAMAGE_TEXT");

        damageText.style.setFontType("ArmyAttack Arial");
        damageText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

        damageText.setPosition(95, 78);
        damageText.setText(`${attackComponent.damage}`);

        statCard.addChild(damageText, "DAMAGE_TEXT");

        entity.events.listen(ENTITY_EVENTS.DAMAGE_UPDATE);
        entity.events.subscribe(ENTITY_EVENTS.DAMAGE_UPDATE, "ARCHETYPE", (damage) => {
            damageText.setText(`${damage}`);
        });
    }

    sprite.addChild(statCard, "STATS");
}

DefaultArchetype.prototype.initializeEntity = function(gameContext, entity, sprite, type, setup) {
    const { spriteManager } = gameContext;
    const { stats } = type;
    const usedStats = stats[MODE_STAT_TYPE_ID];

    const directionComponent = componentSetup.setupDirectionComponent();
    const positionComponent = componentSetup.setupPositionComponent(setup);
    const teamComponent = componentSetup.setupTeamComponent(setup);
    const spriteComponent = componentSetup.setupSpriteComponent(sprite);
    const healthComponent = componentSetup.setupHealthComponent(type, usedStats);

    entity.useEvents();

    entity.addComponent(positionComponent);
    entity.addComponent(spriteComponent);
    entity.addComponent(directionComponent);
    entity.addComponent(healthComponent);
    entity.addComponent(teamComponent);

    entity.events.listen(ENTITY_EVENTS.POSITION_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.POSITION_UPDATE, "ARCHETYPE", (positionX, positionY) => {
        const spriteComponent = entity.getComponent(SpriteComponent);
        const { spriteID } = spriteComponent;
        const sprite = spriteManager.getSprite(spriteID);

        sprite.setPosition(positionX, positionY);
    });
    
    entity.events.listen(ENTITY_EVENTS.SPRITE_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.SPRITE_UPDATE, "ARCHETYPE", (spriteType, animationType) => {
        const spriteComponent = entity.getComponent(SpriteComponent);
        const { spriteID, isFlipped } = spriteComponent;
        const sprite = spriteManager.getSprite(spriteID);
        
        sprite.flip(isFlipped);

        if(spriteType !== undefined) {
            spriteManager.updateSprite(spriteID, spriteType, animationType);
        }
    });

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);
}

DefaultArchetype.prototype.finalizeEntity = function(gameContext, entity, sprite, type, setup) {
    const { entityManager } = gameContext;
    const { stats } = type;
    const usedStats = stats[MODE_STAT_TYPE_ID];

    entityManager.loadTraits(entity, usedStats.traits);
    entityManager.loadComponents(entity, setup.components);
}

DefaultArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {}

DefaultArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {}

DefaultArchetype.prototype.onBuild = function(gameContext, entity, type, setup) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite(type.sprites.idle, SpriteManager.LAYER_MIDDLE);

    this.initializeEntity(gameContext, entity, sprite, type, setup);
    this.onInitialize(gameContext, entity, sprite, type);
    this.finalizeEntity(gameContext, entity, sprite, type, setup);
    this.onFinalize(gameContext, entity, sprite, type);
}
