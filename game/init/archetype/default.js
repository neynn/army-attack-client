import { SimpleText } from "../../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../../source/graphics/applyable/textStyle.js";
import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { Archetype } from "../../../source/entity/archetype.js";

import { AttackComponent } from "../../components/attack.js";
import { HealthComponent } from "../../components/health.js";
import { TeamComponent } from "../../components/team.js";
import { CAMERA_TYPES, ENTITY_EVENTS } from "../../enums.js";
import { componentSetup } from "../componentSetup.js";
import { SpriteComponent } from "../../components/sprite.js";

export const DefaultArchetype = function() {
    Archetype.call(this);
}

DefaultArchetype.prototype = Object.create(Archetype.prototype);
DefaultArchetype.prototype.constructor = DefaultArchetype;

DefaultArchetype.prototype.addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(HealthComponent);
    const healthText = new SimpleText("HEALTH_TEXT");

    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText, "HEALTH_TEXT");

    entity.events.listen(ENTITY_EVENTS.HEALTH_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.HEALTH_UPDATE, "ARCHETYPE", (health, maxHealth) => {
        healthText.setText(`${health}/${maxHealth}`);
    });
}

DefaultArchetype.prototype.addDamageText = function(entity, statCard) {
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

DefaultArchetype.prototype.createStatCard = function(gameContext, entity, sprite) {
    const { spriteManager, renderer, world } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const teamTypes = world.getConfig("teamTypes");
    const teamComponent = entity.getComponent(TeamComponent);
    const { x, y } = camera.transformSizeToPositionOffset(entity.config.dimX, entity.config.dimY);

    if(entity.hasComponent(AttackComponent)) {
        const statCardType = teamTypes[teamComponent.teamID].sprites.stat_card;
        const statCard = spriteManager.createSprite(statCardType, null);

        this.addHealthText(entity, statCard);
        this.addDamageText(entity, statCard);

        statCard.setPosition(x - 48, y - 48);
        sprite.addChild(statCard, "STATS");
    } else {
        const statCardType = teamTypes[teamComponent.teamID].sprites.stat_card_small;
        const statCard = spriteManager.createSprite(statCardType, null);

        this.addHealthText(entity, statCard);

        statCard.setPosition(x - 48, y - 48);
        sprite.addChild(statCard, "STATS");
    }
}

DefaultArchetype.prototype.initializeEntity = function(gameContext, entity, sprite, type, setup) {
    const { spriteManager, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const { stats } = type;
    const { mode } = setup;

    const directionComponent = componentSetup.setupDirectionComponent();
    const positionComponent = componentSetup.setupPositionComponent(setup);
    const teamComponent = componentSetup.setupTeamComponent(setup);
    const spriteComponent = componentSetup.setupSpriteComponent(sprite);
    const healthComponent = componentSetup.setupHealthComponent(stats[mode]);

    const { x, y } = camera.transformTileToPositionCenter(positionComponent.tileX, positionComponent.tileY);
    positionComponent.positionX = x;
    positionComponent.positionY = y;

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
    const { world } = gameContext;
    const { entityManager } = world;
    const { stats } = type;
    const { mode, components } = setup;
    const { traits } = stats[mode];

    entityManager.loadTraits(entity, traits);
    entityManager.loadComponents(entity, components);
}

DefaultArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type, setup) {}

DefaultArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {}

DefaultArchetype.prototype.onBuild = function(gameContext, entity, type, setup) {
    const { spriteManager } = gameContext;
    const { sprites } = type;
    const { idle } = sprites;
    const sprite = spriteManager.createSprite(idle, SpriteManager.LAYER_MIDDLE);

    this.initializeEntity(gameContext, entity, sprite, type, setup);
    this.onInitialize(gameContext, entity, sprite, type, setup);
    this.finalizeEntity(gameContext, entity, sprite, type, setup);
    this.onFinalize(gameContext, entity, sprite, type, setup);
}
