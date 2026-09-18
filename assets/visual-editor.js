(function(){
  if(window.top===window.self)return;
  if(new URLSearchParams(location.search).get('edit')!=='1')return;
  const section=document.documentElement.getAttribute('data-cms-section')||'';
  const origin=location.origin;
  let enabled=false;
  const post=(type,data)=>window.parent.postMessage(Object.assign({source:'tsa-site-editor',type},data||{}),origin);
  function inject(){
    if(document.getElementById('tsa-edit-style'))return;
    const s=document.createElement('style');s.id='tsa-edit-style';s.textContent=`
      [data-cms-key],[data-cms-program-title],[data-cms-program-intro],[data-cms-journey-date],[data-cms-news-edit],[data-cms-gallery-edit],[data-cms-staff-edit],[data-cms-staff-image],[data-cms-edit-image],[data-cms-social],[data-cms-slideshow-image],[data-cms-slideshow-caption]{outline:1px dashed rgba(184,121,10,.0);outline-offset:3px;cursor:pointer!important}
      body.tsa-edit [data-cms-key]:hover,body.tsa-edit [data-cms-program-title]:hover,body.tsa-edit [data-cms-program-intro]:hover,body.tsa-edit [data-cms-journey-date]:hover,body.tsa-edit [data-cms-news-edit]:hover,body.tsa-edit [data-cms-gallery-edit]:hover,body.tsa-edit [data-cms-staff-edit]:hover,body.tsa-edit [data-cms-staff-image]:hover,body.tsa-edit [data-cms-social]:hover,body.tsa-edit [data-cms-slideshow-image]:hover,body.tsa-edit [data-cms-slideshow-caption]:hover{outline-color:#b8790a;background:rgba(246,185,10,.08)}
      body.tsa-edit .tsa-editable-image{outline:2px solid #b8790a!important;outline-offset:3px}
      body.tsa-edit [data-cms-gallery-edit] video{pointer-events:none!important}
      .tsa-editor-badge{position:fixed;z-index:2147483647;right:12px;bottom:12px;background:#221c10;color:#f6b90a;border:1px solid #b8790a;border-radius:999px;padding:8px 12px;font:700 12px Arial;box-shadow:0 5px 20px #0005;pointer-events:none}
    `;document.head.appendChild(s);document.body.classList.add('tsa-edit');const b=document.createElement('div');b.className='tsa-editor-badge';b.textContent='ADMIN EDIT MODE';document.body.appendChild(b);
  }
  function addImageMarkers(){
    document.querySelectorAll('img').forEach(function(img,i){
      if(img.closest('[data-cms-staff-edit],[data-cms-news-edit],[data-cms-gallery-edit],[data-cms-slideshow-image]'))return;
      if(!img.hasAttribute('data-cms-image-key'))img.setAttribute('data-cms-image-key','image_'+(i+1));
      img.classList.add('tsa-editable-image');
    });
  }
  function markDynamic(){
    document.querySelectorAll('.news-row').forEach((row,i)=>{
      const stable=row.getAttribute('data-cms-news-index');
      row.setAttribute('data-cms-news-edit',stable!=null?stable:i);
    });
    document.querySelectorAll('.gtile').forEach((tile,i)=>{
      const stable=tile.getAttribute('data-cms-gallery-index');
      tile.setAttribute('data-cms-gallery-edit',stable!=null?stable:i);
    });
    document.querySelectorAll('[data-cms-staff-grid] .card').forEach((card,i)=>{
      card.setAttribute('data-cms-staff-edit',i);
      card.setAttribute('data-cms-editable-staff','1');
      const img=card.querySelector('img'); if(img) img.setAttribute('data-cms-staff-image',i);
      const role=card.querySelector('span'); if(role) role.setAttribute('data-cms-staff-role','1');
      const name=card.querySelector('h3'); if(name) name.setAttribute('data-cms-staff-name','1');
      const bio=card.querySelector('p'); if(bio) bio.setAttribute('data-cms-staff-bio','1');
    });
  }
  function observe(){const ob=new MutationObserver(()=>{markDynamic();addImageMarkers();});ob.observe(document.body,{subtree:true,childList:true});}
  function click(e){
    if(!enabled)return;
    // Administration is dynamically rendered. Handle the staff fields and photo
    // explicitly so clicks never depend on the surrounding card or page styling.
    const staffPart=e.target.closest('[data-cms-staff-image],[data-cms-staff-name],[data-cms-staff-role],[data-cms-staff-bio],[data-cms-staff-edit]');
    if(section==='administration' && staffPart){
      const card=staffPart.closest('[data-cms-staff-edit]');
      if(card){
        e.preventDefault();e.stopPropagation();
        const i=+card.getAttribute('data-cms-staff-edit');
        const image=card.querySelector('img')?.currentSrc||card.querySelector('img')?.src||'';
        post('staff',{index:i,name:card.querySelector('[data-cms-staff-name],h3')?.textContent||'',role:card.querySelector('[data-cms-staff-role],span')?.textContent||'',bio:card.querySelector('[data-cms-staff-bio],p')?.textContent||'',image});
        return;
      }
    }
    const journeyDate=e.target.closest('[data-cms-journey-date]');
    if(journeyDate){
      e.preventDefault();e.stopPropagation();
      const index=Math.max(0,(parseInt(journeyDate.getAttribute('data-cms-journey-date'),10)||1)-1);
      post('journey-date',{index,value:journeyDate.textContent||''});
      return;
    }
    const t=e.target.closest('[data-cms-slideshow-image],[data-cms-slideshow-caption],[data-cms-social],[data-cms-news-edit],[data-cms-gallery-edit],[data-cms-staff-edit],[data-cms-image-key],[data-cms-program-title],[data-cms-program-intro],[data-cms-key]');

    // Interactive content must still open while editing. Previously the editor's
    // capture handler prevented these controls from doing their normal job.
    const levelButton=e.target.closest('.level-tabs button');
    if(levelButton){
      e.preventDefault();e.stopPropagation();
      document.querySelectorAll('.level-tabs button').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.level-panel').forEach(function(panel){panel.classList.remove('active');});
      levelButton.classList.add('active');
      const panel=document.getElementById('panel-'+levelButton.dataset.level);
      if(panel)panel.classList.add('active');
      const editable=levelButton.querySelector('[data-cms-key]');
      if(editable)post('text',{key:editable.getAttribute('data-cms-key'),value:editable.textContent||''});
      return;
    }
    const summary=e.target.closest('.faq summary');
    if(summary){
      e.preventDefault();e.stopPropagation();
      const details=summary.parentElement;
      if(details)details.open=!details.open;
      if(summary.hasAttribute('data-cms-key'))post('text',{key:summary.getAttribute('data-cms-key'),value:summary.textContent||''});
      return;
    }

    // Social icons are editable controls. Handle them BEFORE generic link
    // navigation because an empty social href ('#') otherwise looks like an
    // internal page link and gets intercepted as navigation.
    const social=e.target.closest('[data-cms-social]');
    if(social){
      e.preventDefault();e.stopPropagation();
      post('social',{name:social.getAttribute('data-cms-social'),url:social.href&&social.href!=='#'?social.href:''});
      return;
    }

    // In admin edit mode, internal site navigation must stay inside the
    // parent editor. Otherwise clicking About/News/Gallery in the preview
    // navigates the iframe to a normal public page and the editor mode is
    // lost (often making it appear that the preview jumped back to Home).
    const link=e.target.closest('a[href]');
    if(link){
      try{
        const u=new URL(link.getAttribute('href'),location.href);
        const allowed=['index.html','about.html','academics.html','admissions.html','administration.html','contact.html','news.html','gallery.html'];
        const path=u.pathname.split('/').pop()||'index.html';
        if(u.origin===location.origin && allowed.includes(path)){
          e.preventDefault();e.stopPropagation();
          post('navigate',{url:path});
          return;
        }
      }catch(_){}
    }

    if(!t)return;
    e.preventDefault();e.stopPropagation();
    const slide=t.closest('[data-cms-slideshow-image]');
    if(slide){post('slideshow',{index:+slide.getAttribute('data-cms-slideshow-image')});return;}
    const slideCaption=t.closest('[data-cms-slideshow-caption]');
    if(slideCaption){post('slideshow',{index:+slideCaption.getAttribute('data-cms-slideshow-caption')});return;}
    const news=t.closest('[data-cms-news-edit]');
    if(news){const i=+news.getAttribute('data-cms-news-edit');const row=news.closest('.news-row');post('news',{index:i,title:row.querySelector('h3')?.textContent||'',date:row.querySelector('.news-date')?.textContent||'',category:row.querySelector('.cat')?.textContent||'Announcements',excerpt:row.querySelector('p')?.textContent||'',mediaUrl:row.querySelector('img')?.src||'',mediaType:row.querySelector('video')?'video':''});return;}
    const gallery=t.closest('[data-cms-gallery-edit]');
    if(gallery){e.preventDefault();e.stopPropagation();const i=+gallery.getAttribute('data-cms-gallery-edit');const video=gallery.querySelector('video');const img=gallery.querySelector('img');const mediaUrl=video?.currentSrc||video?.querySelector('source')?.src||img?.currentSrc||img?.src||'';post('gallery',{index:i,caption:gallery.querySelector('span')?.textContent||'',category:gallery.dataset.cat||'campus',image:img?.currentSrc||img?.src||'',mediaUrl,mediaType:video?'video':'image'});return;}
    const staff=t.closest('[data-cms-staff-edit]');
    if(staff){
      const i=+staff.getAttribute('data-cms-staff-edit');
      post('staff',{index:i,name:staff.querySelector('[data-cms-staff-name],h3')?.textContent||'',role:staff.querySelector('[data-cms-staff-role],span')?.textContent||'',bio:staff.querySelector('[data-cms-staff-bio],p')?.textContent||'',image:staff.querySelector('img')?.src||''});
      return;
    }
    const image=t.closest('[data-cms-image-key]');
    if(image){post('image',{key:image.getAttribute('data-cms-image-key'),src:image.currentSrc||image.src||''});return;}
    if(t.hasAttribute('data-cms-program-title')||t.hasAttribute('data-cms-program-intro')){
      const key=t.getAttribute(t.hasAttribute('data-cms-program-title')?'data-cms-program-title':'data-cms-program-intro');
      const cards=[...document.querySelectorAll('[data-cms-program-title]')];
      const idx=cards.findIndex(x=>x.getAttribute('data-cms-program-title')===key);
      const items=cards.map(function(card){
        const k=card.getAttribute('data-cms-program-title');
        const intro=document.querySelector('[data-cms-program-intro="'+CSS.escape(k)+'"]');
        return {name:card.textContent||'',intro:intro?intro.textContent:''};
      });
      const intro=document.querySelector('[data-cms-program-intro="'+CSS.escape(key)+'"]');
      post('program',{index:idx,name:t.hasAttribute('data-cms-program-title')?t.textContent:(document.querySelector('[data-cms-program-title="'+CSS.escape(key)+'"]')||{}).textContent||key,intro:intro?intro.textContent:'',items});return;
    }
    if(t.hasAttribute('data-cms-key'))post('text',{key:t.getAttribute('data-cms-key'),value:t.textContent||''});
  }
  function receive(e){
    if(e.origin!==origin||!e.data||e.data.source!=='tsa-visual-editor')return;const m=e.data;
    if(m.type==='enable'){enabled=true;inject();markDynamic();addImageMarkers();observe();}
    if(m.type==='hydrate')hydrate(m.data||{});
    if(m.type==='set-text'){const el=document.querySelector('[data-cms-key="'+CSS.escape(m.key)+'"]');if(el)el.textContent=m.value;}
    if(m.type==='set-journey-dates'&&Array.isArray(m.dates)){m.dates.forEach((v,i)=>{const el=document.querySelector('[data-cms-journey-date="'+(i+1)+'"]');if(el)el.textContent=v;});}
    if(m.type==='set-image'){const el=document.querySelector('[data-cms-image-key="'+CSS.escape(m.key)+'"]');if(el){if(m.url){el.src=m.url;el.style.visibility='visible';el.style.display='';}else{el.removeAttribute('src');el.style.visibility='hidden';el.style.display='none';}}}
    if(m.type==='set-social'){const el=document.querySelector('[data-cms-social="'+CSS.escape(m.name)+'"]');if(el){el.href=m.url||'#';el.style.opacity=m.url?'1':'.55';}}
    if(m.type==='set-slideshow'){if(section==='index'&&typeof window.tsaRenderSlideshow==='function')window.tsaRenderSlideshow(m.slides||[],m.captions||[]);}
    if(m.type==='set-program'){const d=document.querySelectorAll('[data-cms-program-title]');const el=d[m.index];if(el)el.textContent=m.name;const intros=document.querySelectorAll('[data-cms-program-intro]');if(intros[m.index])intros[m.index].textContent=m.intro;}
    if(m.type==='set-staff'||m.type==='set-staff-image'){if(Array.isArray(m.items)&&typeof window.tsaRenderStaff==='function'){window.tsaRenderStaff(m.items);}else{const cards=document.querySelectorAll('[data-cms-staff-grid] .card');const c=cards[m.index];if(c&&m.item){if(c.querySelector('h3'))c.querySelector('h3').textContent=m.item.name;if(c.querySelector('span'))c.querySelector('span').textContent=m.item.role;if(c.querySelector('p'))c.querySelector('p').textContent=m.item.bio;let img=c.querySelector('img');if(m.item.image){if(!img){img=document.createElement('img');c.insertBefore(img,c.firstChild);}img.src=m.item.image;}else if(img){img.remove();}}}markDynamic();addImageMarkers();}
    if(m.type==='rerender-news'){if(typeof window.tsaRenderNews==='function')window.tsaRenderNews({items:m.items||[m.item]});markDynamic();}
    if(m.type==='rerender-gallery'){if(typeof window.tsaRenderGallery==='function')window.tsaRenderGallery({items:m.items||[m.item]});markDynamic();}
    if(m.type==='rerender-staff'){if(typeof window.tsaRenderStaff==='function')window.tsaRenderStaff(m.items||[]);markDynamic();}
  }
  function hydrate(data){
    Object.keys(data||{}).forEach(k=>{if(typeof data[k]==='string'){const el=document.querySelector('[data-cms-key="'+CSS.escape(k)+'"]');if(el)el.textContent=data[k];const img=document.querySelector('[data-cms-image-key="'+CSS.escape(k)+'"]');if(img){if(data[k]){img.src=data[k];img.style.visibility='visible';img.style.display='';}else{img.removeAttribute('src');img.style.visibility='hidden';img.style.display='none';}}}});
    if(section==='about'&&Array.isArray(data.journey_dates))data.journey_dates.forEach((v,i)=>{const el=document.querySelector('[data-cms-journey-date="'+(i+1)+'"]');if(el)el.textContent=v;});
  }
  window.addEventListener('message',receive);document.addEventListener('click',click,true);inject();addImageMarkers();markDynamic();observe();
})();
