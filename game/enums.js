export const CLIENT_EVENT = {
    INSTANCE_TEAM: 0,
    INSTANCE_ENTITY_BATCH: 1,
    INSTANCE_MAP: 2,
    INSTANCE_MAP_FROM_DATA: 3,
    INSTANCE_ACTOR: 4,
    ACTION: 5,
    EVENT: 6
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
    FIRE_MISSION: "FireMission"
};

export const GAME_EVENT = {
    REQUEST_DROP_HIT_ITEMS: 0,
    REQUEST_DROP_KILL_ITEMS: 1,
    ITEMS_DROPPED: 2,
    MAKE_CHOICE: 3,
    SKIP_TURN: 4,
    ENTITY_HIT: 5,
    ENTITY_KILLED: 6,
    ENTITY_DOWN: 7,
    TILE_CAPTURED: 8,
    ENTITY_DECAY: 9,
    REQUEST_ENTITY_DEATH: 10
};