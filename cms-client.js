(function(){
  var section=document.documentElement.getAttribute('data-cms-section');
  if(!section)return;
  var DEFAULTS={
    index:{
      hero_caption:'Success & Integrity',
      hero_captions:['Success & Integrity','A nurturing start for every child','Learning with purpose','Building confident learners','Preparing tomorrow’s leaders'],
      hero_slides:['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgZvIHCkU8nFa6T_EH7sa1pBLXOTFxY1WMDDA55jZV2Qnu9R-KBsyOQOgPwMLsBYuhbqaQP6tgLNmXPi33HcUGWMun5cuCHEyoAGYJk0GLEZal2TYExypL3sbPGm0BR5oMeQLk-KTQ5SdMkqLLaYQJTELeYc9sQLJZ8GmUNIxMIYIXdNP3N3KSR4KJ72Q/s1448/111530.png'],
      achievement_students:'500+',achievement_teachers:'25+',achievement_years:'8+',achievement_pass_rate:'96%',
      social:{facebook:'',youtube:'',whatsapp:''}
    },
    about:{journey_dates:['2016','2021','2022','2023','2026'],p_2:'For years, Triumphant Standard Academy has nurtured excellence, built character, and transformed futures in Umuakuru Igbo Etche, Rivers State.',principal_image:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjAfYFbqwG_D5xaJ6BLucOhZ4dfp7zgwLK6b3lSSRScj_5yp5K8-eHdVNqZ8q_hViFcMXQ1yA9WNCOex46tIjhKSLbSWEo0qmWNQVv0Wpel6Sq9pgn3E6HO5JqrngKDagUqO0pZiRgVcfWYU9PuI6oCoW7v0yrPMWsKRs-tokc2Qupr0eMiMXkyzrqSSik/s1540/111531.png'},
    programs:{items:[{name:'Creche',intro:'A safe, caring and stimulating environment where young children begin developing essential social, emotional and early learning skills.'},{name:'Pre Nursery',intro:'An engaging early-learning stage that helps children build confidence, communication, independence and foundational learning skills through guided activities and play.'},{name:'Nursery',intro:'A strong foundation for young learners, developing early literacy, numeracy, creativity, social skills and a positive attitude toward learning.'},{name:'Primary School',intro:'A well-rounded educational experience that builds strong academic foundations while developing critical thinking, character, creativity and practical skills.'},{name:'Secondary School',intro:'A structured and supportive learning environment that prepares students academically and personally for higher education, future careers and responsible leadership.'}]},
    administration:{administration:[{name:'Charity Itodo',role:'Proprietress',bio:'',image:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWM38V1ltOzLtzmiVbU2M9CBGJRRXB80UvxHlMZJLFnn5OY36auE6Dv7x6rM0rEghAT3l9s8bupYprbAwhIXMwHwJIcdNQsprge3Nh26dD4vZG6hJ5ciKTGarlh0QBrU4elVQzErW_aMKpy6Y6G1fgK3_1pBgTqFSny5GB62tGde90aklUBZ3Lmet4lE/s2048/112086.png'}]}
  };

  function ready(){document.documentElement.classList.remove('cms-loading');document.documentElement.classList.add('cms-ready');}
  function has(obj,key){return Object.prototype.hasOwnProperty.call(obj,key);}
  function apply(data){
    if(!data||typeof data!=='object')return;
    Object.keys(data).forEach(function(key){
      var el=document.querySelector('[data-cms-key="'+CSS.escape(key)+'"]');
      if(el&&typeof data[key]==='string')el.textContent=data[key];
      var img=document.querySelector('[data-cms-image-key="'+CSS.escape(key)+'"]');
      if(img&&typeof data[key]==='string'){
        if(data[key]){img.src=data[key];img.style.visibility='visible';img.style.display='';}
        else{img.removeAttribute('src');img.style.visibility='hidden';img.style.display='none';}
      }
    });
    if(section==='index'){
      renderSlideshow(has(data,'hero_slides')?data.hero_slides:DEFAULTS.index.hero_slides,has(data,'hero_captions')?data.hero_captions:DEFAULTS.index.hero_captions);
      renderSocial(data.social||DEFAULTS.index.social);
    }
    if(section==='administration')renderStaff(has(data,'administration')?data.administration:DEFAULTS.administration.administration);
    if(section==='programs')renderPrograms(has(data,'items')?data.items:DEFAULTS.programs.items);
    if(section==='index'||section==='academics')renderPrograms((data.programs)||DEFAULTS.programs.items);
    if(section==='about')renderJourneyDates(has(data,'journey_dates')?data.journey_dates:DEFAULTS.about.journey_dates);
  }
  function renderStaff(items){
    window.tsaRenderStaff=renderStaff;
    var grid=document.querySelector('[data-cms-staff-grid]');if(!grid)return;grid.innerHTML='';
    (Array.isArray(items)?items:[]).forEach(function(it,i){
      var card=document.createElement('div');card.className='card';card.setAttribute('data-cms-staff-edit',i);card.setAttribute('data-cms-editable-staff','1');
      if(it.image){var img=document.createElement('img');img.src=it.image;img.alt=it.name||'Staff';img.setAttribute('data-cms-staff-image','1');img.style.cssText='width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;margin-bottom:14px;';card.appendChild(img);}
      var role=document.createElement('span');role.setAttribute('data-cms-staff-role','1');role.style.cssText='font-size:12px;color:var(--muted);';role.textContent=it.role||'';card.appendChild(role);
      var h=document.createElement('h3');h.setAttribute('data-cms-staff-name','1');h.textContent=it.name||'';card.appendChild(h);
      var p=document.createElement('p');p.setAttribute('data-cms-staff-bio','1');p.textContent=it.bio||'';card.appendChild(p);grid.appendChild(card);
    });
  }
  function renderPrograms(items){
    var list=Array.isArray(items)?items:(items&&Array.isArray(items.items)?items.items:[]);if(!list.length)list=DEFAULTS.programs.items;
    var byKey={};list.forEach(function(it){var key=String(it.name||'').toLowerCase().replace(/\s+/g,'-');byKey[key]=it;});
    document.querySelectorAll('[data-cms-program-title]').forEach(function(el){var it=byKey[el.getAttribute('data-cms-program-title')];if(it&&it.name)el.textContent=it.name;});
    document.querySelectorAll('[data-cms-program-intro]').forEach(function(el){var it=byKey[el.getAttribute('data-cms-program-intro')];if(it&&it.intro)el.textContent=it.intro;});
  }
  function renderSlideshow(slides,captions){
    window.tsaRenderSlideshow=renderSlideshow;
    if(window.tsaSlideshowTimer){clearInterval(window.tsaSlideshowTimer);window.tsaSlideshowTimer=null;}
    var box=document.querySelector('[data-cms-slideshow]'),target=document.querySelector('[data-cms-slides]'),dots=document.querySelector('[data-cms-slide-dots]'),caption=document.querySelector('[data-cms-slide-caption]');
    if(!box||!target)return;
    var raw=Array.isArray(slides)?slides:[];var capList=Array.isArray(captions)?captions:[];var list=[];
    raw.forEach(function(url,i){if(typeof url==='string'&&url.trim())list.push({url:url,caption:capList[i]||'' ,index:i});});
    target.innerHTML='';if(dots)dots.innerHTML='';
    if(!list.length){if(caption)caption.textContent='';return;}
    list.forEach(function(item,i){var img=document.createElement('img');img.src=item.url;img.alt=item.caption||'Triumphant Standard Academy';img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:'+(i===0?'1':'0')+';transition:opacity .7s ease;';img.setAttribute('data-slide',i);img.setAttribute('data-cms-slideshow-image',item.index);target.appendChild(img);if(dots){var dot=document.createElement('span');dot.style.cssText='width:7px;height:7px;border-radius:50%;background:#fff;opacity:'+(i===0?'1':'.45')+';display:block;';dot.setAttribute('data-dot',i);dots.appendChild(dot);}});
    function setCaption(n){
      if(caption){caption.textContent=list[n]?list[n].caption:'';if(list[n])caption.setAttribute('data-cms-slideshow-caption',n);else caption.removeAttribute('data-cms-slideshow-caption');}
    }
    setCaption(0);
    var imgs=target.querySelectorAll('[data-slide]'),ds=dots?dots.querySelectorAll('[data-dot]'):[];
    if(imgs.length<=1)return;
    var i=0;
    window.tsaSlideshowTimer=setInterval(function(){
      imgs[i].style.opacity='0';if(ds.length)ds[i].style.opacity='.45';
      i=(i+1)%imgs.length;
      imgs[i].style.opacity='1';if(ds.length)ds[i].style.opacity='1';
      setCaption(i);
    },4000);
  }
  function renderJourneyDates(dates){var list=Array.isArray(dates)?dates:DEFAULTS.about.journey_dates;document.querySelectorAll('[data-cms-journey-date]').forEach(function(el){var i=parseInt(el.getAttribute('data-cms-journey-date'),10)-1;if(list[i])el.textContent=list[i];});}
  function renderSocial(social){['facebook','youtube','whatsapp'].forEach(function(name){var el=document.querySelector('[data-cms-social="'+name+'"]');if(!el)return;var url=(social&&social[name])||'';if(url){el.href=url;el.target='_blank';el.rel='noopener noreferrer';el.style.opacity='1';el.onclick=null;}else{el.href='#';el.style.opacity='.55';el.onclick=function(e){e.preventDefault();};}});}
  async function loadAllContent(){
    if(!window.tsaSupabase)throw new Error('Supabase is not available.');
    var res=await window.tsaSupabase.from('site_content').select('section,content');
    if(res.error)throw res.error;
    var out={};(res.data||[]).forEach(function(row){out[row.section]=row.content||{};});
    return out;
  }

  function reveal(){
    // Reveal as soon as the complete CMS payload has been applied.
    // Do not add a second media/font waiting period: the browser handles
    // those resources naturally while the page is already visible.
    ready();
    return Promise.resolve();
  }

  // Lightweight public media viewer. It is delegated so Gallery/News media
  // rendered later can be opened without another render or network request.
  function installMediaViewer(){
    if(window.top!==window.self && new URLSearchParams(location.search).get('edit')==='1')return;
    if(document.getElementById('tsa-media-viewer'))return;
    var style=document.createElement('style');
    style.id='tsa-media-viewer-style';
    style.textContent=`
      #tsa-media-viewer{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.9);padding:24px;box-sizing:border-box}
      #tsa-media-viewer.open{display:flex}
      #tsa-media-viewer .tsa-media-frame{position:relative;max-width:min(96vw,1400px);max-height:92vh;width:auto;height:auto;display:flex;align-items:center;justify-content:center}
      #tsa-media-viewer img,#tsa-media-viewer video{display:block;max-width:96vw;max-height:88vh;width:auto;height:auto;object-fit:contain;border-radius:4px;box-shadow:0 12px 50px rgba(0,0,0,.45)}
      #tsa-media-viewer video{background:#000;min-width:min(70vw,900px)}
      #tsa-media-viewer .tsa-media-close{position:fixed;top:14px;right:16px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.95);color:#222;font:700 28px/44px Arial;cursor:pointer;z-index:2}
      #tsa-media-viewer .tsa-media-close:hover{background:#fff}
      @media(max-width:640px){#tsa-media-viewer{padding:12px}#tsa-media-viewer video{min-width:0;width:94vw}.tsa-media-close{top:10px!important;right:10px!important}}
    `;
    document.head.appendChild(style);
    var overlay=document.createElement('div');
    overlay.id='tsa-media-viewer';
    overlay.innerHTML='<button class="tsa-media-close" type="button" aria-label="Close viewer">&times;</button><div class="tsa-media-frame"></div>';
    document.body.appendChild(overlay);
    var frame=overlay.querySelector('.tsa-media-frame');
    function close(){overlay.classList.remove('open');frame.innerHTML='';document.body.style.overflow='';}
    overlay.querySelector('.tsa-media-close').addEventListener('click',close);
    overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('open'))close();});
    document.addEventListener('click',function(e){
      if(e.defaultPrevented)return;
      var media=e.target.closest('img,video');
      if(!media||!document.body.contains(media))return;
      if(media.closest('header,nav,footer,.logo,.brand,.social-links'))return;
      var src=media.currentSrc||media.src||media.querySelector?.('source')?.src||'';
      if(!src)return;
      e.preventDefault();e.stopPropagation();
      frame.innerHTML='';
      if(media.tagName.toLowerCase()==='video'){
        var v=document.createElement('video');v.src=src;v.controls=true;v.autoplay=true;v.playsInline=true;v.preload='metadata';
        frame.appendChild(v);
      }else{
        var img=document.createElement('img');img.src=src;img.alt=media.alt||'';img.loading='eager';frame.appendChild(img);
      }
      overlay.classList.add('open');document.body.style.overflow='hidden';
    },true);
  }
  installMediaViewer();

  loadAllContent().then(function(all){
    var data=all[section]||{};
    if(section==='index'){
      if(!has(data,'hero_slides'))data.hero_slides=DEFAULTS.index.hero_slides;
      if(!has(data,'hero_captions'))data.hero_captions=DEFAULTS.index.hero_captions;
      if(!data.social)data.social=DEFAULTS.index.social;
    }
    if(section==='about'){
      if(!has(data,'journey_dates')){
        var legacyDates=['auto_text_29','auto_text_30','auto_text_31','auto_text_32','auto_text_33'].map(function(k,i){
          return typeof data[k]==='string'&&data[k].trim()?data[k].trim():DEFAULTS.about.journey_dates[i];
        });
        data.journey_dates=legacyDates;
      }
      if(!has(data,'principal_image'))data.principal_image=DEFAULTS.about.principal_image;
    }
    if(section==='programs'&&!has(data,'items'))data.items=DEFAULTS.programs.items;
    if(section==='administration'&&!has(data,'administration'))data.administration=DEFAULTS.administration.administration;

    apply(data);
    // Dynamic sections (News/Gallery) register before this script loads.
    // Rendering them from the same complete payload avoids a second network
    // request and prevents a second visible loading phase.
    try { window.dispatchEvent(new CustomEvent('tsa-content-loaded',{detail:all})); } catch (_) {}
    var programs=((all.programs&&all.programs.items)||DEFAULTS.programs.items);
    if(section==='index'||section==='academics'||section==='programs')renderPrograms(programs);
    renderSocial((all.index&&all.index.social)||DEFAULTS.index.social);
    return reveal();
  }).catch(function(){
    if(section==='about')apply(DEFAULTS.about||{});
    else if(section==='index'){
      renderSlideshow(DEFAULTS.index.hero_slides,DEFAULTS.index.hero_captions);
      renderSocial(DEFAULTS.index.social);
    }else{
      apply(DEFAULTS[section]||{});
      renderSocial(DEFAULTS.index.social);
    }
    return reveal();
  });
})();
