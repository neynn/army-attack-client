import { AvianComponent } from "../components/avian.js";

export const DownSystem = function() {}

DownSystem.downEntity = function(entity) {    
    if(entity.hasComponent(AvianComponent)) {
        const avianComponent = entity.getComponent(AvianComponent);

        avianComponent.state = AvianComponent.STATE_GROUNDED;
    }
}