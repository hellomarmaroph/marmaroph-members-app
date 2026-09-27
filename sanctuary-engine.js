// ═══════════════════════════════════════════════════════════════════
// SANCTUARY ENGINE v1.0
// Shared analysis engine for all Marmaroph ritual Sanctuary Analyzers.
// Each ritual mounts this engine with its own RitualConfig.
// ═══════════════════════════════════════════════════════════════════

var SanctuaryEngine = (function(){
'use strict';

// ── API ─────────────────────────────────────────────────────────
var API_KEY = 'AQ.Ab8RN6Ly-w-bmfujRYEebjfX0m7ZBfQn9Gidr9UR7b7CvXzMYA';
var VISION_MODEL = 'gemini-3.8-flash';
var IMAGE_MODEL_A = 'gemini-3.1-flash-image';
var IMAGE_MODEL_B = 'gemini-3.1-flash-image';
var GEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';

// ── FENG SHUI BASE DATA (shared across all rituals) ─────────────
var FS_BASE = {
  N:  {trig:'Kan',  elem:'Water', chi:'水', energy:'Career & Life Path',
       colors:['Warm Ivory','Midnight Navy','Forest Green','Dark Walnut'],
       palette:[{name:'Warm Ivory',hex:'#f5f0e6'},{name:'Midnight Navy',hex:'#1e2f4a'},{name:'Forest Green',hex:'#2a5438'},{name:'Dark Walnut',hex:'#3a2010'}],
       plants:['Lucky Bamboo','Peace Lily','Money Tree'],
       scentsBase:['Frankincense','Sandalwood','Vetiver']},
  NE: {trig:'Gen',  elem:'Earth', chi:'土', energy:'Knowledge & Wisdom',
       colors:['Sandy Beige','Warm Terracotta','Yellow Ochre','Sage Green'],
       palette:[{name:'Sandy Beige',hex:'#c8b090'},{name:'Terracotta',hex:'#b85c2a'},{name:'Warm Ochre',hex:'#c09040'},{name:'Sage Green',hex:'#7a9870'}],
       plants:['Aloe Vera','Jade Plant','Lavender'],
       scentsBase:['Cedarwood','Bergamot','Clary Sage']},
  E:  {trig:'Zhen', elem:'Wood', chi:'木', energy:'Health & New Beginnings',
       colors:['Sage Green','Forest Green','Warm Oak','Cream'],
       palette:[{name:'Sage Green',hex:'#8faa8a'},{name:'Forest Green',hex:'#2a5438'},{name:'Warm Oak',hex:'#b08050'},{name:'Cream',hex:'#f5efe0'}],
       plants:['Rubber Plant','Pothos','Money Tree'],
       scentsBase:['Eucalyptus','Rosemary','Lemongrass']},
  SE: {trig:'Xun',  elem:'Wood', chi:'木', energy:'Wealth & Prosperity',
       colors:['Emerald Green','Gold','Warm Wood','Deep Plum'],
       palette:[{name:'Emerald',hex:'#2d6a4f'},{name:'Gold',hex:'#d4b366'},{name:'Warm Wood',hex:'#8b6914'},{name:'Deep Plum',hex:'#5c374c'}],
       plants:['Money Tree (Pachira)','Jade Plant','Golden Pothos'],
       scentsBase:['Cinnamon','Orange','Ylang Ylang']},
  S:  {trig:'Li',   elem:'Fire', chi:'火', energy:'Fame & Recognition',
       colors:['Warm Red','Coral','Gold','Ivory'],
       palette:[{name:'Warm Red',hex:'#a0382e'},{name:'Coral',hex:'#c06048'},{name:'Gold',hex:'#d4b366'},{name:'Ivory',hex:'#f5f0e6'}],
       plants:['Fiddle Leaf Fig','Bird of Paradise','Red Anthurium'],
       scentsBase:['Cinnamon','Clove','Rose']},
  SW: {trig:'Kun',  elem:'Earth', chi:'土', energy:'Relationships & Partnership',
       colors:['Warm Pink','Terracotta','Sandy Beige','Soft Gold'],
       palette:[{name:'Warm Pink',hex:'#c09088'},{name:'Terracotta',hex:'#b85c2a'},{name:'Sandy Beige',hex:'#c8b090'},{name:'Soft Gold',hex:'#d4b366'}],
       plants:['Orchid','Peace Lily','Jade Plant'],
       scentsBase:['Rose','Jasmine','Sandalwood']},
  W:  {trig:'Dui',  elem:'Metal', chi:'金', energy:'Children & Creativity',
       colors:['White','Silver Grey','Warm Gold','Cream'],
       palette:[{name:'Off White',hex:'#f0ece4'},{name:'Warm Grey',hex:'#a0998e'},{name:'Brass',hex:'#c0a040'},{name:'Cream',hex:'#f5efe0'}],
       plants:['White Orchid','Air Plant','Eucalyptus'],
       scentsBase:['Peppermint','Tea Tree','Lemon']},
  NW: {trig:'Qian', elem:'Metal', chi:'金', energy:'Mentors & Helpful People',
       colors:['Charcoal','Gold','Silver','Cream'],
       palette:[{name:'Charcoal',hex:'#2a2a2a'},{name:'Gold',hex:'#d4b366'},{name:'Silver',hex:'#b0b0b0'},{name:'Cream',hex:'#f0ece4'}],
       plants:['ZZ Plant','Snake Plant','White Peace Lily'],
       scentsBase:['Frankincense','Myrrh','White Sage']}
};

var DIR_ELEMS = {};
Object.keys(FS_BASE).forEach(function(d){ DIR_ELEMS[d] = FS_BASE[d].elem; });

// ── FIVE ELEMENT SYSTEM ─────────────────────────────────────────
var ELEMENTS = [
  {key:'wood',  name:'Wood',  color:'#4a7c59', icon:'🌿'},
  {key:'fire',  name:'Fire',  color:'#c0392b', icon:'🔥'},
  {key:'earth', name:'Earth', color:'#c9912a', icon:'🏔️'},
  {key:'metal', name:'Metal', color:'#b0b0b0', icon:'⚙️'},
  {key:'water', name:'Water', color:'#2c3e6b', icon:'💧'}
];

// ── PALETTE OPTIONS ─────────────────────────────────────────────
var PALETTES = [
  {id:'warm_neutral',  name:'Warm Neutral Sanctuary',  colors:['#e8dcc8','#c8b8a0','#b09878','#f5efe0'], desc:'Oatmeal, sand, light oak, cream'},
  {id:'earth_clay',    name:'Earth & Clay',             colors:['#b85c2a','#a04020','#c09040','#c8b090'], desc:'Terracotta, rust, ochre, warm sand'},
  {id:'emerald_calm',  name:'Emerald Calm',             colors:['#2d6a4f','#c09088','#c8b090','#f5efe0'], desc:'Emerald green, dusty blush, warm beige'},
  {id:'soft_botanical', name:'Soft Botanical',           colors:['#7a9870','#6b7c50','#f5efe0','#b08050'], desc:'Sage, olive, cream, natural wood'},
  {id:'coastal',       name:'Coastal Serenity',          colors:['#9fd6eb','#ffffff','#b09878','#e8dcc8'], desc:'Sky blue, white, driftwood, linen'},
  {id:'grounded_teal', name:'Grounded Teal',             colors:['#044147','#b87333','#f7f4ef','#e0d9d0'], desc:'Deep teal, copper, warm off-white'},
  {id:'stone',         name:'Stone & Travertine',        colors:['#a0998e','#808078','#c8b8a0','#2a2a2a'], desc:'Greige, warm grey, travertine, charcoal'}
];

var STYLES = [
  {id:'japandi',       name:'Japandi',                desc:'Calm, low, natural wood, minimal'},
  {id:'modern_organic', name:'Modern Organic',          desc:'Soft curves, natural materials, warm neutrals'},
  {id:'warm_med',      name:'Warm Minimal / Mediterranean', desc:'Limewash, arches, stone, linen'},
  {id:'scandinavian',  name:'Scandinavian',            desc:'Light, bright, functional, cozy textiles'},
  {id:'natural_boho',  name:'Natural Boho',            desc:'Rattan, jute, plants, layered textures'},
  {id:'classic',       name:'Classic Contemporary',    desc:'Tailored, timeless, balanced'}
];

// ── MERGE FS_BASE + RITUAL CONFIG ───────────────────────────────
function buildFS(ritualConfig) {
  var fs = {};
  var dirExtras = ritualConfig.directionExtras || {};
  Object.keys(FS_BASE).forEach(function(d) {
    fs[d] = Object.assign({}, FS_BASE[d]);
    if (dirExtras[d]) Object.assign(fs[d], dirExtras[d]);
    if (!fs[d].note) fs[d].note = FS_BASE[d].elem + ' energy in the ' + d + ' direction.';
  });
  return fs;
}

// ── API CALLS ───────────────────────────────────────────────────
function geminiVision(imgB64, imgMime, prompt) {
  var body = {contents:[{parts:[
    {inline_data:{mime_type:imgMime, data:imgB64}},
    {text:prompt}
  ]}]};
  return fetch(GEN_ENDPOINT + VISION_MODEL + ':generateContent?key=' + API_KEY,
    {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.error) throw new Error(d.error.message);
      return d.candidates[0].content.parts[0].text;
    });
}

function generateImage(prompt) {
  var body = {contents:[{parts:[{text:prompt}]}], generationConfig:{responseModalities:['IMAGE','TEXT']}};
  return fetch(GEN_ENDPOINT + IMAGE_MODEL_A + ':generateContent?key=' + API_KEY,
    {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.error) throw new Error(d.error.message);
      var parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
      var imgP = parts.find(function(p){ return p.inlineData; });
      if (imgP) return 'data:' + imgP.inlineData.mimeType + ';base64,' + imgP.inlineData.data;
      return null;
    });
}

// ── USAGE TRACKING ──────────────────────────────────────────────
function getUsage(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch(e) { return {}; }
}
function saveUsage(storageKey, u) {
  try { localStorage.setItem(storageKey, JSON.stringify(u)); } catch(e) {}
}
function remainingCount(storageKey, tod, limit) {
  var u = getUsage(storageKey);
  return Math.max(0, limit - (u[tod] || 0));
}
function incrementUsage(storageKey, tod) {
  var u = getUsage(storageKey);
  u[tod] = (u[tod] || 0) + 1;
  saveUsage(storageKey, u);
}

// ── PARSING ─────────────────────────────────────────────────────
function parseAnalysis(raw, sectionNames) {
  var sections = {};
  var defaults = {before:'', feng:'', priority:'', keep:'', materials:'',
                  shopping:null, score:null, directives:null,
                  elemBalance:null, plants:null};
  Object.keys(defaults).forEach(function(k){ sections[k] = defaults[k]; });
  if (sectionNames) {
    Object.keys(sectionNames).forEach(function(k){ if (!(k in sections)) sections[k] = ''; });
  }

  var parts = raw.split(/^##\s+/m);
  for (var i = 1; i < parts.length; i++) {
    var nl = parts[i].indexOf('\n');
    var h = (nl > -1 ? parts[i].substring(0, nl) : parts[i]).trim().toUpperCase();
    var body = nl > -1 ? parts[i].substring(nl + 1) : '';

    if (h.startsWith('THE BEFORE STATE'))          sections.before = body.trim();
    else if (h.startsWith('FENG SHUI READING'))     sections.feng = body.trim();
    else if (h.startsWith('FIVE PRIORITY') || h.startsWith('THE FIVE PRIORITY')) sections.priority = body.trim();
    else if (h.startsWith('WHAT TO KEEP'))           sections.keep = body.trim();
    else if (h.startsWith('MATERIALS SPEC'))          sections.materials = body.trim();
    else if (h.startsWith('FIVE ELEMENT')) {
      try { sections.elemBalance = JSON.parse(body.trim().split('\n')[0]); } catch(e) { sections.elemBalance = null; }
    }
    else if (h.startsWith('PLANT PRESC')) {
      try { sections.plants = JSON.parse(body.trim().split('\n')[0]); } catch(e) { sections.plants = null; }
    }
    else if (h.startsWith('SPACE SCORE')) {
      var jm = body.match(/\{[^}]*"overall"[^}]*\}/);
      if (jm) try { sections.score = JSON.parse(jm[0]); } catch(e) {}
    }
    else if (h.startsWith('SHOPPING LIST')) {
      var sm = body.match(/\[[\s\S]*?\]/);
      if (sm) try { sections.shopping = JSON.parse(sm[0]); } catch(e) {}
    }
    else if (h.startsWith('AFTER VISION')) {
      var dm = body.match(/\{[\s\S]*\}/);
      if (dm) try { sections.directives = JSON.parse(dm[0]); } catch(e) {}
    }
    else if (sectionNames) {
      Object.keys(sectionNames).forEach(function(key) {
        if (h.startsWith(sectionNames[key].toUpperCase())) sections[key] = body.trim();
      });
    }
  }

  if (!sections.score) {
    var jm2 = raw.match(/\{"overall"\s*:\s*\d+[^}]+\}/);
    if (jm2) try { sections.score = JSON.parse(jm2[0]); } catch(e) {}
  }
  if (!sections.score) sections.score = {overall:0, materials:0, lighting:0, feng_shui:0, ritual:0};
  if (!sections.directives) sections.directives = {windows_visible:true, space_is_dark:false, camera_angle:'slightly elevated', custom_palette:null};
  if (!sections.before && !sections.priority) sections.before = raw;

  return sections;
}

function parseMaterials(raw) {
  return raw.split('\n').map(function(l){ return l.trim(); })
    .filter(function(l){ return l.includes('|'); })
    .map(function(l){
      var p = l.split('|').map(function(s){ return s.trim(); });
      return {name:p[0]||'', where:p[1]||'', why:p[2]||'', spec:p[3]||''};
    })
    .filter(function(m){ return m.name && m.name.length > 1; })
    .slice(0, 7);
}

function parsePriorityChanges(text) {
  var items = [];
  var rx = /^\s*(\d+)[\.\)]\s*([\s\S]*?)(?=\n\s*\d+[\.\)]|\n\n\n|$)/gm;
  var match;
  while ((match = rx.exec(text)) !== null) {
    var block = match[2].trim();
    var mistakeM = block.match(/MISTAKE[:\s]+([^\n]+(?:\n(?!FIX)[^\n]+)*)/i);
    var fixM = block.match(/FIX[:\s]+([^\n]+(?:\n[^\n]+)*)/i);
    var firstLine = block.split('\n')[0].replace(/MISTAKE.*/i,'').replace(/^\*+/,'').trim();
    items.push({label: firstLine || 'Change '+match[1], mistake: mistakeM?mistakeM[1].trim():'', fix: fixM?fixM[1].trim():block});
  }
  if (!items.length) {
    text.split(/\n\n+/).forEach(function(p, i) {
      var c = p.replace(/^\d+[\.\)]\s*/,'').replace(/\*\*/g,'').trim();
      if (c) items.push({label:'Change '+(i+1), mistake:'', fix:c});
    });
  }
  return items.slice(0, 5);
}

function renderText(t) {
  if (!t) return '';
  var lines = t.split('\n'), html = '', inList = false;
  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();
    var isBullet = /^[-•*]\s+/.test(trimmed);
    if (isBullet) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + trimmed.replace(/^[-•*]\s+/,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>') + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (trimmed) html += '<p>' + trimmed.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>') + '</p>';
    }
  }
  if (inList) html += '</ul>';
  return '<div class="as-text">' + html + '</div>';
}

// ── SVG RENDERERS ───────────────────────────────────────────────
function buildFloorPlanSVG(eb, dir) {
  var W=300, H=300, cx=W/2, cy=H/2, r=110;
  var dirs = [
    {d:'N',a:-90,elem:'water',col:'#2c3e6b'},  {d:'NE',a:-45,elem:'earth',col:'#c9912a'},
    {d:'E',a:0,elem:'wood',col:'#4a7c59'},      {d:'SE',a:45,elem:'wood',col:'#4a7c59'},
    {d:'S',a:90,elem:'fire',col:'#c0392b'},      {d:'SW',a:135,elem:'earth',col:'#c9912a'},
    {d:'W',a:180,elem:'metal',col:'#b0b0b0'},    {d:'NW',a:-135,elem:'metal',col:'#b0b0b0'}
  ];
  var svg = '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;margin:0 auto;display:block">';
  svg += '<rect x="40" y="40" width="220" height="220" rx="10" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.1)" stroke-width="1"/>';
  svg += '<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="rgba(255,255,255,.15)"/>';
  dirs.forEach(function(p) {
    var rad = p.a * Math.PI / 180;
    var x2 = cx + r*Math.cos(rad), y2 = cy + r*Math.sin(rad);
    var pct = eb[p.elem] || 0;
    var opac = Math.max(.15, Math.min(.9, pct/40));
    var isAct = p.d === dir;
    svg += '<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="'+p.col+'" stroke-width="'+(isAct?2:1)+'" opacity="'+(isAct?1:.3)+'"/>';
    svg += '<circle cx="'+x2+'" cy="'+y2+'" r="'+(isAct?18:12)+'" fill="'+p.col+'" opacity="'+opac+'" stroke="'+(isAct?'var(--gold)':'none')+'" stroke-width="'+(isAct?2:0)+'"/>';
    svg += '<text x="'+x2+'" y="'+(y2+3)+'" text-anchor="middle" fill="white" font-size="'+(isAct?9:7)+'" font-weight="'+(isAct?700:500)+'">'+p.d+'</text>';
    var lx = cx + (r+28)*Math.cos(rad), ly = cy + (r+28)*Math.sin(rad);
    svg += '<text x="'+lx+'" y="'+(ly+3)+'" text-anchor="middle" fill="'+p.col+'" font-size="6" opacity=".7">'+p.elem+'</text>';
  });
  svg += '</svg>';
  return svg;
}

function renderElemBalance(eb) {
  if (!eb) return '';
  var html = '<div style="margin-top:1rem"><div style="font-size:9px;font-weight:700;letter-spacing:.22em;color:var(--tx3);text-transform:uppercase;margin-bottom:8px">FIVE ELEMENT BALANCE</div>';
  html += '<div class="elem-balance">';
  ELEMENTS.forEach(function(e) {
    var pct = eb[e.key] || 0;
    var st = pct>35 ? '<span style="color:rgba(255,150,150,.8)">Excess</span>'
           : pct>25 ? '<span style="color:var(--warn)">High</span>'
           : pct>=15 ? '<span style="color:var(--success)">Balanced</span>'
           : pct>=5 ? '<span style="color:var(--warn)">Low</span>'
           : '<span style="color:rgba(255,150,150,.8)">Deficient</span>';
    html += '<div class="elem-bar-row"><div class="elem-bar-icon">'+e.icon+'</div><div class="elem-bar-name" style="color:'+e.color+'">'+e.name+'</div><div class="elem-bar-track"><div class="elem-bar-fill" style="width:'+pct+'%;background:'+e.color+'"></div></div><div class="elem-bar-pct" style="color:'+e.color+'">'+pct+'%</div><div class="elem-bar-status">'+st+'</div></div>';
  });
  html += '</div>';
  if (eb.diagnosis) html += '<div class="fs-note-box" style="margin-top:6px">'+eb.diagnosis+'</div>';
  html += '</div>';
  return html;
}

function renderPaletteCircles(palette) {
  var html = '<div style="margin-top:.8rem"><div style="font-size:9px;font-weight:700;letter-spacing:.22em;color:var(--tx3);text-transform:uppercase;margin-bottom:8px">RECOMMENDED COLOUR PALETTE</div>';
  html += '<div class="palette-row">';
  palette.forEach(function(c) {
    html += '<div class="sw"><div class="sw-circle" style="background:'+c.hex+'"></div><div class="sw-lbl">'+c.name+'</div></div>';
  });
  html += '</div></div>';
  return html;
}

function renderPlantCards(plants) {
  if (!plants || !plants.length) return '';
  var html = '<div style="margin-top:.8rem"><div style="font-size:9px;font-weight:700;letter-spacing:.22em;color:var(--tx3);text-transform:uppercase;margin-bottom:8px">PLANT PRESCRIPTIONS</div>';
  html += '<div class="plant-rx">';
  plants.forEach(function(p) {
    html += '<div class="plant-card"><div class="plant-icon">'+(p.icon||'🌿')+'</div><div><div class="plant-name">'+p.name+'</div><div class="plant-latin">'+(p.latin||'')+'</div><div class="plant-desc">'+(p.reason||'')+'</div><div class="plant-place">📍 '+(p.placement||'')+'</div></div></div>';
  });
  html += '</div></div>';
  return html;
}

function renderFloorPlanSection(eb, dir) {
  if (!eb) return '';
  return '<div style="margin-top:.8rem"><div style="font-size:9px;font-weight:700;letter-spacing:.22em;color:var(--tx3);text-transform:uppercase;margin-bottom:8px">ELEMENTAL FLOOR PLAN</div>' +
         '<div class="floor-plan-wrap">' + buildFloorPlanSVG(eb, dir) + '</div></div>';
}

// ── PROMPT BUILDERS ─────────────────────────────────────────────
function buildValidationPrompt(config) {
  return 'You are a professional interior design analyst. Look at this image.\n' +
    'Valid spaces: ' + config.validSpaces.join(', ') + '.\n' +
    'Invalid spaces: ' + config.invalidSpaces.join(', ') + '.\n' +
    'Respond ONLY in this JSON format:\n' +
    '{"is_valid":true or false,"space_type":"brief label","rejection_reason":"If not valid: one warm friendly sentence. If valid: empty string."}';
}

function buildCorePrompt(state, fs, config) {
  var tod = state.tod === 'day' ? 'morning/midday natural light' : 'evening artificial light';
  var styleDesc = config.styleMap[state.style] || 'warm natural';
  var personality = '';
  if (config.personalityFields) {
    config.personalityFields.forEach(function(f) {
      if (state[f.key]) personality += f.label + ': ' + state[f.key] + '. ';
    });
  }

  var prompt = 'You are a certified Marmaroph Healthy Home designer, Compass Feng Shui expert, and ' + config.expertTitle + '. Analyse this ' + tod + ' photo of a ' + state.spaceType + ' being used as ' + config.spaceLabel + '.\n\n' +
    'COMPASS CONTEXT: Direction ' + state.dir + ' — ' + fs.trig + ' (' + fs.chi + ') · ' + fs.elem + ' element · ' + fs.energy + '\n' + fs.note + '\n\n' +
    'STYLE PREFERENCE: ' + styleDesc + '\n\n' +
    (personality ? 'CONTEXT: ' + personality + '\n\n' : '') +
    'MARMAROPH FRAMEWORK:\n' +
    'APPROVED MATERIALS: Solid hardwoods with natural oil/beeswax finish, honed natural stone, terracotta, unglazed ceramic, linen/wool/cotton, rattan/bamboo, copper/brass.\n' +
    'ELIMINATE: MDF, particle board, vinyl, plastic laminates, synthetic fragrance, artificial plants, cluttered papers.\n' +
    'LIGHTING: Day 2700–3000K max. Evening ≤2700K transitioning to ≤2200K candlelight.\n' +
    'COLOURS: 60% warm ivory base, 30% natural mid-tone, 10% accent.\n' +
    config.essentials + '\n\n' +
    'Structure your response with EXACTLY these section headers (use ##):\n\n' +
    '## THE BEFORE STATE\n' +
    'Bullet-point inventory of everything you observe:\n' +
    '- Surface/Furniture: [type, material, size, condition]\n' +
    '- Seating: [if visible]\n' +
    '- Lighting: [type, estimated CCT, quality]\n' +
    '- Walls: [colour, texture, art]\n' +
    '- Plants: [present/absent, type, condition]\n' +
    '- Objects: [what is on/around the surface]\n' +
    '- Clutter level: [specific items that should not be here]\n' +
    '- Overall energy: [one sentence]\n\n' +
    '## FENG SHUI READING — ' + state.dir + ' · ' + fs.elem + '\n' +
    'Use bullet points:\n' +
    '- What supports the ' + fs.elem + ' element and ' + fs.energy + ' in this space\n' +
    '- What conflicts with or drains the ' + fs.elem + ' energy\n' +
    '- How energy flows (or stagnates) here\n' +
    '- Specific Feng Shui cures for this direction\n' +
    '- One sentence of encouragement\n\n' +
    config.analysisSection + '\n\n' +
    '## THE FIVE PRIORITY CHANGES\n' +
    'Number 1–5. For each:\nMISTAKE: [specific]\nFIX: [exact solution with materials, size, placement]\n\n' +
    '## WHAT TO KEEP\nBullet points. Be generous where warranted.\n\n' +
    '## MATERIALS SPECIFICATION\n' +
    'List exactly 5–7 natural materials. Format per line:\nMATERIAL_NAME | where_to_use | why_chosen | product_spec\n\n' +
    '## FIVE ELEMENT BALANCE\n' +
    'Analyse the five feng shui elements (Wood, Fire, Earth, Metal, Water) present in this space based on colours, materials, shapes, and objects you observe. Reply with ONLY a single-line JSON:\n' +
    '{"wood":0,"fire":0,"earth":0,"metal":0,"water":0,"dominant":"element_name","deficient":"element_name","diagnosis":"One sentence describing the imbalance and its effect on ' + config.diagnosisContext + '."}\n' +
    'Each value is a percentage (0–100). All five must sum to 100.\n\n' +
    '## PLANT PRESCRIPTIONS\n' +
    'Based on the element balance, compass direction, and that this is ' + config.spaceLabel + ', recommend 2–3 specific plants. Reply with ONLY a single-line JSON array:\n' +
    '[{"name":"Common Name","latin":"Latin name","icon":"emoji","element":"wood/fire/earth/metal/water","placement":"compass direction and specific spot","reason":"Why this plant for this space"}]\n\n' +
    '## SPACE SCORE\n' +
    'Score BEFORE transformation. Reply with ONLY a single-line JSON:\n' +
    config.scoreFormat + '\n\n' +
    '## SHOPPING LIST\n' +
    'Reply with ONLY a single-line JSON array:\n' +
    '[{"n":"item name","c":"category","s":"search query","t":"why they need this","p":"high or medium"}]\n' +
    'Include 6–10 items.\n\n' +
    '## AFTER VISION DIRECTIVES\n' +
    'Reply with ONLY a single-line JSON:\n' +
    config.directivesFormat + '\n\n' +
    'Tone: Marmaroph voice — warm, intelligent, authoritative. Never generic. Address the reader directly. Use bullet points throughout.';

  return prompt;
}

function buildImagePrompt(state, fs, directives, isNight, config) {
  var d = directives || {};
  var palette = (d.custom_palette || fs.palette).map(function(p){ return p.name; }).join(', ');
  var styleLabel = config.styleMap[state.style] || 'warm natural';
  var lightDesc = isNight
    ? 'Warm evening glow from ' + (d.light_layers || ['table lamp','candle']).join(' + ') + '. 2200K amber. No overhead. Moon visible if window in frame.'
    : 'Bright natural daylight from windows. 3000K warm. Crisp morning air feeling.';

  return 'Generate a photorealistic interior photograph of ' + config.imageContext + '. ' +
    'Palette: ' + palette + '. Style: ' + styleLabel + '. ' +
    'Camera angle: ' + (d.camera_angle || 'slightly elevated showing the full space') + '. ' +
    lightDesc + ' ' +
    (d.windows_visible !== false ? 'Windows visible with natural light.' : '') + ' ' +
    config.imageExtras(d) + ' ' +
    'Natural materials only: solid wood, linen, wool, cotton, stone, brass, ceramic. ' +
    'No people, no text, no watermarks, no logos. ' +
    'Photographic style: real lived-in home, not a showroom. Soft, warm, slightly desaturated. ' +
    'Keep the architecture exactly as photographed: walls, windows, doors, ceiling, floor. Change only furniture, decor, textiles, plants, lighting and wall finishes.';
}

// ── SHARED CSS (injected into tools that need it) ───────────────
var SHARED_CSS = '\n' +
  '.palette-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:.85rem}\n' +
  '.sw{display:flex;flex-direction:column;align-items:center;gap:4px;width:60px}\n' +
  '.sw-circle{width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.1);box-shadow:0 2px 8px rgba(0,0,0,.25)}\n' +
  '.sw-lbl{font-size:7px;font-weight:500;color:var(--tx2);text-align:center;line-height:1.3}\n' +
  '.sw-elem-tag{font-size:6px;font-weight:600;color:var(--tx3);letter-spacing:.08em;text-transform:uppercase}\n' +
  '.elem-balance{margin-bottom:1rem}\n' +
  '.elem-bar-row{display:flex;align-items:center;gap:6px;margin-bottom:6px}\n' +
  '.elem-bar-icon{font-size:12px;width:20px;text-align:center;flex-shrink:0}\n' +
  '.elem-bar-name{font-size:9px;font-weight:600;width:40px;flex-shrink:0}\n' +
  '.elem-bar-track{flex:1;height:7px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}\n' +
  '.elem-bar-fill{height:100%;border-radius:4px;transition:width .6s ease}\n' +
  '.elem-bar-pct{font-size:8px;font-weight:700;width:28px;flex-shrink:0;text-align:right}\n' +
  '.elem-bar-status{font-size:7px;font-weight:600;width:52px;flex-shrink:0;text-align:right}\n' +
  '.plant-rx{display:flex;flex-direction:column;gap:7px;margin-bottom:.85rem}\n' +
  '.plant-card{background:var(--card);border:1px solid var(--card-bd);border-radius:9px;padding:.7rem .8rem;display:flex;gap:9px;align-items:flex-start}\n' +
  '.plant-icon{font-size:20px;flex-shrink:0}\n' +
  '.plant-name{font-size:11px;font-weight:700;color:var(--gold)}\n' +
  '.plant-latin{font-size:9px;font-style:italic;color:var(--sky);margin-bottom:2px}\n' +
  '.plant-desc{font-size:10px;font-weight:300;color:var(--tx2);line-height:1.55}\n' +
  '.plant-place{display:inline-block;margin-top:3px;background:rgba(212,179,102,.1);border:1px solid var(--card-bd);border-radius:4px;padding:2px 7px;font-size:7px;font-weight:600;color:var(--gold);letter-spacing:.05em}\n' +
  '.floor-plan-wrap{display:flex;justify-content:center;margin-bottom:.85rem}\n';

// ── HOME MAP (localStorage-based, shared across rituals) ────────
var HOME_MAP_KEY = 'marmaroph_home_map';

function getHomeMap() {
  try { return JSON.parse(localStorage.getItem(HOME_MAP_KEY)); } catch(e) { return null; }
}
function saveHomeMap(map) {
  try { localStorage.setItem(HOME_MAP_KEY, JSON.stringify(map)); } catch(e) {}
}
function hasHomeMap() {
  return !!getHomeMap();
}

// ── ANALYSIS HISTORY (localStorage, per member per ritual) ──────
function getAnalysisHistory(ritualId) {
  try { return JSON.parse(localStorage.getItem('sa_history_' + ritualId)) || []; } catch(e) { return []; }
}
function saveAnalysis(ritualId, entry) {
  var history = getAnalysisHistory(ritualId);
  entry.timestamp = new Date().toISOString();
  history.unshift(entry);
  if (history.length > 10) history = history.slice(0, 10);
  try { localStorage.setItem('sa_history_' + ritualId, JSON.stringify(history)); } catch(e) {}
}

// ── HOUSEHOLD PROFILE (localStorage, shared across rituals) ────
var PROFILE_KEY = 'marmaroph_household';

function calcKua(birthYear, gender) {
  var y = birthYear;
  var sum = 0;
  while (y > 0) { sum += y % 10; y = Math.floor(y / 10); }
  while (sum > 9) { var s2 = 0; while (sum > 0) { s2 += sum % 10; sum = Math.floor(sum / 10); } sum = s2; }
  if (gender === 'female') {
    var k = sum + 5;
    while (k > 9) { var s3 = 0; while (k > 0) { s3 += k % 10; k = Math.floor(k / 10); } k = s3; }
    return k === 5 ? 8 : k;
  } else {
    var k2 = 11 - sum;
    while (k2 > 9) { var s4 = 0; while (k2 > 0) { s4 += k2 % 10; k2 = Math.floor(k2 / 10); } k2 = s4; }
    return k2 === 5 ? 2 : k2;
  }
}

var KUA_DATA = {
  1: {group:'East',  elem:'Water', favor:['SE','E','S','N'],  unfavor:['NW','W','NE','SW'], best:'SE', health:'E', romance:'S', stability:'N'},
  2: {group:'West',  elem:'Earth', favor:['NE','W','NW','SW'], unfavor:['E','SE','S','N'],  best:'NE', health:'W', romance:'NW', stability:'SW'},
  3: {group:'East',  elem:'Wood',  favor:['S','N','SE','E'],   unfavor:['SW','NE','NW','W'], best:'S',  health:'N', romance:'SE', stability:'E'},
  4: {group:'East',  elem:'Wood',  favor:['N','S','E','SE'],   unfavor:['W','NW','SW','NE'], best:'N',  health:'S', romance:'E',  stability:'SE'},
  6: {group:'West',  elem:'Metal', favor:['W','NE','SW','NW'], unfavor:['SE','E','N','S'],   best:'W',  health:'NE', romance:'SW', stability:'NW'},
  7: {group:'West',  elem:'Metal', favor:['NW','SW','NE','W'], unfavor:['N','S','SE','E'],   best:'NW', health:'SW', romance:'NE', stability:'W'},
  8: {group:'West',  elem:'Earth', favor:['SW','NW','W','NE'], unfavor:['S','N','E','SE'],   best:'SW', health:'NW', romance:'W',  stability:'NE'},
  9: {group:'East',  elem:'Fire',  favor:['E','SE','N','S'],   unfavor:['NE','SW','W','NW'], best:'E',  health:'SE', romance:'N',  stability:'S'}
};

function getKuaInfo(kua) { return KUA_DATA[kua] || null; }

function getHousehold() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {members:[], goals:[]}; }
  catch(e) { return {members:[], goals:[]}; }
}
function saveHousehold(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch(e) {}
}
function hasHousehold() {
  var p = getHousehold();
  return p.members && p.members.length > 0;
}

function buildHouseholdPromptContext(ritualKey) {
  var h = getHousehold();
  if (!h.members || h.members.length === 0) return '';

  var lines = ['HOUSEHOLD PROFILE (use for personalised Feng Shui recommendations):'];
  h.members.forEach(function(m, i) {
    var parts = ['Person ' + (i+1) + ': ' + (m.name || 'Member')];
    if (m.role) parts.push('Role: ' + m.role);
    if (m.birthYear && m.gender) {
      var kua = calcKua(m.birthYear, m.gender);
      var info = getKuaInfo(kua);
      if (info) {
        parts.push('Kua Number: ' + kua + ' (' + info.group + ' Group, ' + info.elem + ' element)');
        parts.push('Favorable directions: ' + info.favor.join(', '));
        parts.push('Best for prosperity: ' + info.best + ', Health: ' + info.health + ', Romance: ' + info.romance + ', Stability: ' + info.stability);
        parts.push('Unfavorable directions: ' + info.unfavor.join(', '));
      }
    }
    if (m.birthDate) parts.push('Born: ' + m.birthDate + (m.birthTime ? ' at ' + m.birthTime : '') + (m.birthPlace ? ', ' + m.birthPlace : ''));
    if (m.sleepQuality) parts.push('Sleep: ' + m.sleepQuality);
    if (m.healthGoals) parts.push('Health goals: ' + m.healthGoals);
    if (m.lifeGoals) parts.push('Life focus: ' + m.lifeGoals);
    lines.push(parts.join('\n  '));
  });
  if (h.dynamics) lines.push('Relationship dynamics: ' + h.dynamics);
  if (h.privacyNeeds) lines.push('Privacy vs connection: ' + h.privacyNeeds);
  if (h.goals && h.goals.length > 0) lines.push('Household goals: ' + h.goals.join(', '));

  lines.push('');
  lines.push('IMPORTANT: Cross-reference each person\'s Kua number with the room\'s compass direction. If the room direction is unfavorable for a primary occupant, recommend specific Feng Shui cures (element cycles, colors, placement adjustments). If favorable, amplify that energy.');

  return lines.join('\n');
}

var HOUSEHOLD_CSS =
  '.hp-section{background:var(--card);border:1px solid var(--card-bd);border-radius:14px;padding:1rem;margin-bottom:1.2rem}\n' +
  '.hp-title{font-size:12px;font-weight:700;color:var(--gold);letter-spacing:.04em;margin-bottom:.6rem;display:flex;align-items:center;gap:6px}\n' +
  '.hp-subtitle{font-size:9px;font-weight:300;color:var(--tx3);margin-bottom:.8rem;line-height:1.6}\n' +
  '.hp-member{background:rgba(212,179,102,.06);border:1px solid var(--card-bd);border-radius:10px;padding:.75rem;margin-bottom:.6rem;position:relative}\n' +
  '.hp-member-name{font-size:11px;font-weight:600;color:var(--tx)}\n' +
  '.hp-member-kua{font-size:9px;color:var(--sky);margin-top:2px}\n' +
  '.hp-member-detail{font-size:9px;color:var(--tx3);margin-top:2px;line-height:1.5}\n' +
  '.hp-remove{position:absolute;top:6px;right:8px;background:none;border:none;color:var(--tx4);font-size:14px;cursor:pointer;padding:2px 6px}\n' +
  '.hp-remove:hover{color:var(--danger,#c0392b)}\n' +
  '.hp-add-btn{width:100%;background:none;border:1.5px dashed var(--card-bd);border-radius:10px;padding:.6rem;color:var(--tx3);font-size:10px;font-weight:500;cursor:pointer;transition:all .2s}\n' +
  '.hp-add-btn:hover{border-color:var(--accent-pop,var(--sky));color:var(--accent-pop,var(--sky))}\n' +
  '.hp-form{background:rgba(212,179,102,.04);border:1px solid var(--card-bd);border-radius:10px;padding:.75rem;margin-bottom:.6rem}\n' +
  '.hp-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}\n' +
  '.hp-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px}\n' +
  '.hp-field label{font-size:8px;font-weight:600;letter-spacing:.05em;color:var(--tx3);display:block;margin-bottom:3px}\n' +
  '.hp-field input,.hp-field select,.hp-field textarea{width:100%;background:var(--bg);border:1px solid var(--card-bd);border-radius:8px;padding:7px 8px;font-size:10px;font-family:inherit;color:var(--tx);outline:none;transition:border .2s}\n' +
  '.hp-field input:focus,.hp-field select:focus,.hp-field textarea:focus{border-color:var(--accent-pop,var(--sky))}\n' +
  '.hp-field textarea{min-height:50px;resize:vertical;line-height:1.5}\n' +
  '.hp-dynamics{margin-top:.5rem}\n' +
  '.hp-saved{display:inline-block;font-size:9px;color:var(--sky);font-weight:500;opacity:0;transition:opacity .3s}\n' +
  '.hp-saved.show{opacity:1}\n' +
  '.hp-kua-badge{display:inline-block;background:linear-gradient(135deg,rgba(159,214,235,.15),rgba(4,65,71,.08));border:1px solid rgba(159,214,235,.3);border-radius:6px;padding:2px 8px;font-size:8px;font-weight:700;color:var(--sky);letter-spacing:.03em;margin-left:6px}\n' +
  '.hp-dir-tag{display:inline-block;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700;letter-spacing:.04em;margin:1px}\n' +
  '.hp-dir-good{background:rgba(46,139,87,.1);color:#2e8b57}\n' +
  '.hp-dir-bad{background:rgba(192,57,43,.08);color:#c0392b}\n';

function buildHouseholdHTML(containerId, onSaveCallback) {
  return '<div class="hp-section" id="' + containerId + '">' +
    '<div class="hp-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> Who Lives Here</div>' +
    '<div class="hp-subtitle">Your Kua number and personal element determine which compass directions support you. This lets us give you truly personalised Feng Shui recommendations for every room.</div>' +
    '<div id="hpMembers"></div>' +
    '<button class="hp-add-btn" id="hpAddBtn" onclick="window._hpAddMember()">+ Add a person</button>' +
    '<div class="hp-dynamics" style="margin-top:.8rem">' +
    '<div class="hp-field"><label>HOUSEHOLD DYNAMICS</label><textarea id="hpDynamics" placeholder="How do you share this space? Any privacy or connection needs, daily routines that overlap or conflict..." onchange="window._hpSave()"></textarea></div>' +
    '</div>' +
    '<div class="hp-saved" id="hpSaved">Saved</div>' +
    '</div>';
}

function initHouseholdUI(onSaveCallback) {
  var h = getHousehold();

  function renderMembers() {
    var el = document.getElementById('hpMembers');
    if (!el) return;
    if (!h.members || h.members.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = h.members.map(function(m, i) {
      var kua = (m.birthYear && m.gender) ? calcKua(m.birthYear, m.gender) : null;
      var info = kua ? getKuaInfo(kua) : null;
      var kuaLine = info ? '<span class="hp-kua-badge">Kua ' + kua + ' · ' + info.elem + ' · ' + info.group + ' Group</span>' : '';
      var dirLine = '';
      if (info) {
        dirLine = '<div style="margin-top:4px">' +
          info.favor.map(function(d){ return '<span class="hp-dir-tag hp-dir-good">' + d + '</span>'; }).join('') +
          info.unfavor.map(function(d){ return '<span class="hp-dir-tag hp-dir-bad">' + d + '</span>'; }).join('') +
          '</div>';
      }
      var details = [];
      if (m.birthDate) details.push('Born ' + m.birthDate + (m.birthTime ? ' at ' + m.birthTime : ''));
      if (m.role) details.push(m.role);
      if (m.lifeGoals) details.push('Focus: ' + m.lifeGoals);
      if (m.healthGoals) details.push('Health: ' + m.healthGoals);
      if (m.sleepQuality) details.push('Sleep: ' + m.sleepQuality);
      return '<div class="hp-member">' +
        '<button class="hp-remove" onclick="window._hpRemove(' + i + ')">&times;</button>' +
        '<div class="hp-member-name">' + (m.name || 'Person ' + (i+1)) + kuaLine + '</div>' +
        (details.length ? '<div class="hp-member-detail">' + details.join(' · ') + '</div>' : '') +
        dirLine +
        '</div>';
    }).join('');
  }

  function showForm() {
    var el = document.getElementById('hpMembers');
    if (!el) return;
    el.innerHTML += '<div class="hp-form" id="hpForm">' +
      '<div class="hp-row"><div class="hp-field"><label>NAME</label><input id="hpName" placeholder="First name"></div>' +
      '<div class="hp-field"><label>ROLE</label><select id="hpRole"><option value="">Select...</option><option>Lives here full-time</option><option>Partner</option><option>Child</option><option>Roommate</option><option>Part-time resident</option></select></div></div>' +
      '<div class="hp-row3"><div class="hp-field"><label>DATE OF BIRTH</label><input type="date" id="hpDob"></div>' +
      '<div class="hp-field"><label>TIME OF BIRTH</label><input type="time" id="hpBirthTime"><div style="font-size:7px;color:var(--tx4);margin-top:2px">Optional but improves accuracy</div></div>' +
      '<div class="hp-field"><label>GENDER (for Kua)</label><select id="hpGender"><option value="">Select...</option><option value="male">Male</option><option value="female">Female</option></select></div></div>' +
      '<div class="hp-field" style="margin-bottom:8px"><label>BIRTH PLACE</label><input id="hpBirthPlace" placeholder="City, country (optional)"></div>' +
      '<div class="hp-field" style="margin-bottom:8px"><label>WHAT AREA OF LIFE DO YOU WANT TO FOCUS ON?</label><textarea id="hpLifeGoals" placeholder="Career growth, financial security, better sleep, more energy, relationships, creativity..."></textarea></div>' +
      '<div class="hp-field" style="margin-bottom:8px"><label>HEALTH OR WELLBEING GOALS</label><textarea id="hpHealthGoals" placeholder="Better sleep, more movement, stress management, nutrition..."></textarea></div>' +
      '<div class="hp-field" style="margin-bottom:8px"><label>SLEEP QUALITY</label><select id="hpSleep"><option value="">Select...</option><option>Great, no issues</option><option>Generally good</option><option>Struggle to fall asleep</option><option>Wake up during the night</option><option>Wake up tired</option><option>Insomnia</option></select></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button style="background:none;border:1px solid var(--card-bd);border-radius:8px;padding:6px 14px;font-size:10px;color:var(--tx3);cursor:pointer" onclick="document.getElementById(\'hpForm\').remove()">Cancel</button>' +
      '<button style="background:var(--accent-mid,#044147);border:none;border-radius:8px;padding:6px 14px;font-size:10px;color:#fff;font-weight:600;cursor:pointer" onclick="window._hpSaveMember()">Save Person</button>' +
      '</div></div>';
  }

  window._hpAddMember = function() {
    if (document.getElementById('hpForm')) return;
    showForm();
  };

  window._hpSaveMember = function() {
    var name = document.getElementById('hpName').value.trim();
    var dob = document.getElementById('hpDob').value;
    var gender = document.getElementById('hpGender').value;
    var role = document.getElementById('hpRole').value;
    var birthTime = document.getElementById('hpBirthTime').value;
    var birthPlace = document.getElementById('hpBirthPlace').value.trim();
    var lifeGoals = document.getElementById('hpLifeGoals').value.trim();
    var healthGoals = document.getElementById('hpHealthGoals').value.trim();
    var sleep = document.getElementById('hpSleep').value;

    if (!name) { alert('Please enter a name.'); return; }

    var member = {name:name, role:role, birthPlace:birthPlace, lifeGoals:lifeGoals, healthGoals:healthGoals, sleepQuality:sleep};
    if (dob) {
      member.birthDate = dob;
      member.birthYear = parseInt(dob.split('-')[0], 10);
    }
    if (birthTime) member.birthTime = birthTime;
    if (gender) member.gender = gender;

    h.members.push(member);
    saveHousehold(h);
    renderMembers();
    flashSaved();
    if (onSaveCallback) onSaveCallback(h);
  };

  window._hpRemove = function(idx) {
    h.members.splice(idx, 1);
    saveHousehold(h);
    renderMembers();
    flashSaved();
    if (onSaveCallback) onSaveCallback(h);
  };

  window._hpSave = function() {
    var dyn = document.getElementById('hpDynamics');
    if (dyn) h.dynamics = dyn.value.trim();
    saveHousehold(h);
    flashSaved();
    if (onSaveCallback) onSaveCallback(h);
  };

  function flashSaved() {
    var el = document.getElementById('hpSaved');
    if (el) { el.classList.add('show'); setTimeout(function(){ el.classList.remove('show'); }, 1500); }
  }

  renderMembers();
  var dynEl = document.getElementById('hpDynamics');
  if (dynEl && h.dynamics) dynEl.value = h.dynamics;
}

// ── RITUAL CONFIGS ──────────────────────────────────────────────
var RITUAL_CONFIGS = {

  // ── QUIET ABUNDANCE ───────────────────────────────────────────
  quietAbundance: {
    ritualId: 'quiet_abundance',
    name: 'Abundance Corner Analyser',
    pillar: 'Quiet Abundance',
    spaceLabel: 'an abundance corner, home office, or financial ritual space',
    expertTitle: 'Quiet Abundance ritual designer',
    usageKey: 'qa_space_usage',
    limit: 3,
    validSpaces: ['desk','home office','study','corner','nook','workspace','reading corner','bureau','writing desk','bookshelf area','vanity area','living room corner','bedroom corner'],
    invalidSpaces: ['bathroom','toilet','shower','kitchen sink','laundry','garage','car interior','outdoor construction site'],
    styleMap: {
      japandi:'Japandi: calm, low, natural wood, minimal, clean lines',
      modern_organic:'Modern Organic: soft curves, natural materials, warm neutrals',
      warm_med:'Warm Minimal / Mediterranean: limewash, arches, stone, linen',
      scandinavian:'Scandinavian: light, bright, functional, cozy textiles',
      natural_boho:'Natural Boho: rattan, jute, plants, layered textures',
      classic:'Classic Contemporary: tailored, timeless, balanced'
    },
    personalityFields: [
      {key:'spot',  label:'This space is'},
      {key:'feel',  label:'It currently feels'},
      {key:'calm',  label:'Calm level'},
      {key:'money', label:'Money comfort'},
      {key:'safe',  label:'Safety feeling'},
      {key:'goal',  label:'Financial goal'}
    ],
    scoreFormat: '{"overall":0,"materials":0,"lighting":0,"feng_shui":0,"ritual":0,"abundance":0}\nmaterials/lighting/feng_shui/ritual each out of 25, abundance out of 25, overall out of 100. Be critical.',
    diagnosisContext: 'financial ritual and abundance energy',
    essentials: 'ABUNDANCE ESSENTIALS: Solid natural-finish desk. Beeswax or soy candle. Cash-flow notebook. One meaningful wealth symbol. Zero clutter within arm\'s reach.',
    analysisSection: '## ABUNDANCE DESIGN ANALYSIS\n' +
      'This section addresses the space as a financial ritual zone. Bullet points:\n' +
      '1. RITUAL READINESS: Can someone sit here, light a candle, open their finances, and feel calm? What prevents it?\n' +
      '2. SENSORY LAYERS: What does this space sound like, smell like, feel like? What is missing?\n' +
      '3. INTENTIONALITY: Does every object here earn its place? What must be removed for clarity?\n' +
      '4. LIGHTING LAYERS: What light sources exist? What is needed for day vs night ritual use?\n' +
      '5. WEALTH SYMBOLS: Are there objects representing growth, flow, or abundance? What could be added?',
    directivesFormat: '{"windows_visible":true,"space_is_dark":false,"camera_angle":"slightly elevated showing the full desk area","light_layers":["desk lamp","candle"],"custom_palette":null}',
    imageContext: 'a refined abundance corner, home office, or financial ritual workspace',
    imageExtras: function(d) {
      return 'Include: a solid hardwood desk with natural finish, a lit beeswax candle, a closed journal, one small plant, minimal decor. ';
    },
    directionExtras: {
      N:  {desk:'Natural wood with oil finish', light_day:'2700K warm, maximize natural light.', light_night:'Desk lamp + candle at 2200K amber.', scents:['Frankincense','Sandalwood','Vetiver'], fit:'supportive',
           note:'Water energy brings flow and opportunity. For an abundance corner facing North, activate the productive cycle: Water feeds Wood. Add a living plant and solid wood elements to channel career wealth.'},
      NE: {desk:'Stone or ceramic surfaces', light_day:'2700K warm, natural light dominant.', light_night:'Copper desk lamp + beeswax candle at 2200K.', scents:['Cedarwood','Bergamot','Clary Sage'], fit:'moderate',
           note:'Earth energy grounds financial decisions in wisdom. Activate with Fire touches: copper, amber light, warm ceramics. Clarity before spending.'},
      E:  {desk:'Solid hardwood, light oak or ash', light_day:'Full natural light, green filtered through plants.', light_night:'Brass desk lamp + green-tinted glass candle holder.', scents:['Eucalyptus','Rosemary','Lemongrass'], fit:'strong',
           note:'Wood energy supports growth and new financial chapters. Strengthen with living plants, natural wood, and Water accents.'},
      SE: {desk:'Rich wood with brass accents', light_day:'Abundant natural light, windows unobstructed.', light_night:'Warm brass lamp + cluster of beeswax candles.', scents:['Cinnamon','Orange','Ylang Ylang'], fit:'ideal',
           note:'THE wealth corner in Feng Shui. Southeast is the most powerful direction for abundance. Activate fully with lush plants, flowing water features, and Wood element.'},
      S:  {desk:'Dark wood with copper accents', light_day:'Bright, warm natural light.', light_night:'Statement desk lamp + taper candles.', scents:['Cinnamon','Clove','Rose'], fit:'strong',
           note:'Fire energy drives recognition and reputation: your financial confidence becomes visible. Activate with warm reds, candles, and pointed upward energy.'},
      SW: {desk:'Marble or stone top, warm wood legs', light_day:'Soft warm light, gentle not harsh.', light_night:'Paired table lamps + floating candles.', scents:['Rose','Jasmine','Sandalwood'], fit:'moderate',
           note:'Earth energy here governs partnerships and shared finances. Ground it with ceramics, stone, and warm textiles.'},
      W:  {desk:'Metal-framed desk or polished wood', light_day:'Clean bright light, crisp and clear.', light_night:'Brushed brass desk lamp + single pillar candle.', scents:['Peppermint','Tea Tree','Lemon'], fit:'supportive',
           note:'Metal energy brings precision, clarity, and creative solutions to finances. Activate with metallic accents, round shapes, and white/cream tones.'},
      NW: {desk:'Dark wood or metal with gold accents', light_day:'Strong natural light, organized clarity.', light_night:'Architectural desk lamp + gold-rimmed candle holder.', scents:['Frankincense','Myrrh','White Sage'], fit:'strong',
           note:'Metal energy in the NW attracts mentors and financial guidance. Strengthen with gold/silver objects and clear organization.'}
    }
  },

  // ── MINDFUL EATING ────────────────────────────────────────────
  mindfulEating: {
    ritualId: 'mindful_eating',
    name: 'Ritual Space Analyser',
    pillar: 'Mindful Eating',
    spaceLabel: 'a mindful dining and nourishment space',
    expertTitle: 'Mindful Eating ritual designer',
    usageKey: 'me_space_usage',
    limit: 3,
    validSpaces: ['dining room','dining area','kitchen table','breakfast nook','eating area','dining table','kitchen island','counter','bar area','patio dining','balcony dining','outdoor dining'],
    invalidSpaces: ['bathroom','toilet','shower','laundry','garage','car interior','construction site','office desk with no food context'],
    styleMap: {
      japandi:'Japandi: calm, low, natural wood, minimal, clean lines',
      modern_organic:'Modern Organic: soft curves, natural materials, warm neutrals',
      warm_med:'Warm Minimal / Mediterranean: limewash, arches, stone, linen',
      scandinavian:'Scandinavian: light, bright, functional, cozy textiles',
      natural_boho:'Natural Boho: rattan, jute, plants, layered textures',
      classic:'Classic Contemporary: tailored, timeless, balanced'
    },
    personalityFields: [
      {key:'spot',  label:'This space is'},
      {key:'feel',  label:'It currently feels'},
      {key:'calm',  label:'Calm level'},
      {key:'goal',  label:'Dining goal'}
    ],
    scoreFormat: '{"overall":0,"materials":0,"lighting":0,"feng_shui":0,"ritual":0}\nmaterials/lighting/feng_shui/ritual each out of 25, overall out of 100. Be critical.',
    diagnosisContext: 'mindful eating and nourishment energy',
    essentials: 'DINING ESSENTIALS: Solid natural wood or stone table. Linen placemats or cloth napkins. Beeswax or soy candle. One small plant or fresh herbs. Zero screens or papers on the table during meals.',
    analysisSection: '## LIGHT · COLOUR · TEXTURE\n' +
      'Address each layer with bullet points. Use the exact numbered heading:\n' +
      '1. NATURAL LIGHT: Is the natural light sufficient? Explain WHY natural light is non-negotiable (circadian health, emotional regulation, living quality of a nourishment space) and give 2-3 practical solutions if insufficient.\n' +
      '2. COLOUR BALANCE: Is this space too monochromatic? If yes: which specific textile tones, ceramic glazes, plant colours, or art shades would bring depth and Feng Shui balance. Be specific.\n' +
      '3. LIGHTING LAYERS: Name which light sources are missing. Explain the role each plays.\n' +
      '4. RUG: Does this floor need a rug? If yes: recommend specific material, weave, colour, approximate size.\n' +
      '5. WALL ART: Are the walls too bare? Describe exactly what would work.',
    directivesFormat: '{"windows_visible":true,"space_is_dark":false,"camera_angle":"slightly elevated showing the full dining area","light_layers":["pendant","table candle","floor lamp"],"custom_palette":null}',
    imageContext: 'a refined mindful dining space set for a nourishing meal',
    imageExtras: function(d) {
      return 'Include: a natural wood dining table set with linen placemats, ceramic plates, a lit candle, a small herb plant, and one or two chairs. ';
    },
    directionExtras: {
      N:  {table:'Round or oval', light_day:'2700K warm white, maximize natural light.', light_night:'Floor lamp + wall sconce at ≤2200K amber. No overhead after 7pm.', matSwatch:'#3a2010',
           scents:[{name:'Frankincense',note:'Grounding and introspective',emoji:'💧'},{name:'Sandalwood',note:'Warm and centering',emoji:'🪵'},{name:'Vetiver',note:'Earthy and calming',emoji:'🌿'}],
           note:'Water energy brings flow and reflection. Activate the productive cycle — Water feeds Wood — by introducing a tall floor plant and solid wood furniture.'},
      NE: {table:'Square or rectangular', light_day:'2700K warm, natural light from windows.', light_night:'Copper pendant + beeswax candle at 2200K.', matSwatch:'#c8b090',
           scents:[{name:'Cedarwood',note:'Wisdom and clarity',emoji:'🌲'},{name:'Bergamot',note:'Uplifting and fresh',emoji:'🍊'},{name:'Clary Sage',note:'Centering',emoji:'🌿'}],
           note:'Earth energy grounds decisions in wisdom. Activate with Fire touches: copper, amber light, warm ceramics.'},
      E:  {table:'Round or oval in solid wood', light_day:'Full natural light, green filtered through plants.', light_night:'Brass pendant + green-tinted glass candle holder.', matSwatch:'#2a5438',
           scents:[{name:'Eucalyptus',note:'Refreshing and cleansing',emoji:'🌿'},{name:'Rosemary',note:'Stimulates digestion',emoji:'🌿'},{name:'Lemongrass',note:'Light and energising',emoji:'🍋'}],
           note:'Wood energy supports growth and new beginnings. Strengthen with living plants, natural wood, and Water accents.'},
      SE: {table:'Round or oval', light_day:'Abundant natural light, windows unobstructed.', light_night:'Warm brass pendant + cluster of beeswax candles.', matSwatch:'#1a4828',
           scents:[{name:'Cinnamon',note:'Warming and abundant',emoji:'🌶️'},{name:'Orange',note:'Joyful and uplifting',emoji:'🍊'},{name:'Ylang Ylang',note:'Sweet and sensual',emoji:'🌺'}],
           note:'The wealth corner. Southeast is powerful for abundance in all forms — nourishment included.'},
      S:  {table:'Round — community and warmth', light_day:'Bright, warm natural light.', light_night:'Statement pendant + taper candles.', matSwatch:'#b85c2a',
           scents:[{name:'Cinnamon',note:'Warming and stimulating',emoji:'🔥'},{name:'Clove',note:'Spicy and grounding',emoji:'🌿'},{name:'Rose',note:'Heart-opening',emoji:'🌹'}],
           note:'Fire energy drives warmth and recognition. Activate with warm reds, candles, and pointed upward energy.'},
      SW: {table:'Round or oval — unity and connection', light_day:'Soft warm light, gentle not harsh.', light_night:'Paired table lamps + floating candles.', matSwatch:'#b88080',
           scents:[{name:'Rose',note:'Love and partnership',emoji:'🌹'},{name:'Jasmine',note:'Romance and connection',emoji:'🌼'},{name:'Sandalwood',note:'Grounding',emoji:'🪵'}],
           note:'Earth energy governs relationships and partnership. Ground with ceramics, stone, and warm textiles.'},
      W:  {table:'Round — Metal element harmony', light_day:'Clean bright light, crisp and clear.', light_night:'Brushed brass pendant + single pillar candle.', matSwatch:'#c0a84a',
           scents:[{name:'Peppermint',note:'Refreshing and clear',emoji:'🌿'},{name:'Tea Tree',note:'Purifying',emoji:'🌿'},{name:'Lemon',note:'Bright and cleansing',emoji:'🍋'}],
           note:'Metal energy brings precision, clarity, and creative solutions. Activate with metallic accents and round shapes.'},
      NW: {table:'Round or rectangular', light_day:'Strong natural light, organized clarity.', light_night:'Architectural pendant + gold-rimmed candle holder.', matSwatch:'#8a9898',
           scents:[{name:'Frankincense',note:'Sacred and grounding',emoji:'💧'},{name:'Myrrh',note:'Deep and meditative',emoji:'🪵'},{name:'White Sage',note:'Purifying',emoji:'🌿'}],
           note:'Metal energy attracts mentors and helpful people. Strengthen with gold/silver objects and clear organization.'}
    }
  },

  // ── ENERGISED MORNINGS ────────────────────────────────────────
  energisedMornings: {
    ritualId: 'energised_mornings',
    name: 'Morning Sanctuary Analyser',
    pillar: 'Energised Mornings',
    spaceLabel: 'a morning movement and meditation sanctuary',
    expertTitle: 'Morning Movement ritual designer',
    usageKey: 'em_space_usage',
    limit: 3,
    validSpaces: ['bedroom','living room','spare room','studio','yoga room','meditation room','exercise room','open floor area','balcony','patio','conservatory','loft','garage gym','garden room'],
    invalidSpaces: ['bathroom','toilet','shower','laundry','kitchen','car interior','construction site','narrow hallway'],
    styleMap: {
      japandi:'Japandi: calm, low, natural wood, minimal, clean lines',
      modern_organic:'Modern Organic: soft curves, natural materials, warm neutrals',
      warm_med:'Warm Minimal / Mediterranean: limewash, arches, stone, linen',
      scandinavian:'Scandinavian: light, bright, functional, cozy textiles',
      natural_boho:'Natural Boho: rattan, jute, plants, layered textures',
      classic:'Classic Contemporary: tailored, timeless, balanced'
    },
    personalityFields: [
      {key:'spot',  label:'This space is'},
      {key:'feel',  label:'It currently feels'},
      {key:'calm',  label:'Energy level'},
      {key:'goal',  label:'Movement goal'}
    ],
    scoreFormat: '{"overall":0,"materials":0,"lighting":0,"feng_shui":0,"movement":0}\nmaterials/lighting/feng_shui/movement each out of 25, overall out of 100. Be critical.',
    diagnosisContext: 'morning movement energy and vitality',
    essentials: 'MORNING SANCTUARY ESSENTIALS: Clear open floor space for a mat. Natural light source (window). Zero clutter within practice radius. One focal point (candle, plant, or meaningful object). Breathable air.',
    analysisSection: '## LIGHT · ENERGY · SPACE\n' +
      'Address each layer with bullet points. Use the exact numbered heading:\n' +
      '1. NATURAL LIGHT: Is the natural light sufficient for morning practice? Explain WHY morning natural light is non-negotiable (circadian cortisol, vitamin D activation, nervous system regulation, mood). Give 2-3 practical solutions if insufficient.\n' +
      '2. ENERGY FLOW: Can energy (Qi) move freely through this space? Is the practice area open and unobstructed? Are there energy-blocking furniture, sharp corners aimed at the mat, or mirrors facing the wrong direction?\n' +
      '3. LIGHTING LAYERS: Name which light sources are needed. A floor lamp for pre-sunrise, a wall sconce for soft wash, a small diffuser with LED for ritual signal, candles for closing practice.\n' +
      '4. FLOOR QUALITY: Assess the floor material and suitability for movement. Does it need a rug, mat, or cork layer? Recommend specific material.\n' +
      '5. ALTAR OR FOCAL POINT: Does this sanctuary need an intentional focal point? If yes, where and what. If it already has one, evaluate it.',
    directivesFormat: '{"windows_visible":true,"space_is_dark":false,"camera_angle":"slightly elevated showing the full practice area","light_layers":["floor lamp","candle","diffuser"],"custom_palette":null}',
    imageContext: 'a serene morning movement sanctuary with a yoga mat and natural light',
    imageExtras: function(d) {
      return 'Include: a yoga or exercise mat on a clean floor, a small plant, a lit candle or diffuser, soft natural light from a window. ';
    },
    directionExtras: {
      N:  {mat_position:'Place your mat parallel to the north wall, facing south — you practise toward your career path.', light_morning:'2700K warm white, maximize natural light from any window.', light_evening:'Floor lamp at ≤2200K amber. Dim to candlelight for yin or restorative practice.', matSwatch:'#3a2010',
           scents:[{name:'Frankincense',note:'Grounding and meditative',emoji:'💧'},{name:'Sandalwood',note:'Centering and warm',emoji:'🪵'},{name:'Vetiver',note:'Earthy and calming',emoji:'🌿'}],
           note:'Water energy brings flow and inner reflection — ideal for slow, meditative movement: yin yoga, breathwork, tai chi.'},
      NE: {mat_position:'Place your mat diagonally toward the northeast wall — you face the knowledge and wisdom sector.', light_morning:'2700K warm, natural light from windows.', light_evening:'Copper floor lamp at 2200K + beeswax candle.', matSwatch:'#c8b090',
           scents:[{name:'Cedarwood',note:'Wisdom and grounding',emoji:'🌲'},{name:'Bergamot',note:'Uplifting clarity',emoji:'🍊'},{name:'Clary Sage',note:'Mental focus',emoji:'🌿'}],
           note:'Earth energy grounds body awareness. Activate with Fire touches: copper, amber light, warm ceramics.'},
      E:  {mat_position:'Face your mat toward the east wall — you practise directly into the rising sun energy.', light_morning:'Full natural light, sunrise energy.', light_evening:'Brass floor lamp + green-tinted glass candle holder.', matSwatch:'#2a5438',
           scents:[{name:'Eucalyptus',note:'Opens airways for breathwork',emoji:'🌿'},{name:'Rosemary',note:'Energising and alert',emoji:'🌿'},{name:'Lemongrass',note:'Fresh and vitalising',emoji:'🍋'}],
           note:'Wood energy supports growth and new beginnings — the most powerful direction for morning practice.'},
      SE: {mat_position:'Position your mat facing the southeast corner — you open your practice toward abundance and growth.', light_morning:'Abundant natural light, windows unobstructed.', light_evening:'Warm brass lamp + beeswax candles.', matSwatch:'#1a4828',
           scents:[{name:'Cinnamon',note:'Warming before movement',emoji:'🌶️'},{name:'Orange',note:'Joyful energy',emoji:'🍊'},{name:'Ylang Ylang',note:'Heart-opening',emoji:'🌺'}],
           note:'The wealth corner — your morning practice here activates abundance energy for the whole day.'},
      S:  {mat_position:'Place your mat facing north — you look toward the career sector and draw Fire energy from behind.', light_morning:'Bright, warm natural light.', light_evening:'Statement floor lamp + taper candles.', matSwatch:'#b85c2a',
           scents:[{name:'Cinnamon',note:'Warming circulation',emoji:'🔥'},{name:'Clove',note:'Stimulating',emoji:'🌿'},{name:'Rose',note:'Heart-centring',emoji:'🌹'}],
           note:'Fire energy drives warmth and dynamic movement — ideal for vigorous practice, HIIT, or power yoga.'},
      SW: {mat_position:'Place your mat facing northeast — this activates the knowledge sector opposite partnerships.', light_morning:'Soft warm light, gentle and diffused.', light_evening:'Paired floor lamps + floating candles.', matSwatch:'#b88080',
           scents:[{name:'Rose',note:'Partnership and love',emoji:'🌹'},{name:'Jasmine',note:'Connection',emoji:'🌼'},{name:'Sandalwood',note:'Grounding',emoji:'🪵'}],
           note:'Earth energy governs relationships — partner yoga, couples stretching, or gentle movement together.'},
      W:  {mat_position:'Face your mat toward the east — Metal precision meets Wood vitality.', light_morning:'Clean bright light, crisp and clear.', light_evening:'Brushed brass floor lamp + single pillar candle.', matSwatch:'#c0a84a',
           scents:[{name:'Peppermint',note:'Invigorating breath',emoji:'🌿'},{name:'Tea Tree',note:'Purifying',emoji:'🌿'},{name:'Lemon',note:'Bright clarity',emoji:'🍋'}],
           note:'Metal energy brings precision and discipline — ideal for structured routines, Pilates, or martial arts.'},
      NW: {mat_position:'Face your mat toward the south or southeast — you practise toward Fire and Wood energy.', light_morning:'Strong natural light, clear space.', light_evening:'Architectural floor lamp + gold-rimmed candle holder.', matSwatch:'#8a9898',
           scents:[{name:'Frankincense',note:'Sacred practice',emoji:'💧'},{name:'Myrrh',note:'Deep grounding',emoji:'🪵'},{name:'White Sage',note:'Space purifying',emoji:'🌿'}],
           note:'Metal energy attracts mentors and guidance — learning from a teacher, following guided practice.'}
    }
  }
};

// ── PUBLIC API ──────────────────────────────────────────────────
return {
  API_KEY: API_KEY,
  VISION_MODEL: VISION_MODEL,
  GEN_ENDPOINT: GEN_ENDPOINT,

  FS_BASE: FS_BASE,
  DIR_ELEMS: DIR_ELEMS,
  ELEMENTS: ELEMENTS,
  PALETTES: PALETTES,
  STYLES: STYLES,
  SHARED_CSS: SHARED_CSS,

  buildFS: buildFS,
  geminiVision: geminiVision,
  generateImage: generateImage,

  getUsage: getUsage,
  saveUsage: saveUsage,
  remainingCount: remainingCount,
  incrementUsage: incrementUsage,

  parseAnalysis: parseAnalysis,
  parseMaterials: parseMaterials,
  parsePriorityChanges: parsePriorityChanges,
  renderText: renderText,

  buildFloorPlanSVG: buildFloorPlanSVG,
  renderElemBalance: renderElemBalance,
  renderPaletteCircles: renderPaletteCircles,
  renderPlantCards: renderPlantCards,
  renderFloorPlanSection: renderFloorPlanSection,

  buildValidationPrompt: buildValidationPrompt,
  buildCorePrompt: buildCorePrompt,
  buildImagePrompt: buildImagePrompt,

  getHomeMap: getHomeMap,
  saveHomeMap: saveHomeMap,
  hasHomeMap: hasHomeMap,
  getAnalysisHistory: getAnalysisHistory,
  saveAnalysis: saveAnalysis,

  calcKua: calcKua,
  getKuaInfo: getKuaInfo,
  getHousehold: getHousehold,
  saveHousehold: saveHousehold,
  hasHousehold: hasHousehold,
  buildHouseholdPromptContext: buildHouseholdPromptContext,
  buildHouseholdHTML: buildHouseholdHTML,
  initHouseholdUI: initHouseholdUI,
  HOUSEHOLD_CSS: HOUSEHOLD_CSS,

  RITUAL_CONFIGS: RITUAL_CONFIGS,
  getConfig: function(key) { return RITUAL_CONFIGS[key] || null; }
};

})();
