import { SimpleText } from "../../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../../source/graphics/applyable/textStyle.js";
import { SpriteManager } from "../../../source/graphics/spriteManager.js";
import { Archetype } from "../../../source/entity/archetype.js";

import { AttackComponent } from "../../components/attack.js";
import { HealthComponent } from "../../components/health.js";
import { TeamComponent } from "../../components/team.js";
import { CAMERA_TYPES, ENTITY_EVENTS } from "../../enums.js";
import { SpriteComponent } from "../../components/sprite.js";
import { DirectionComponent } from "../../components/direction.js";
import { PositionComponent } from "../../components/position.js";

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
    const { world, spriteManager, renderer } = gameContext;
    const { entityManager } = world;
    const { stats, sprites } = type;
    const { mode, components, tileX, tileY } = setup;
    const { traits } = stats[mode];

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const sprite = spriteManager.createSprite(sprites["idle"], SpriteManager.LAYER_MIDDLE);
    const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);

    const positionComponent = entity.getComponent(PositionComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    entityManager.loadTraits(entity, traits);
    entityManager.loadCustomComponents(entity, components);

    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;
    positionComponent.positionX = x;
    positionComponent.positionY = y;

    spriteComponent.spriteID = sprite.getID();

    sprite.setPosition(positionComponent.positionX, positionComponent.positionY);

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

    this.onFinalize(gameContext, entity, sprite, type, setup);
}

DefaultArchetype.prototype.onInitialize = function(entity, type, setup) {}

DefaultArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {}

DefaultArchetype.prototype.onBuild = function(gameContext, entity, type, setup) {
    this.initializeEntity(entity, type, setup);
    this.finalizeEntity(gameContext, entity, type, setup);
}
