export const GAME_EVENTS = Object.freeze({
    "INSTANCE_TEAM": 0,
    "INSTANCE_ENTITY": 1,
    "INSTANCE_ENTITY_BATCH": 2,
    "INSTANCE_MAP": 3,
    "INSTANCE_MAP_FROM_DATA": 4,
    "INSTANCE_CONTROLLER": 5,
    "ACTION": 6,
    "ACTION_BATCH": 7
});

export const EVENT_TYPES = Object.freeze({
    "CLIENT": "Client",
    "COUNTER": "Counter",
    "CONTROL": "Control",
    "RESOURCES_CONSUME": "ResourcesConsume",
    "ITEMS_CONSUME": "ItemsConsume",
    "ITEMS_OWN": "ItemsOwn",
    "MILESTONE": "Milestone"
});

export const ACTION_TYPES = Object.freeze({
    "MOVE": "Move",
    "ATTACK": "Attack",
    "CONSTRUCTION": "Construction",
    "COUNTER_ATTACK": "CounterAttack",
    "COUNTER_MOVE": "CounterMove"
});

export const CAMERA_TYPES = Object.freeze({
    "ARMY_CAMERA": "ARMY_CAMERA"
});