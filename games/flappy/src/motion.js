// Presentation-only interpolation. Game coordinates, collisions and ticks stay discrete.
export class Motion {
  constructor(){this.reset()}
  reset(game){this.time=0;this.states=new WeakMap();this.effects=new WeakMap();if(game)this.capture(game)}
  advance(delta){this.time+=Math.max(0,delta)}
  effectAge(effect){return this.effects.has(effect)?(this.time-this.effects.get(effect))/120:null}
  position(entity){
    const state=this.states.get(entity);
    if(!state)return {...entity,progress:1,moving:false};
    const progress=Math.min(1,Math.max(0,(this.time-state.started)/state.duration));
    return {x:state.from.x+(state.to.x-state.from.x)*progress,y:state.from.y+(state.to.y-state.from.y)*progress,progress,moving:progress<1,dx:state.to.x-state.from.x,dy:state.to.y-state.from.y};
  }
  capture(game){
    for(const effect of game.debris)if(!this.effects.has(effect))this.effects.set(effect,this.time);
    for(const entity of [game.player,...game.rocks,...game.enemies,...game.corpses,...game.shots]){
      const previous=this.states.get(entity),to={x:entity.x,y:entity.y};
      if(!previous||entity.crushed||game.state==='dead'){
        this.states.set(entity,{from:to,to,started:this.time-1,duration:1});continue;
      }
      if(previous.to.x===to.x&&previous.to.y===to.y)continue;
      const from=this.position(entity),duration=entity.type==='frog'?180:entity.type==='ghost'?150:120;
      this.states.set(entity,{from,to,started:this.time,duration});
    }
  }
}
