import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/textStyle.js";
import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the stat card of an entity.
 */
export const CardSystem = function() {}

CardSystem.SPRITE_TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

/**
 * Adds a health text to an entity.
 * 
 * @param {*} entity 
 * @param {*} statCard 
 */
const addHealthText = function(entity, statCard) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const healthText = new SimpleText();
    
    healthText.style.setFontType("ArmyAttack Arial");
    healthText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    healthText.setPosition(95, 90);
    healthText.setText(`${healthComponent.health}/${healthComponent.maxHealth}`);

    statCard.addChild(healthText);
    entity.events.on(ArmyEntity.EVENT.HEALTH_UPDATE, (health, maxHealth) => healthText.setText(`${health}/${maxHealth}`));
}

/**
 * Adds a damage text to an entity.
 * 
 * @param {*} entity 
 * @param {*} statCard 
 */
const addDamageText = function(entity, statCard) {
    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const damageText = new SimpleText();

    damageText.style.setFontType("ArmyAttack Arial");
    damageText.style.setAlignment(TextStyle.TEXT_ALIGNMENT.RIGHT);

    damageText.setPosition(95, 78);
    damageText.setText(`${attackComponent.damage}`);

    statCard.addChild(damageText);
    entity.events.on(ArmyEntity.EVENT.DAMAGE_UPDATE, (damage) => damageText.setText(`${damage}`));
}

/**
 * Creates an attacker card consisting of damage & health.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {string} cardType 
 * @returns 
 */
const createAttackerCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType);

    if(!statCard) {
        return null;
    }

    addHealthText(entity, statCard);
    addDamageText(entity, statCard);

    return statCard;
}

/**
 * Creates a normal card consisting of health.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {string} cardType 
 * @returns 
 */
const createNormalCard = function(gameContext, entity, cardType) {
    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(cardType);

    if(!statCard) {
        return null;
    }

    addHealthText(entity, statCard);

    return statCard;
}

/**
 * Gets the card sprites used by the team.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
const getTeamSprites = function(gameContext, entity) {
    const { teamID } = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const teamType = gameContext.teamTypes[teamID];

    if(!teamType) {
        return null;
    }

    const teamSprites = teamType.sprites;

    return teamSprites;
}

/**
 * Gets the cards offset relative to the entities sprite.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns {{x: int, y: int}}
 */
const getCardOffset = function(gameContext, entity) {
    const { transform2D } = gameContext;
    const { x, y } = transform2D.transformSizeToWorldOffset(entity.config.dimX, entity.config.dimY);

    return {
        "x": x - 48,
        "y": y - 48
    }
}

/**
 * Creates the entities stat card.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
const createStatCard = function(gameContext, entity) {
    const teamSprites = getTeamSprites(gameContext, entity);
    
    if(!teamSprites) {
        return null;
    }

    if(entity.hasComponent(ArmyEntity.COMPONENT.ATTACK)) {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.LARGE];

        if(statCardType) {
            return createAttackerCard(gameContext, entity, statCardType);
        }        
    } else {
        const statCardType = teamSprites[CardSystem.SPRITE_TYPE.SMALL];

        if(statCardType) {
            return createNormalCard(gameContext, entity, statCardType);
        }
    }

    return null;
}

/**
 * Creates and attaches the stat card to the entity.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
CardSystem.generateStatCard = function(gameContext, entity) {
    if(entity.config.disableCard) {
        return;
    }

    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const sprite = spriteComponent.getSprite(gameContext);
    const statCard = createStatCard(gameContext, entity);

    if(statCard) {
        const { x, y } = getCardOffset(gameContext, entity);

        statCard.setPosition(x, y);
        sprite.addChild(statCard);
    }
}