(() => {
  const sprites=globalThis.PampuchData.sprites;
  function sprite(ctx,name,x,y){ctx.fillStyle='#eeeede';sprites[name].forEach((row,dy)=>[...row].forEach((v,dx)=>{if(v==='1')ctx.fillRect(x+dx,y+dy,1,1);}));}
  function render(ctx,game,best=0){
    ctx.fillStyle='#000';ctx.fillRect(0,0,288,256);
    for(let n=0;n<game.lives-1&&n<15;n++)sprite(ctx,'playerRight',n*18,8);
    game.map.rows.forEach((row,y)=>[...row].forEach((cell,x)=>{
      if(cell==='#')sprite(ctx,'wall',x*12,y*12+24);
      else if(game.rings.has(`${x},${y}`))sprite(ctx,'ring',x*12,y*12+24);
    }));
    for(const tomb of game.tombs)sprite(ctx,'tomb',tomb.x*6,tomb.y*6+24);
    for(const ghost of game.ghosts)sprite(ctx,'ghost',ghost.x*6,ghost.y*6+24);
    if(!['dead','over'].includes(game.state)){
      const face=game.player.direction[0].toUpperCase()+game.player.direction.slice(1);
      sprite(ctx,'player'+face+(game.ticks%2?'Closed':''),game.player.x*6,game.player.y*6+24);
    }
    const pad=(v,n)=>String(Math.max(0,v)).padStart(n,'0');
    pixelText(ctx,`HIGHS-${pad(best,6)} LEVEL-${pad(game.level,2)} TIME-${pad(game.time,4)}`,2,246);
    pixelText(ctx,pad(game.score,6),252,246);
  }
  globalThis.PampuchRender={render,sprite};
})();
