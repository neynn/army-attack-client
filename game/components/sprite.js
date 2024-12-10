export const SpriteComponent = function() {
    this.spriteID = null;
    this.isFlipped = false;
} 

SpriteComponent.create = function(sprite = {}) {
    const spriteComponent = new SpriteComponent();
    const { id } = sprite;

    spriteComponent.spriteID = id ?? null;
    spriteComponent.isFlipped = false;
    
    return spriteComponent;
}