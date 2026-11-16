/* Native maps and sprites, with a half-cell simulation independent of rendering. */
(() => {
  const directions = {up:[0,-1], right:[1,0], down:[0,1], left:[-1,0]};
  const overlap = (a,b) => a.x < b.x+2 && a.x+2 > b.x && a.y < b.y+2 && a.y+2 > b.y;
  class Pampuch {
    constructor() { this.level=1; this.score=0; this.lives=5; this.state='ready'; this.events=[]; this.load(); }
    load() {
      this.map=globalThis.PampuchData.levels[(this.level-1)%11];
      this.rings=new Set(); this.tombs=[]; this.time=500; this.ticks=0; this.blocked=0;
      this.map.rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='.')this.rings.add(`${x},${y}`);}));
      // Original maps deliberately include inaccessible decorative rings.
      this.rings.delete('11,16');this.remaining=this.map.target; this.spawn();
    }
    spawn() {
      this.player={x:22,y:32,direction:'right'};
      this.ghosts=[{x:2,y:2,direction:'right'},{x:44,y:2,direction:'down'},
        {x:2,y:32,direction:'left'},{x:44,y:32,direction:'up'}];
    }
    emit(name) { this.events.push(name); }
    takeEvents() { return this.events.splice(0); }
    start() { if(this.state==='ready'){this.state='playing';this.emit('start');} }
    canMove(actor,direction) {
      const [dx,dy]=directions[direction], next={x:actor.x+dx,y:actor.y+dy};
      for(let y=Math.floor(next.y/2);y<=Math.floor((next.y+1)/2);y++)
        for(let x=Math.floor(next.x/2);x<=Math.floor((next.x+1)/2);x++)
          if(this.map.rows[y]?.[x]!=='.')return false;
      return !this.tombs.some(t=>overlap(next,t));
    }
    move(actor,direction) {
      if(!this.canMove(actor,direction))return false;
      const [dx,dy]=directions[direction];actor.x+=dx;actor.y+=dy;actor.direction=direction;return true;
    }
    turn(direction) { if(directions[direction])this.player.direction=direction; }
    collect() {
      // Collect at the leading half-step, before reaching the centre of the cell.
      const p=this.player;
      for(const key of this.rings) {
        const [x,y]=key.split(',').map(Number);
        if(Math.abs(p.x-x*2)+Math.abs(p.y-y*2)>1)continue;
        this.rings.delete(key);this.remaining--;this.score++;this.time=Math.min(9999,this.time+4);this.emit('ring');
      }
      if(this.remaining<=0){this.state='level';this.emit('level');}
    }
    ghostMove(ghost) {
      // Translate the original direction-first chase: only turn after a blockage.
      let direction=ghost.direction;
      for(let attempt=0;attempt<5;attempt++) {
        if(this.move(ghost,direction)){this.blocked=0;return;}
        this.blocked=(this.blocked+1)%5;if(this.blocked===0)return;
        if(direction==='left'||direction==='right')
          direction=this.player.y<ghost.y?'up':'down';
        else direction=this.player.x<ghost.x?'left':'right';
      }
    }
    die() {
      if(this.state!=='playing')return;
      this.tombs.push({x:this.player.x,y:this.player.y});this.lives--;this.state=this.lives?'dead':'over';this.emit('death');
    }
    continue() {
      if(this.state==='dead'){this.spawn();this.state='playing';this.emit('start');}
      else if(this.state==='level'){
        if(((this.level-1)%11+1)%4===0)this.lives++;this.level++;
        this.load();this.state='playing';this.emit('start');
      }
    }
    tick() {
      if(this.state!=='playing')return;
      this.ticks++;if(this.time===0){this.lives=1;this.die();return;}this.time--;
      if(this.move(this.player,this.player.direction))this.emit('step');
      if(this.ghosts.some(g=>overlap(g,this.player))){this.die();return;}
      this.collect();if(this.state!=='playing')return;
      for(const ghost of this.ghosts){this.ghostMove(ghost);if(overlap(ghost,this.player)){this.die();return;}}
    }
    snapshot() { return {version:1,level:this.level,score:this.score,lives:this.lives,state:this.state,
      player:this.player,ghosts:this.ghosts,rings:[...this.rings],tombs:this.tombs,time:this.time,
      ticks:this.ticks,remaining:this.remaining,blocked:this.blocked}; }
    static restore(value) {
      if(!value||value.version!==1)return null;
      const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
      if(!integer(value.level,1,10000)||!integer(value.score,0,1e9)||!integer(value.lives,0,10000)||
        !integer(value.time,0,9999)||!integer(value.ticks,0,1e9)||!integer(value.remaining,0,432)||
        !integer(value.blocked,0,4)||!['ready','playing','paused','dead','over','level'].includes(value.state))return null;
      const actor=p=>p&&integer(p.x,0,46)&&integer(p.y,0,34);
      if(!actor(value.player)||!directions[value.player.direction]||!Array.isArray(value.ghosts)||value.ghosts.length!==4||
        !value.ghosts.every(p=>actor(p)&&directions[p.direction])||!Array.isArray(value.tombs)||!value.tombs.every(actor)||
        !Array.isArray(value.rings)||value.rings.length>432)return null;
      const game=new Pampuch();game.level=value.level;game.load();
      if(!value.rings.every(key=>typeof key==='string'&&game.rings.has(key)))return null;
      for(const key of ['level','score','lives','state','player','ghosts','tombs','time','ticks','remaining','blocked'])game[key]=value[key];
      game.rings=new Set(value.rings);game.events=[];
      if(game.state==='playing')game.state='paused';return game;
    }
  }
  globalThis.Pampuch=Pampuch;
})();
