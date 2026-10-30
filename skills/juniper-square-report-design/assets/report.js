/* Juniper Square Studio · report helpers · copy verbatim. Every renderer is render(el, data) and fully redraws el. */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt={
  money(v,{full=false}={}){if(v==null||isNaN(v))return'—';const a=Math.abs(v),s=v<0?'−':'';
    if(full||a<1e3)return s+'$'+Math.round(a).toLocaleString('en-US');
    const[d,u]=a>=1e9?[1e9,'B']:a>=1e6?[1e6,'M']:[1e3,'k'];return s+'$'+(+(a/d).toFixed(a/d<10?2:1))+u;},
  int:v=>v==null||isNaN(v)?'—':Math.round(v).toLocaleString('en-US'),
  pct:v=>v==null||isNaN(v)?'—':(+(+v).toFixed(1))+'%',
  date(iso){if(!iso)return'—';const[y,m,d]=iso.split('-');return`${+d} ${MON[m-1]} ${y}`;},
  month(iso){if(!iso)return'—';const[y,m]=iso.split('-');return`${MON[m-1]} ${y}`;},
  days:(from,to)=>Math.round((Date.parse(to)-Date.parse(from))/864e5)
};
function niceMax(v){const e=10**Math.floor(Math.log10(v||1)),f=v/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e;}
function smoothPath(p){let d=`M ${p[0].x} ${p[0].y}`;
  for(let i=0;i<p.length-1;i++){const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;
    d+=` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6}, ${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6}, ${p2.x} ${p2.y}`;}
  return d;}
const uid=p=>p+Math.random().toString(36).slice(2,8);
function watch(el,draw){let w=-1,raf;new ResizeObserver(()=>{if(el.clientWidth===w)return;w=el.clientWidth;cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}).observe(el);}
function tipEl(){let t=document.getElementById('tip');if(!t){t=document.createElement('div');t.id='tip';t.className='tip';t.setAttribute('role','tooltip');t.hidden=true;document.body.append(t);}return t;}
function showTip(x,y,html){const t=tipEl();t.innerHTML=html;t.hidden=false;const r=t.getBoundingClientRect();
  t.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x+14))+'px';t.style.top=Math.max(8,y-r.height-14)+'px';}
const hideTip=()=>{tipEl().hidden=true;};

/* Trend: 2px line over a flat --accent-subtle area. points=[{label,value,modeled}].
   Points flagged modeled:true are drawn dashed on a --surface-subtle span that starts at a labelled "Today" rule
   placed on the last actual point. The latest actual point carries the view's one --highlight mark (1px --text edge). */
function renderTrend(el,{points,format='money',label='',height=240,highlight=true}){
  const f=fmt[format]||fmt.int,w=Math.max(280,el.clientWidth),h=height,m={t:32,r:16,b:28,l:56},ix=w-m.l-m.r,iy=h-m.t-m.b,n=points.length;
  const max=niceMax(Math.max(...points.map(p=>p.value),1)),X=i=>m.l+(n<2?ix/2:i*ix/(n-1)),Y=v=>m.t+iy-(v/max)*iy;
  const pts=points.map((p,i)=>({x:X(i),y:Y(p.value)})),every=Math.ceil(n/Math.max(2,Math.floor(ix/80)));
  let la=-1;points.forEach((p,i)=>{if(!p.modeled)la=i;});if(la<0)la=0;
  const act=pts.slice(0,la+1),mod=la<n-1?pts.slice(la):[],last=pts[la],base=m.t+iy;
  el.innerHTML=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
${mod.length?`<rect class="band" x="${last.x}" y="${m.t}" width="${w-m.r-last.x}" height="${iy}"/>`:''}
${[0,.25,.5,.75,1].map(t=>`<line class="${t?'grid':'axis'}" x1="${m.l}" x2="${w-m.r}" y1="${Y(t*max)}" y2="${Y(t*max)}"/><text x="${m.l-10}" y="${Y(t*max)+4}" text-anchor="end">${f(t*max)}</text>`).join('')}
${points.map((p,i)=>(i===n-1||(i%every===0&&n-1-i>=every/2))?`<text x="${X(i)}" y="${h-6}" text-anchor="middle">${esc(p.label)}</text>`:'').join('')}
${mod.length?`<line class="today" x1="${last.x}" x2="${last.x}" y1="${m.t-12}" y2="${base}"/><text class="today-label" x="${last.x+6}" y="${m.t-4}">Today</text>`:''}
<line class="guide" y1="${m.t}" y2="${base}" x1="-99" x2="-99"/>
${act.length>1?`<path class="area" d="${smoothPath(act)} L ${last.x} ${base} L ${act[0].x} ${base} Z"/><path class="line" d="${smoothPath(act)}"/>`:''}
${mod.length>1?`<path class="line line--modeled" d="${smoothPath(mod)}"/>`:''}
${pts.map((p,i)=>i===la&&highlight?'':`<circle class="pt" r="3.5" cx="${p.x}" cy="${p.y}" tabindex="0" data-i="${i}"/>`).join('')}
${highlight?`<circle class="now" r="5" cx="${last.x}" cy="${last.y}" tabindex="0" data-i="${la}"/>`:''}
<text class="callout" x="${last.x-12}" y="${last.y-14}" text-anchor="end">${f(points[la].value)}</text></svg>`;
  const svg=el.querySelector('svg'),guide=svg.querySelector('.guide');
  const show=i=>{const b=svg.getBoundingClientRect();guide.setAttribute('x1',pts[i].x);guide.setAttribute('x2',pts[i].x);showTip(b.left+pts[i].x,b.top+pts[i].y,`${esc(points[i].label)}${points[i].modeled?' · Modeled':''}<b>${f(points[i].value)}</b>`);};
  const hide=()=>{guide.setAttribute('x1',-99);guide.setAttribute('x2',-99);hideTip();};
  svg.onpointermove=e=>{const x=e.clientX-svg.getBoundingClientRect().left;let i=0;pts.forEach((p,j)=>{if(Math.abs(p.x-x)<Math.abs(pts[i].x-x))i=j;});show(i);};
  svg.onpointerleave=hide;
  svg.querySelectorAll('[data-i]').forEach(c=>{c.onfocus=()=>show(+c.dataset.i);c.onblur=hide;});
}
/* Sparkline for KPI cards / cells. values=[n,…] */
function renderSpark(el,values,label=''){
  const w=120,h=32,max=Math.max(...values,1),min=Math.min(...values,0),n=values.length;
  const pts=values.map((v,i)=>({x:n<2?w/2:i*w/(n-1),y:h-2-((v-min)/((max-min)||1))*(h-4)}));
  el.innerHTML=`<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}"><path class="area" d="${smoothPath(pts)} L ${w} ${h} L 0 ${h} Z"/><path class="line" d="${smoothPath(pts)}" vector-effect="non-scaling-stroke"/></svg>`;
}

/* Org chart. nodes=[{id,name,type:'fund'|'hold'|'prop'|'inv',typeLabel,row,col}] edges=[{from,to,pct}] (pct null = not recorded) */
function renderOrg(el,{nodes,edges,label=''}){
  const W=232,H=68,PX=264,PY=128,G=PY-H,TYPE={fund:'Fund',hold:'Holding company',prop:'Property company',inv:'Investor group'};
  const c0=Math.min(...nodes.map(n=>n.col)),c1=Math.max(...nodes.map(n=>n.col)),r1=Math.max(...nodes.map(n=>n.row));
  const pos={};nodes.forEach(n=>pos[n.id]={x:(n.col-c0)*PX,y:n.row*PY});
  const w=(c1-c0)*PX+W,h=r1*PY+H,ins=id=>edges.filter(e=>e.to===id).length,outs=id=>edges.filter(e=>e.from===id).length,mk=uid('ar-');
  let paths='',tags='';
  edges.forEach(e=>{const a=pos[e.from],b=pos[e.to],sx=a.x+W/2,sy=a.y+H,tx=b.x+W/2,ty=b.y,my=ty-G/2,dir=Math.sign(tx-sx),r=Math.min(8,Math.abs(tx-sx)/2);
    paths+=`<path class="org-edge" marker-end="url(#${mk})" d="${dir?`M${sx} ${sy}V${my-r}Q${sx} ${my} ${sx+dir*r} ${my}H${tx-dir*r}Q${tx} ${my} ${tx} ${my+r}V${ty-1}`:`M${sx} ${sy}V${ty-1}`}"/>`;
    const[lx,ly]=!dir&&outs(e.from)===1?[sx,(sy+ty)/2]:ins(e.to)===1?[tx,my+G/4-6]:outs(e.from)===1?[sx,sy+G/4]:[(sx+tx)/2,my];
    tags+=`<span class="org-pct${e.pct==null?' org-pct--na':''}" style="left:${lx}px;top:${ly}px">${e.pct==null?'—':fmt.pct(e.pct)}</span>`;});
  el.innerHTML=`<div class="org" role="img" aria-label="${esc(label)}" style="width:${w}px;height:${h}px"><svg width="${w}" height="${h}" aria-hidden="true"><defs><marker id="${mk}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="org-arrow" d="M0 0L8 4L0 8z"/></marker></defs>${paths}</svg>
${nodes.map(n=>`<div class="org-node org-node--${n.type}" style="left:${pos[n.id].x}px;top:${pos[n.id].y}px" title="${esc(n.name)}"><span class="org-name">${esc(n.name)}</span><span class="org-type">${esc(n.typeLabel||TYPE[n.type])}</span></div>`).join('')}${tags}</div>`;
}

/* Table: sortable, paged at 50, hides columns empty in every row and footnotes them once.
   columns=[{key,label,align:'r'|'c',sortable,text,sortValue(r),render(r),keep}] */
function renderTable(el,cfg){
  const st=el._st||(el._st={key:cfg.sort?.key,dir:cfg.sort?.dir||'desc',page:0}),empty=v=>v==null||v==='';
  const cols=cfg.columns.filter(c=>c.keep||cfg.rows.some(r=>!empty(r[c.key]))),hidden=cfg.columns.filter(c=>!cols.includes(c)).map(c=>c.label);
  const rows=[...cfg.rows],sc=cfg.columns.find(c=>c.key===st.key);
  if(sc){const v=r=>sc.sortValue?sc.sortValue(r):r[sc.key];rows.sort((a,b)=>{const x=v(a),y=v(b);if(empty(x))return 1;if(empty(y))return-1;return(x>y?1:x<y?-1:0)*(st.dir==='asc'?1:-1);});}
  const size=cfg.pageSize||50,pages=Math.max(1,Math.ceil(rows.length/size));st.page=Math.min(st.page,pages-1);
  const from=st.page*size,slice=rows.slice(from,from+size),al=c=>c.align?` class="${c.align}"`:'';
  const th=c=>{if(!c.sortable)return`<th scope="col"${al(c)}>${c.label}</th>`;const s=st.key===c.key?(st.dir==='asc'?'ascending':'descending'):'none';
    return`<th scope="col"${al(c)} aria-sort="${s}"><button class="sort" data-k="${c.key}">${c.label}</button></th>`;};
  const td=(c,r)=>`<td${al(c)}>${c.render?c.render(r):empty(r[c.key])?'<span class="muted">—</span>':esc(r[c.key])}</td>`;
  const notes=[...(cfg.notes||[])];
  if(hidden.length)notes.push(`${hidden.join(' and ')} ${hidden.length>1?"aren't":"isn't"} recorded for any row, so ${hidden.length>1?'those columns are':'the column is'} hidden.`);
  el.innerHTML=`<div class="tbl-wrap"><table class="tbl"><caption class="sr">${esc(cfg.caption)}</caption><thead><tr>${cols.map(th).join('')}</tr></thead>
<tbody>${slice.map(r=>`<tr>${cols.map(c=>td(c,r)).join('')}</tr>`).join('')}</tbody></table></div>
<div class="tbl-foot"><span>Showing ${rows.length?from+1:0}–${from+slice.length} of ${fmt.int(rows.length)}</span>${pages>1?`<span class="pager"><button class="btn" data-p="-1"${st.page?'':' disabled'}>Previous</button><button class="btn" data-p="1"${st.page<pages-1?'':' disabled'}>Next</button></span>`:''}</div>
${notes.length?`<div class="footnote">${notes.map(n=>`<p>${n}</p>`).join('')}</div>`:''}`;
  el.onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;let sel;
    if(b.dataset.k){const k=b.dataset.k,c=cfg.columns.find(c=>c.key===k);st.dir=st.key===k?(st.dir==='asc'?'desc':'asc'):(c.text?'asc':'desc');st.key=k;st.page=0;sel=`[data-k="${k}"]`;}
    else{st.page+=+b.dataset.p;sel=`[data-p="${b.dataset.p}"]`;}
    renderTable(el,cfg);el.querySelector(sel)?.focus();};
}
/* Stage cell for tables: stage = 1-based index into stages */
const stageCell=(stage,stages)=>`<span class="stage"><span class="steps" aria-hidden="true">${stages.map((_,i)=>`<i${i+1<stage?' class="done"':i+1===stage?' class="now"':''}></i>`).join('')}</span><span class="sr">Stage ${stage} of ${stages.length}: </span>${esc(stages[stage-1])}</span>`;

/* Links: only where the connector returned a URL that opens the record in Juniper Square (today: a document's
   staffViewUrl). Names always render as plain text; the link is a separate, quiet affordance.
   openLink(url, label='Open') -> a small muted "Open ↗", or '' when there is no usable URL.
   jsqLink(...) is kept for old saved builds and now returns plain text only. */
const okUrl=u=>typeof u==='string'&&/^https:\/\/[a-z0-9-]+\.junipersquare\.com\/[A-Za-z0-9/_-]+$/.test(u);
function openLink(url,label='Open'){return okUrl(url)?`<a class="open-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} in Juniper Square">${esc(label)}</a>`:'';}
function jsqLink(a,b,c){return esc(c!==undefined?c:b);}

/* Juniper Square mark for the brand bar: any element with data-jsq-mark gets it. */
const JSQ_MARK=`<svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Juniper Square" class="mark"> <g clip-path="url(#jsq-mark-clip)"><path d="M43.4528 4.51081H4.63774V43.3258H43.4528V4.51081ZM47.946 47.8371H0.126465V0.0175781H47.946V47.8371ZM32.0483 11.2597V16.1138V27.9695C32.0483 30.8928 31.146 33.0221 29.7205 34.4476C28.2949 35.8552 26.2919 36.577 24.0001 36.577C21.3656 36.577 19.4347 35.6567 18.0994 34.2311C16.7821 32.8055 16.0964 30.8747 16.0423 28.8537C16.0423 28.4747 16.0242 27.5905 16.0242 27.0852H20.0844C20.1205 28.4928 20.3911 29.6837 21.0047 30.5679C21.6543 31.5243 22.7009 32.0837 24.0362 32.0657C25.155 32.0657 26.0753 31.6867 26.6708 30.9649C27.2663 30.2251 27.555 29.1965 27.555 27.9153V15.7349H20.8242V11.2416H32.0483V11.2597Z" fill="currentColor"/></g> <defs><clipPath id="jsq-mark-clip"><rect width="48" height="48" fill="white"/></clipPath></defs> </svg>`;
document.querySelectorAll('[data-jsq-mark]').forEach(el=>{el.innerHTML=JSQ_MARK;});
