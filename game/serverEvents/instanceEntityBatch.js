import { SpawnSystem } from "../systems/spawn.js";

export const instanceEntityBatch = function(gameContext, payload) {
    const { batch } = payload;
    
    batch.forEach(setup => SpawnSystem.createEntity(gameContext, setup));
}