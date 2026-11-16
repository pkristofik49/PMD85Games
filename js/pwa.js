if('serviceWorker' in navigator && ['http:','https:'].includes(location.protocol)){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)void registration.update().catch(()=>{});});
      window.addEventListener('online',()=>void registration.update().catch(()=>{}));
    }).catch(()=>{/* The games also work without offline installation. */});
  });
}
