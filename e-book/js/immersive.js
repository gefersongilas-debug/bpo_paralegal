/* V14 / B: GSAP + ScrollTrigger when installed, equivalent native fallback. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progressBar = document.getElementById('reading-progress');
  const clamp = n => Math.min(1, Math.max(0, n));
  const smooth = n => { n=clamp(n); return n*n*(3-2*n); };
  const track = (event, extra={}) => { window.dataLayer=window.dataLayer||[]; window.dataLayer.push({event,lp_variant:'B',...extra}); };
  let stopMotion = () => {};
  const formIsOpen=()=>document.body.classList.contains("form-open");
  let initialHeadlinePlayed=false;
  const compact = matchMedia('(max-height: 400px)');
  function split(el) {
    const original=el.innerHTML;
    const spoken=document.createElement('span');spoken.className='sr-only';spoken.textContent=el.textContent;
    const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');
    while(el.firstChild)visual.append(el.firstChild);
    const walker=document.createTreeWalker(visual,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    const chars=[];
    nodes.forEach(node=>{const frag=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{
      if(!word)return;if(/^\s+$/.test(word)){frag.append(document.createTextNode(word));return;}
      const wrap=document.createElement('span');wrap.className='reveal-word';
      Array.from(word).forEach(ch=>{const span=document.createElement('span');span.className='reveal-char';span.textContent=ch;chars.push(span);wrap.append(span);});frag.append(wrap);
    });node.replaceWith(frag);});el.append(spoken,visual);return {el,original,chars};
  }
  function type(group,p){
    const count=clamp(p)*group.chars.length, old=group.last??0;
    if(old===count)return;group.last=count;
    const lo=Math.max(0,Math.floor(Math.min(old,count))), hi=Math.min(group.chars.length-1,Math.floor(Math.max(old,count)));
    for(let i=lo;i<=hi;i++){const a=clamp(count-i),char=group.chars[i];char.style.opacity=a.toFixed(3);char.style.filter=a>0&&a<1?`blur(${(4*(1-a)).toFixed(1)}px)`:'none';}
  }
  function initMotion(){
    if(formIsOpen())return;
    stopMotion();if(reduced.matches||compact.matches)return;
    const trackEl=document.querySelector('.story-track'),stage=document.querySelector('.story-stage'),cue=document.querySelector('.stage-cue');
    const scenes=[...stage.querySelectorAll('.scene')].map(scene=>({scene,parts:null}));
    const count=scenes.length;
    const currentLabel=document.getElementById('scene-position');
    const finalButton=document.getElementById('start-guide');
    const finalGroup=stage.querySelector('.final-focus-group');
    document.body.classList.add('pinned-story');
    // Fixed stage and independent scroll spacer: the viewport never travels with the document.
    let travelPx=1;
    function size(){trackEl.style.setProperty('--story-travel',`${stage.clientHeight*count}px`);travelPx=Math.max(1,document.documentElement.scrollHeight-innerHeight);}
    size();
    const travel=()=>travelPx;
    const headline=stage.querySelector(".hero-title");
    if(!initialHeadlinePlayed){headline.classList.add("headline-focus-in");initialHeadlinePlayed=true;}
    let previous=-1;
    function paint(p){
      if(formIsOpen())return;
      const scaled=clamp(p)*count,index=Math.min(count-1,Math.floor(scaled)),t=scaled-index;
      if(previous!==index){scenes.forEach((g,i)=>{g.scene.classList.toggle('is-current',i===index);g.scene.inert=i!==index;if(i!==index)g.scene.style.opacity='0';});previous=index;currentLabel.textContent=`0${index+1} / 0${count}`;document.dispatchEvent(new Event('bpo:scene'));}
      const group=scenes[index];
      if(!group.parts)group.parts=[...group.scene.querySelectorAll('.reveal-text')].map(split);
      const enter=index===0?1:smooth(t/.15),exit=index===count-1?0:smooth((t-.78)/.22);
      group.scene.style.opacity=(enter*(1-exit)).toFixed(3);
      const blur=7*(1-enter)+10*exit;group.scene.style.filter=blur>.05?`blur(${blur.toFixed(2)}px)`:'none';
      const total=group.parts.reduce((sum,part)=>sum+part.chars.length,0);let offset=0;
      // Only the following chapters are typed. Headline is always one intact typographic block.
      const reveal=clamp((t-.025)/.58);
      group.parts.forEach(part=>{type(part,(reveal*total-offset)/Math.max(1,part.chars.length));offset+=part.chars.length;});
      // Final CTA uses one whole-block focus reveal, reversible with scroll.
      const final=index===count-1;
      const focus=final?smooth(t/.28):0;
      if(final){finalGroup.style.transform=`scale(${1+.19*(1-focus)})`;finalGroup.style.filter=focus<.999?`blur(${17*(1-focus)}px)`:'none';}
      if(final){group.scene.style.opacity=String(focus);group.scene.style.filter='none';}
      finalButton.inert=!final||focus<.95;
      finalButton.style.pointerEvents=final&&focus>=.95?'auto':'none';
      document.body.classList.toggle('final-scene-active',final);
      cue.style.opacity=String(final?1-smooth(t/.4):1);
      cue.inert=final&&t>.30;
    }
    function pageProgress(y=scrollY){progressBar.style.transform=`scaleX(${clamp(y/travel())})`;}
    function actual(){return clamp(scrollY/travel());}
    paint(actual());pageProgress();
    let cleanup;
    if(window.gsap&&window.ScrollTrigger){
      const gsap=window.gsap,ST=window.ScrollTrigger;gsap.registerPlugin(ST);
      const state={p:actual()};
      const ctx=gsap.context(()=>{gsap.fromTo(state,{p:0},{p:1,ease:'none',onUpdate:()=>paint(state.p),scrollTrigger:{trigger:trackEl,start:'top top',end:()=>`+=${travel()}`,scrub:.35,invalidateOnRefresh:true}});});
      const resize=()=>{if(!formIsOpen()){size();ST.refresh();}};const scroll=()=>pageProgress();
      addEventListener('resize',resize);addEventListener('scroll',scroll,{passive:true});
      if(document.fonts)document.fonts.ready.then(()=>{if(document.body.classList.contains('pinned-story'))resize();});
      cleanup=()=>{ctx.revert();removeEventListener('resize',resize);removeEventListener('scroll',scroll);};document.documentElement.dataset.motionEngine='gsap';
    }else{
      let raf=0,last=0,visual=actual(),target=visual;
      function tick(now){const dt=last?Math.min(50,now-last):16;last=now;visual+=(target-visual)*(1-Math.exp(-dt/95));if(Math.abs(target-visual)<.00004)visual=target;paint(visual);pageProgress();if(visual!==target)raf=requestAnimationFrame(tick);else{raf=0;last=0;}}
      function schedule(){target=actual();if(!raf)raf=requestAnimationFrame(tick);}
      function resize(){if(!formIsOpen()){size();schedule();}}
      addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);if(document.fonts)document.fonts.ready.then(()=>{if(document.body.classList.contains('pinned-story'))resize();});
      cleanup=()=>{cancelAnimationFrame(raf);removeEventListener('scroll',schedule);removeEventListener('resize',resize);};document.documentElement.dataset.motionEngine='native';
    }
    stopMotion=()=>{cleanup();document.body.classList.remove('pinned-story');trackEl.style.removeProperty('--story-travel');scenes.forEach(g=>{g.scene.classList.remove('is-current');g.scene.inert=false;g.scene.removeAttribute('style');g.parts?.forEach(part=>part.el.innerHTML=part.original);});cue.removeAttribute('style');cue.inert=false;headline.classList.remove('headline-focus-in');finalGroup.removeAttribute('style');finalButton.removeAttribute('style');finalButton.inert=false;document.body.classList.remove('final-scene-active');progressBar.removeAttribute('style');delete document.documentElement.dataset.motionEngine;stopMotion=()=>{};};
  }
  document.querySelector('.stage-cue').addEventListener('click',()=>{
    if(!formIsOpen())window.scrollBy({top:Math.max(180,innerHeight*.45),behavior:reduced.matches?'instant':'smooth'});
  });
  initMotion();if(reduced.addEventListener)reduced.addEventListener('change',initMotion);if(compact.addEventListener)compact.addEventListener('change',initMotion);
  // Wizard — one question per screen, no partial submissions or lead data in analytics.
  const form=document.getElementById('immersive-form');
  const steps=[...form.querySelectorAll('.wizard-step')], next=document.getElementById('wizard-next'), back=document.getElementById('wizard-back'), label=next.querySelector('span'), status=document.getElementById('form-status');
  const modal=document.getElementById('formulario'), start=document.getElementById('start-guide'), close=document.getElementById('wizard-close'), fill=document.getElementById('form-progress-fill'), progress=document.getElementById('form-progress');
  const local=location.protocol==='file:';let step=0,busy=false,opener=null,lockedY=0,closing=false,focusTimer=0;
  function setProgress(value){fill.style.width=`${value}%`;progress.setAttribute('aria-valuenow',String(value));}
  document.querySelector('.header-cta').addEventListener('click',e=>{
    if(!document.body.classList.contains('pinned-story'))return;
    e.preventDefault();const story=document.querySelector('.story-track'),stage=document.querySelector('.story-stage');
    window.scrollTo({top:document.documentElement.scrollHeight-innerHeight,behavior:reduced.matches?'instant':'smooth'});
  });
  function openForm(){
    if(modal.open||closing)return;
    opener=document.activeElement;lockedY=scrollY;
    document.documentElement.classList.add('form-lock');document.body.classList.add('form-open');document.dispatchEvent(new Event('bpo:form'));
    showStep(step,false);modal.classList.remove('wizard-leaving');modal.showModal();
    // Initial focus stays on a fixed control, avoiding mobile keyboard and browser scroll jumps.
    close.focus({preventScroll:true});
    if(matchMedia('(hover: hover) and (pointer: fine)').matches){focusTimer=setTimeout(()=>{if(modal.open&&!closing)steps[step].querySelector('input').focus({preventScroll:true});},reduced.matches?0:620);}
    track('ebook_form_start');
  }
  function closeForm(){
    if(busy||closing||!modal.open)return;
    clearTimeout(focusTimer);closing=true;modal.classList.add('wizard-leaving');
    setTimeout(()=>{modal.close();},reduced.matches?0:220);
  }
  start.addEventListener('click',openForm);close.addEventListener('click',closeForm);
  modal.addEventListener('cancel',e=>{e.preventDefault();closeForm();});
  modal.addEventListener('close',()=>{
    clearTimeout(focusTimer);closing=false;modal.classList.remove('wizard-leaving');
    document.documentElement.classList.remove('form-lock');document.body.classList.remove('form-open');document.dispatchEvent(new Event('bpo:form'));
    window.scrollTo({top:lockedY,behavior:'instant'});
    if(opener&&opener.isConnected)opener.focus({preventScroll:true});
    if((!compact.matches&&!reduced.matches)!==document.body.classList.contains('pinned-story'))initMotion();
    window.dispatchEvent(new Event('scroll'));
  });
  const config=window.BPO_CONFIG||{};
  document.querySelectorAll('.privacy-link').forEach(a=>{if(!config.privacyPolicyUrl)return;try{const url=new URL(config.privacyPolicyUrl);if(url.protocol==='https:'){a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';}}catch(_){}});
  if(local){const note=document.createElement('p');note.className='local-preview';note.textContent='Prévia local: o formulário permite testar as etapas e o download sem enviar dados.';form.prepend(note);}
  form.noValidate=true;
  function showStep(index,focus=false){
    step=index;steps.forEach((panel,i)=>{panel.hidden=i!==step;panel.classList.toggle('step-enter',i===step&&focus);});
    back.hidden=step===0;label.textContent=step===steps.length-1?'BAIXAR O GUIA GRATUITO':'CONTINUAR';
    setProgress(step/steps.length*100);document.getElementById('step-announcement').textContent=`Etapa ${step+1} de ${steps.length}`;
    status.hidden=true;if(focus){steps[step].querySelector('input').focus({preventScroll:true});track('ebook_form_step',{step:step+1});}
  }
  function validate(index){const input=steps[index].querySelector('input');input.value=input.value.trim();input.setCustomValidity('');if((input.name==='nome'||input.name==='empresa')&&input.value.length<2)input.setCustomValidity('Preencha este campo com pelo menos 2 caracteres.');if(input.name==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value))input.setCustomValidity('Informe um e-mail válido.');return input;}
  form.addEventListener('input',e=>{if(e.target instanceof HTMLInputElement)e.target.setCustomValidity('');});
  back.addEventListener('click',()=>{if(!busy&&step>0)showStep(step-1,true);});
  const params=new URLSearchParams(location.search), attribution={};['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','fbclid','msclkid'].forEach(k=>attribution[k]=(params.get(k)||'').slice(0,500));
  const referrer=()=>{try{return new URL(document.referrer).origin;}catch(_){return '';}};
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;
    const current=validate(step);if(!current.reportValidity())return;
    if(step<steps.length-1){showStep(step+1,true);return;}
    for(let i=0;i<steps.length;i++){const input=validate(i);if(!input.validity.valid){showStep(i,true);input.reportValidity();return;}}
    if(local){setProgress(100);location.assign(new URL('../obrigado/index.html',location.href).href);return;}
    const data=Object.fromEntries(new FormData(form).entries());Object.assign(data,attribution,{pagina_url:(location.origin+location.pathname).slice(0,2048),referrer:referrer(),origem:'LP e-BEF',lp_variant:'B'});
    busy=true;setProgress(100);next.disabled=true;back.disabled=true;close.disabled=true;form.setAttribute('aria-busy','true');label.textContent='ENVIANDO...';status.hidden=true;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
    try{const response=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true)throw new Error(result.message||'Não foi possível enviar seus dados. Tente novamente.');track('generate_lead');location.assign('/e-book/obrigado');}
    catch(err){status.textContent=err.name==='AbortError'?'O envio demorou mais que o esperado. Tente novamente.':err.message==='Failed to fetch'?'Não foi possível conectar. Verifique sua internet e tente novamente.':err.message;status.hidden=false;status.focus();busy=false;setProgress(step/steps.length*100);next.disabled=false;back.disabled=false;close.disabled=false;form.removeAttribute('aria-busy');label.textContent='BAIXAR O GUIA GRATUITO';}finally{clearTimeout(timer);}
  });
  showStep(0);track('ebook_variant_view');
})();
