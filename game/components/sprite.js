export const SpriteComponent = function() {
    this.spriteID = null;
} 

SpriteComponent.create = function(config = {}) {
    const spriteComponent = new SpriteComponent();
    const {
        id = null
    } = config;

    spriteComponent.spriteID = id;
    
    return spriteComponent;
}