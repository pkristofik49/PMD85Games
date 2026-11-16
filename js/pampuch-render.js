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
    ctx.putImageData(frame,0,0);
  }
  globalThis.PampuchRender={render};
})();
