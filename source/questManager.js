import { EventEmitter } from "./events/eventEmitter.js";

export const QuestManager = function() {
    this.questTypes = new Map();

    this.events = new EventEmitter();
    this.events.listen(QuestManager.EVENT_BROADCAST);
    this.events.listen(QuestManager.EVENT_COMPLETED);
}

QuestManager.EVENT_BROADCAST = "EVENT_BROADCAST";
QuestManager.EVENT_COMPLETED = "EVENT_COMPLETED";

QuestManager.prototype.load = function() {

}

QuestManager.prototype.registerQuest = function(typeID, type) {

}
