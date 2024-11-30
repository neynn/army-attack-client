import { clampValue } from "../../source/math/math.js";

import { AttackComponent } from "../components/attack.js";
import { HealthComponent } from "../components/health.js";
import { MoveComponent } from "../components/move.js";
import { SpriteComponent } from "../components/sprite.js";
import { TeamComponent } from "../components/team.js";
import { ConstructionComponent } from "../components/construction.js";
import { PositionComponent } from "../components/position.js";
import { DirectionComponent } from "../components/direction.js";
import { ResourceComponent } from "../components/resource.js";

export const componentSetup = {};

componentSetup.setupResourceComponent = function(setup) {
    const resourceComponent = new ResourceComponent();

    return resourceComponent;
}   

componentSetup.setupDirectionComponent = function() {
    const directionComponent = new DirectionComponent();

    return directionComponent;
}

componentSetup.setupPositionComponent = function(setup) {
    const positionComponent = new PositionComponent();
    const { tileX, tileY } = setup;

    positionComponent.positionX = 0;
    positionComponent.positionY = 0;
    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    return positionComponent;
}

componentSetup.setupSpriteComponent = function(sprite) {
    const spriteComponent = new SpriteComponent();

    spriteComponent.spriteID = sprite.id;
    spriteComponent.isFlipped = false;
    
    return spriteComponent;
}

componentSetup.setupConstructionComponent = function(type) {
    const constructionComponent = new ConstructionComponent();

    constructionComponent.stepsRequired = type.constructionSteps;
    constructionComponent.stepsCompleted = 0;
    
    return constructionComponent;
}

componentSetup.setupTeamComponent = function(setup) {
    const teamComponent = new TeamComponent();

    if(setup.team !== undefined) {
        teamComponent.teamID = setup.team;
    }
    
    return teamComponent;
}

componentSetup.setupMoveComponent = function(type, stats) {
    const moveComponent = new MoveComponent();

    if(type.passability !== undefined) {
        for(const passabilityID of type.passability) {
            moveComponent.passability[passabilityID] = true;
        }
    }

    moveComponent.range = stats.moveRange;

    return moveComponent;
}

componentSetup.setupAttackComponent = function(stats) {
    const attackComponent = new AttackComponent();

    attackComponent.damage = stats.damage;
    attackComponent.range = stats.attackRange;

    return attackComponent;
}

componentSetup.setupHealthComponent = function(stats) {
    const healthComponent = new HealthComponent();

    healthComponent.health = stats.health;
    healthComponent.maxHealth = stats.health;

    healthComponent.health = clampValue(healthComponent.health, healthComponent.maxHealth, 1);
    
    return healthComponent;
}