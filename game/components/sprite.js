export const SpriteComponent = function() {
    this.spriteID = null;
} 

SpriteComponent.create = function(sprite = {}) {
    const spriteComponent = new SpriteComponent();
    const { id } = sprite;

    spriteComponent.spriteID = id ?? null;
    
    return spriteComponent;
}