import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/applyable/textStyle.js";

import { AttackComponent } from "../components/attack.js";
import { HealthComponent } from "../components/health.js";
import { TeamComponent } from "../components/team.js";
import { CAMERA_TYPES, ENTITY_EVENTS } from "../enums.js";
import { SpriteComponent } from "../components/sprite.js";

export const CardSystem = function() {}

CardSystem.STAT_CARD_ID = "STAT_CARD";
CardSystem.HEALTH_TEXT_ID = "HEALTH_TEXT";
CardSystem.DAMAGE_TEXT_ID = "DAMAGE_TEXT";

CardSystem.addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(HealthComponent);
    const healthText = new SimpleText(CardSystem.HEALTH_TEXT_ID);
    
    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText, CardSystem.HEALTH_TEXT_ID);

    entity.events.listen(ENTITY_EVENTS.HEALTH_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.HEALTH_UPDATE, CardSystem.STAT_CARD_ID, (health, maxHealth) => {
        healthText.setText(`${health}/${maxHealth}`);
    });
}

CardSystem.addDamageText = function(entity, statCard) {
    const attackComponent = entity.getComponent(AttackComponent);
    const damageText = new SimpleText(CardSystem.DAMAGE_TEXT_ID);

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    damageText.setPosition(95, 78);
    damageText.setText(`${attackComponent.damage}`);

    statCard.addChild(damageText, CardSystem.DAMAGE_TEXT_ID);

    entity.events.listen(ENTITY_EVENTS.DAMAGE_UPDATE);
    entity.events.subscribe(ENTITY_EVENTS.DAMAGE_UPDATE, CardSystem.STAT_CARD_ID, (damage) => {
        damageText.setText(`${damage}`);
    });
}

CardSystem.createStatCard = function(gameContext, entity) {
    const { spriteManager, renderer, world } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const teamTypes = world.getConfig("TeamTypes");
    const teamComponent = entity.getComponent(TeamComponent);
    const { x, y } = camera.transformSizeToPositionOffset(entity.config.dimX, entity.config.dimY);
    const positionX = x - 48;
    const positionY = y - 48;

    if(entity.hasComponent(AttackComponent)) {
        const statCardType = teamTypes[teamComponent.teamID].sprites.stat_card;

        if(!statCardType) {
            return null;
        }

        const statCard = spriteManager.createSprite(statCardType, null);

        this.addHealthText(entity, statCard);
        this.addDamageText(entity, statCard);

        statCard.setPosition(positionX, positionY);
        
        return statCard;
    } else {
        const statCardType = teamTypes[teamComponent.teamID].sprites.stat_card_small;

        if(!statCardType) {
            return null;
        }
        
        const statCard = spriteManager.createSprite(statCardType, null);

        this.addHealthText(entity, statCard);

        statCard.setPosition(positionX, positionY);

        return statCard;
    }
}

CardSystem.generateStatCard = function(gameContext, entity) {
    const { spriteManager, world } = gameContext;
    const entityTypes = world.getConfig("EntityTypes");
    const entityType = entityTypes[entity.config.archetype];

    if(entityType.disableCard || entity.config.disableCard) {
        return;
    }

    const spriteComponent = entity.getComponent(SpriteComponent);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const statCard = CardSystem.createStatCard(gameContext, entity);

    if(statCard) {
        sprite.addChild(statCard, CardSystem.STAT_CARD_ID);
    }
}