import { SimpleText } from "../../source/graphics/drawable/simpleText.js";
import { TextStyle } from "../../source/graphics/textStyle.js";
import { getTeamID } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the stat card of an entity.
 */
export const CardSystem = function() {}

CardSystem.CARD_TYPE = {
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
 * Creates the entities stat card.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
const createStatCard = function(gameContext, entity) {
    const { spriteManager } = gameContext;
    const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
    const teamType = gameContext.getTeamType(getTeamID(teamComponent.teamID));
    const cardType = entity.hasComponent(ArmyEntity.COMPONENT.ATTACK) ? CardSystem.CARD_TYPE.LARGE : CardSystem.CARD_TYPE.SMALL;
    const statCard = spriteManager.createSprite(teamType.sprites[cardType]);

    if(statCard) {
        if(cardType === CardSystem.CARD_TYPE.LARGE) {
            addHealthText(entity, statCard);
            addDamageText(entity, statCard);
        } else {
            addHealthText(entity, statCard);
        }
    }

    return statCard;
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

    const statCard = createStatCard(gameContext, entity);

    if(statCard) {
        const { transform2D } = gameContext;
        const { x, y } = transform2D.transformSizeToWorldOffset(entity.config.dimX, entity.config.dimY);
        const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        const sprite = spriteComponent.getSprite(gameContext);
        
        statCard.setPosition(x - transform2D.halfTileWidth, y - transform2D.halfTileHeight);
        sprite.addChild(statCard);
    }
}