export const CLIENT_EVENT = {
    INSTANCE_TEAM: 0,
    INSTANCE_ENTITY_BATCH: 1,
    INSTANCE_MAP: 2,
    INSTANCE_MAP_FROM_DATA: 3,
    INSTANCE_ACTOR: 4,
    INSTANCE_GAME: 6,
    EVENT: 5
};

export const EVENT_TYPE = {
    CLIENT: "Client",
    COUNTER: "Counter",
    CONTROL: "Control",
    RESOURCES_CONSUME: "ResourcesConsume",
    ITEMS_CONSUME: "ItemsConsume",
    ITEMS_OWN: "ItemsOwn",
    MILESTONE: "Milestone"
};

export const ACTION_TYPE = {
    MOVE: "Move",
    ATTACK: "Attack",
    CONSTRUCTION: "Construction",
    COUNTER_ATTACK: "CounterAttack",
    COUNTER_MOVE: "CounterMove",
    DEATH: "Death",
    FIRE_MISSION: "FireMission",
    CLEAR_DEBRIS: "ClearDebris",
    HEAL: "Heal"
};

export const ACTOR_ID = {
    STORY_PLAYER: "PLAYER",
    STORY_ENEMY: "ENEMY"
};

export const TEAM_TYPE = {
    ALLIES: "Allies",
    CRIMSON: "Crimson",
    NEUTRAL: "Neutral",
    VERSUS: "Versus"
};

export const TEAM_ID = {
    CRIMSON: 0,
    ALLIES: 1,
    NEUTRAL: 2,
    VERSUS: 3
};

export const TILE_TYPE = {
    GROUND: 0,
    MOUNTAIN: 1,
    SEA: 2,
    SHORE: 3
};

export const OBJECTIVE_TYPE = {
    DESTROY: "Destroy",
    CONQUER: "Conquer"
}

export const getTeamName = function(id) {
    switch(id) {
        case TEAM_ID.CRIMSON: return TEAM_TYPE.CRIMSON;
        case TEAM_ID.ALLIES: return TEAM_TYPE.ALLIES;
        case TEAM_ID.NEUTRAL: return TEAM_TYPE.NEUTRAL;
        case TEAM_ID.VERSUS: return TEAM_TYPE.VERSUS;
        default: return TEAM_TYPE.NEUTRAL;
    }
}

export const getTeamID = function(name) {
    switch(name) {
        case TEAM_TYPE.CRIMSON: return TEAM_ID.CRIMSON;
        case TEAM_TYPE.ALLIES: return TEAM_ID.ALLIES;
        case TEAM_TYPE.NEUTRAL: return TEAM_ID.NEUTRAL;
        case TEAM_TYPE.VERSUS: return TEAM_ID.VERSUS;
        default: return TEAM_ID.NEUTRAL;
    }
}