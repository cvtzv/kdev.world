(function(){
  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  let W = 0, H = 0;
  function resize(){
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize, {passive:true});
  resize();

  const STAR_COUNT = Math.max(20, Math.floor((W * H) / 2200));
  const stars = [];
  function rnd(a=0,b=1){return a+Math.random()*(b-a)}
  function choice(arr){return arr[(Math.random()*arr.length)|0]}
  function makeStar(){return {x:rnd(0,W),y:rnd(0,H),r:rnd(0.3,1.6),phase:rnd(0,Math.PI*2),speed:rnd(0.002,0.01),parallax:choice([0.1,0.2,0.3,0.4])}}
  for(let i=0;i<STAR_COUNT;i++)stars.push(makeStar());

  const meteors = [];
  let meteorTimer = 0;

  function spawnMeteor(){
    const startX = rnd(-W*0.2, W*0.8);
    const startY = rnd(-H*0.4, -20);
    const speed = rnd(8,16);
    const angle = rnd(Math.PI*0.15, Math.PI*0.35);
    meteors.push({x:startX,y:startY,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:rnd(0.7,1.5),age:0,len:rnd(80,160)});
  }

  const blob = document.getElementById('blob');
  const blobState = {x:W*0.5,y:H*0.5,vx:rnd(60,120)*(Math.random()<0.5?-1:1),vy:rnd(60,120)*(Math.random()<0.5?-1:1),size:30,pulsePhase:0};

  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.05,(now-last)/1000);
    last = now;
    ctx.clearRect(0,0,W,H);

    ctx.fillStyle = '#ffffff';
    for(let s of stars){
      s.phase += s.speed;
      s.x -= s.parallax*dt*8;
      if(s.x < -2) s.x = W + 2;
      const tw = (Math.sin(s.phase)+1)/2;
      const alpha = tw*0.95 + 0.25;
      ctx.globalAlpha = Math.min(1, Math.max(0.15, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    meteorTimer -= dt;
    if(meteorTimer <= 0){ spawnMeteor(); meteorTimer = rnd(0.8,3.0); }
    for(let i = meteors.length-1;i>=0;i--){
      const m = meteors[i];
      m.age += dt;
      m.x += m.vx*dt;
      m.y += m.vy*dt;
      const dir = Math.atan2(m.vy, m.vx);
      const dx = Math.cos(dir);
      const dy = Math.sin(dir);
      const tailX = m.x - dx*m.len;
      const tailY = m.y - dy*m.len;
      const grd = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grd.addColorStop(0, 'rgba(200,182,255,0)');
      grd.addColorStop(0.6, 'rgba(200,182,255,0.35)');
      grd.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      if(m.age > m.life || m.x > W + 200 || m.y > H + 200) meteors.splice(i,1);
    }

    blobState.x += blobState.vx*dt;
    blobState.y += blobState.vy*dt;
    const B = blobState.size;
    if(blobState.x < B){ blobState.x = B; blobState.vx *= -1 }
    if(blobState.x > W - B){ blobState.x = W - B; blobState.vx *= -1 }
    if(blobState.y < B){ blobState.y = B; blobState.vy *= -1 }
    if(blobState.y > H - B){ blobState.y = H - B; blobState.vy *= -1 }

    blobState.pulsePhase += dt*2;
    const pulse = 1 + 0.25*Math.sin(blobState.pulsePhase);
    const scaleSize = blobState.size*2*pulse;
    blob.style.width = scaleSize + 'px';
    blob.style.height = scaleSize + 'px';
    blob.style.transform = 'translate3d(' + (blobState.x - scaleSize/2) + 'px,' + (blobState.y - scaleSize/2) + 'px,0)';

    requestAnimationFrame(loop);
  }

  function initBlob(){
    const rect = blob.getBoundingClientRect();
    blobState.size = rect.width * 0.5;
  }
  initBlob();
  requestAnimationFrame(function(t){ last = t; loop(t); });
})();