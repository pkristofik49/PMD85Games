/* Render native screen memory, including byte probes, XOR sprites and the ROM font. */
(() => {
  function render(ctx,game){
    const frame=ctx.createImageData(288,256),memory=game.machine.memory;
    for(let y=0;y<256;y++)for(let column=0;column<48;column++){
      const byte=memory[0xc000+y*64+column];
      for(let bit=0;bit<6;bit++){
        const p=(y*288+column*6+bit)*4,on=byte&(1<<bit);
        frame.data[p]=on?238:0;frame.data[p+1]=on?238:0;frame.data[p+2]=on?222:0;frame.data[p+3]=255;
      }
    }
    // The native keyboard scanner redraws open/closed poses many times per step.
    // Do not expose those intermediate writes as a browser-rate mouth animation.
    if(game.pose?.visible){
      const address=game.machine.word(0x0c6a),offset=address-0xc000;
      const source=[0,0x0d10,0x0cf8,0x0d28,0x0ce0][memory[0x0c69]];
      if(source&&offset>=0&&offset<16384){
        const sprite=source+(game.pose.closed?0x60:0),x=(offset&63)*6,y=Math.floor(offset/64);
        for(let dy=0;dy<12;dy++)for(let dx=0;dx<12;dx++){
          if(x+dx>=288||y+dy>=256)continue;
          const p=((y+dy)*288+x+dx)*4,on=memory[sprite+dy*2+Math.floor(dx/6)]&(1<<(dx%6));
          frame.data[p]=on?238:0;frame.data[p+1]=on?238:0;frame.data[p+2]=on?222:0;
        }
      }
    }
    ctx.putImageData(frame,0,0);
  }
  globalThis.PampuchRender={render};
})();
