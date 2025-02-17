import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/applyable/textStyle.js";
import { CAMERA_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const CardSystem = function() {}

CardSystem.STAT_CARD_ID = "STAT_CARD";
CardSystem.HEALTH_TEXT_ID = "HEALTH_TEXT";
CardSystem.DAMAGE_TEXT_ID = "DAMAGE_TEXT";

CardSystem.addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const healthText = new SimpleText(CardSystem.HEALTH_TEXT_ID);
    
    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText, CardSystem.HEALTH_TEXT_ID);
    entity.events.subscribe(ArmyEntity.EVENT.HEALTH_UPDATE, CardSystem.STAT_CARD_ID, (health, maxHealth) => healthText.setText(`${health}/${maxHealth}`));
}

CardSystem.addDamageText = function(entity, statCard) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const damageText = new SimpleText(CardSystem.DAMAGE_TEXT_ID);

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGN_RIGHT);

    damageText.setPosition(95, 78);
    damageText.setText(`${attackComponent.damage}`);

    statCard.addChild(damageText, CardSystem.DAMAGE_TEXT_ID);
    entity.events.subscribe(ArmyEntity.EVENT.DAMAGE_UPDATE, CardSystem.STAT_CARD_ID, (damage) => damageText.setText(`${damage}`));
}

CardSystem.createStatCard = function(gameContext, entity) {
    const { spriteManager, renderer, world } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const teamTypes = world.getConfig("TeamType");
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const { x, y } = camera.transformSizeToPositionOffset(entity.config.dimX, entity.config.dimY);
    const positionX = x - 48;
    const positionY = y - 48;

    if(entity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
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
    const entityTypes = world.getConfig("EntityType");
    const entityType = entityTypes[entity.config.archetype];

    if(entityType.disableCard || entity.config.disableCard) {
        return;
    }

    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const sprite = spriteManager.getSprite(spriteComponent.spriteID);
    const statCard = CardSystem.createStatCard(gameContext, entity);

    if(statCard) {
        sprite.addChild(statCard, CardSystem.STAT_CARD_ID);
    }
}