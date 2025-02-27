export const Effect = function() {
    this.id = Effect.NEXT_ID++;
}

Effect.NEXT_ID = 0;

Effect.prototype.getID = function() {
    return this.id;
}

Effect.prototype.isFinished = function() {
    return true;
}

Effect.prototype.update = function(context, deltaTime) {
    
}