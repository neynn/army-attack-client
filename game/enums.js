export const GAME_EVENTS = Object.freeze({
    "INSTANCE_ENTITY": "INSTANCE_ENTITY",
    "INSTANCE_ENTITY_BATCH": "INSTANCE_ENTITY_BATCH",
    "INSTANCE_MAP": "INSTANCE_MAP",
    "INSTANCE_MAP_FROM_DATA": "INSTANCE_MAP_FROM_DATA",
    "INSTANCE_CONTROLLER": "INSTANCE_CONTROLLER",
    "ENTITY_ACTION": "ENTITY_ACTION",
    "ENTITY_DEATH": "ENTITY_DEATH",
    "DROP_ITEM": "DROP_ITEM"
});

export const ENTITY_ARCHETYPES = Object.freeze({
    "UNIT": "Unit",
    "DEFENSE": "Defense",
    "DECO": "Deco",
    "BUILDING": "Building",
    "CONSTRUCTION": "Construction",
    "HFE": "HFE",
    "TOWN": "Town"
});

export const CONTROLLER_TYPES = Object.freeze({
    "PLAYER": "PLAYER",
    "EDITOR": "EDITOR"
});

export const SYSTEM_TYPES = Object.freeze({
    "DOWN": "DOWN",
    "MOVE": "MOVE"
});

export const ACTION_TYPES = Object.freeze({
    "MOVE": "MOVE",
    "ATTACK": "ATTACK",
    "CONSTRUCTION": "CONSTRUCTION"
});

export const CONTROLLER_STATES = Object.freeze({
    "IDLE": "IDLE",
    "BUILD": "BUILD",
    "SELECTED": "SELECTED"
});

export const CONTEXT_STATES = Object.freeze({
    "MAIN_MENU": "MAIN_MENU",
    "STORY_MODE": "STORY_MODE",
    "STORY_MODE_INTRO": "STORY_MODE_INTRO",
    "STORY_MODE_PLAY": "STORY_MODE_PLAY",
    "VERSUS_MODE": "VERSUS_MODE",
    "VERSUS_MODE_LOBBY": "VERSUS_MODE_LOBBY",
    "VERSUS_MODE_PLAY": "VERSUS_MODE_PLAY",
    "EDIT_MODE": "EDIT_MODE"
});

export const ENTITY_EVENTS = Object.freeze({
    "POSITION_UPDATE": "POSITION_UPDATE",
    "DIRECTION_UPDATE": "DIRECTION_UPDATE",
    "SPRITE_UPDATE": "SPRITE_UPDATE",
    "HEALTH_UPDATE": "HEALTH_UPDATE",
    "DAMAGE_UPDATE": "DAMAGE_UPDATE",
    "DAMAGE_TAKEN": "DAMAGE_TAKEN",
    "DEATH": "DEATH"
});

export const CONTROLLER_EVENTS = Object.freeze({
    "CLICK": "CLICK",
    "SELECT": "SELECT"
});

export const CAMERAS = Object.freeze({
    "ARMY_CAMERA": "ARMY_CAMERA"
});

export const CAMERA_TYPES = Object.freeze({
    "ARMY_ATTACK": "ARMY_ATTACK"
});

export const ENTITY_STATES = Object.freeze({
    "IDLE": 0,
    "DOWN": 1,
    "DEAD": 2
});