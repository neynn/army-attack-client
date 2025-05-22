import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/textStyle.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { SpriteComponent } from "../components/sprite.js";

export const CardSystem = function() {}

CardSystem.SPRITE_TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

const addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const healthText = new SimpleText();
    
    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText);
    entity.events.on(ArmyEntity.EVENT.HEALTH_UPDATE, (health, maxHealth) => healthText.setText(`${health}/${maxHealth}`), { id: SpriteComponent.SPRITE_ID.CARD });
}

const addDamageText = function(entity, statCard) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const damageText = new SimpleText();

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    damageText.setPosition(95, 78);
    damageText.setText(`${attackComponent.damage}`);

    statCard.addChild(damageText);
    entity.events.on(ArmyEntity.EVENT.DAMAGE_UPDATE, (damage) => damageText.setText(`${damage}`), { id: SpriteComponent.SPRITE_ID.CARD });
}

const createAttackerCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType, null);

    addHealthText(entity, statCard);
    addDamageText(entity, statCard);

    return statCard;
}

const createNormalCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType, null);

    addHealthText(entity, statCard);

    return statCard;
}

const getTeamSprites = function(gameContext, entity) {
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const teamType = gameContext.teamTypes[teamID];

    if(!teamType) {
        return null;
    }

    const teamSprites = teamType.sprites;

    return teamSprites;
}

const getCardOffset = function(gameContext, entity) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformSizeToWorldOffset(entity.config.dimX, entity.config.dimY);

    return {
        "x": x - 48,
        "y": y - 48
    }
}

const createStatCard = function(gameContext, entity) {
    const { x, y } = getCardOffset(gameContext, entity);
    const teamSprites = getTeamSprites(gameContext, entity);
    
    if(!teamSprites) {
        return null;
    }

    if(entity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.LARGE];

        if(statCardType) {
            const statCard = createAttackerCard(gameContext, entity, statCardType);

            statCard.setPosition(x, y);

            return statCard;
        }        
    } else {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.SMALL];

        if(statCardType) {
            const statCard = createNormalCard(gameContext, entity, statCardType);

            statCard.setPosition(x, y);

            return statCard;
        }
    }

    return null;
}

CardSystem.generateStatCard = function(gameContext, entity) {
    if(entity.config.disableCard) {
        return;
    }

    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const sprite = spriteComponent.getSprite(gameContext);
    const statCard = createStatCard(gameContext, entity);

    if(statCard) {
        sprite.addChild(statCard, SpriteComponent.SPRITE_ID.CARD);
    }
}