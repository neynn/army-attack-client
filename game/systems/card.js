import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/applyable/textStyle.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { Player } from "../player/player.js";

export const CardSystem = function() {}

CardSystem.TYPE = {
    STAT_CARD: "STAT_CARD",
    HEALTH_TEXT: "HEALTH_TEXT",
    DAMAGE_TEXT: "DAMAGE_TEXT"
};

CardSystem.SPRITE_TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

CardSystem.addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const healthText = new SimpleText();
    
    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText, CardSystem.TYPE.HEALTH_TEXT);
    entity.events.subscribe(ArmyEntity.EVENT.HEALTH_UPDATE, CardSystem.TYPE.STAT_CARD, (health, maxHealth) => healthText.setText(`${health}/${maxHealth}`));
}

CardSystem.addDamageText = function(entity, statCard) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const damageText = new SimpleText();

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    damageText.setPosition(95, 78);
    damageText.setText(`${attackComponent.damage}`);

    statCard.addChild(damageText, CardSystem.TYPE.DAMAGE_TEXT);
    entity.events.subscribe(ArmyEntity.EVENT.DAMAGE_UPDATE, CardSystem.TYPE.STAT_CARD, (damage) => damageText.setText(`${damage}`));
}

CardSystem.createAttackerCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType, null);

    CardSystem.addHealthText(entity, statCard);
    CardSystem.addDamageText(entity, statCard);

    return statCard;
}

CardSystem.createNormalCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType, null);

    CardSystem.addHealthText(entity, statCard);

    return statCard;
}

CardSystem.getTeamSprites = function(gameContext, entity) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamType");
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const teamSprites = teamTypes[teamComponent.teamID].sprites;

    return teamSprites;
}

CardSystem.getCardOffset = function(gameContext, entity) {
    const { renderer } = gameContext;
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const { x, y } = camera.transformSizeToPositionOffset(entity.config.dimX, entity.config.dimY);

    return {
        "x": x - 48,
        "y": y - 48
    }
}

CardSystem.createStatCard = function(gameContext, entity) {
    const { x, y } = CardSystem.getCardOffset(gameContext, entity);
    const teamSprites = CardSystem.getTeamSprites(gameContext, entity);
    
    if(entity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.LARGE];

        if(statCardType) {
            const statCard = CardSystem.createAttackerCard(gameContext, entity, statCardType);

            statCard.setPosition(x, y);

            return statCard;
        }        
    } else {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.SMALL];

        if(statCardType) {
            const statCard = CardSystem.createNormalCard(gameContext, entity, statCardType);

            statCard.setPosition(x, y);

            return statCard;
        }
    }

    return null;
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
        sprite.addChild(statCard, CardSystem.TYPE.STAT_CARD);
    }
}