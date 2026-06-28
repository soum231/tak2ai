// ============================================
// GOOGLE APPS SCRIPT — Call Reports GUI + API
// ============================================
// HOW TO USE:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Delete all existing code, paste this file
// 4. Save (Ctrl+S), then run "doGet" to authorize
// 5. Deploy > New deployment > Web app
// 6. Execute as: Me | Who has access: Anyone
// 7. Copy the deployment URL into routes/api.js line 721
// ============================================

var SHEET_NAME = '';

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'api' || action === 'data') {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, calls: getCallData() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutput(getGuiHtml())
    .setTitle('Call Reports - Tak2AI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    var sheet = getSheet();
    sheet.appendRow([
      p.bot_name || '', p.call_date || new Date().toISOString(),
      p.call_direction || '', p.call_duration_in_minutes || 0,
      p.call_duration_in_seconds || 0, p.call_id || '',
      p.call_request_id || '', p.call_status || '',
      p.call_transfered_status || '', p.customer_location || '',
      p.customer_name || '', p.from_number || '',
      p.full_conversation || '', p.phone_number || '',
      p.preferred_date || '', p.preferred_time || '',
      p.recording_url || '', p.sentiment || '',
      p.service_requested || '', p.summary || '', p.to_number || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getCallData() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var calls = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== null && row[j] !== undefined ? row[j] : '';
    }
    calls.push(obj);
  }
  return calls;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
}

// ===== GUI HTML =====
function getGuiHtml() {
  var parts = [];
  parts.push('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  parts.push('<meta name="viewport" content="width=device-width,initial-scale=1.0">');
  parts.push('<title>Call Reports</title><style>');
  parts.push('*{margin:0;padding:0;box-sizing:border-box}');
  parts.push('body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}');
  parts.push('.wrap{max-width:1400px;margin:0 auto;padding:20px}');
  parts.push('header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}');
  parts.push('header h1{font-size:1.5rem;font-weight:700;color:#f8fafc}');
  parts.push('header h1 span{color:#00e5ff}');
  parts.push('.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}');
  parts.push('.sc{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px}');
  parts.push('.si{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}');
  parts.push('.sv{font-size:1.4rem;font-weight:700;color:#f8fafc}');
  parts.push('.sl{font-size:.75rem;color:#94a3b8;margin-top:2px}');
  parts.push('.filters{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}');
  parts.push('.filters input,.filters select{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px 12px;color:#e2e8f0;font-size:.85rem;outline:none}');
  parts.push('.filters input:focus,.filters select:focus{border-color:#00e5ff}');
  parts.push('.filters input[type=text]{min-width:220px}');
  parts.push('.btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:500;transition:all .15s}');
  parts.push('.btn-p{background:#00e5ff;color:#0f172a}');
  parts.push('.btn-p:hover{background:#00c4e0}');
  parts.push('.btn-g{background:transparent;color:#94a3b8;border:1px solid #334155}');
  parts.push('.btn-g:hover{background:#1e293b;color:#e2e8f0}');
  parts.push('.tw{overflow-x:auto;border-radius:12px;border:1px solid #334155}');
  parts.push('table{width:100%;border-collapse:collapse;font-size:.85rem}');
  parts.push('thead{background:#1e293b}');
  parts.push('th{padding:12px 14px;text-align:left;font-weight:600;color:#94a3b8;white-space:nowrap;border-bottom:1px solid #334155;cursor:pointer;user-select:none}');
  parts.push('th:hover{color:#e2e8f0}');
  parts.push('td{padding:10px 14px;border-bottom:1px solid #1e293b;vertical-align:top}');
  parts.push('tbody tr:hover{background:#1e293b}');
  parts.push('.b{display:inline-block;padding:2px 8px;border-radius:6px;font-size:.75rem;font-weight:600}');
  parts.push('.bp{background:rgba(34,197,94,.15);color:#22c55e}');
  parts.push('.bn{background:rgba(239,68,68,.15);color:#ef4444}');
  parts.push('.bu{background:rgba(234,179,8,.15);color:#eab308}');
  parts.push('.bc{background:rgba(34,197,94,.15);color:#22c55e}');
  parts.push('.bf{background:rgba(239,68,68,.15);color:#ef4444}');
  parts.push('.bd{background:rgba(148,163,184,.15);color:#94a3b8}');
  parts.push('.ct{color:#00e5ff;cursor:pointer;font-size:.8rem;margin-top:4px;display:inline-block}');
  parts.push('.ct:hover{text-decoration:underline}');
  parts.push('.cb{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;margin-top:8px;font-size:.8rem;line-height:1.6;max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}');
  parts.push('.sm{max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}');
  parts.push('.sm.exp{white-space:pre-wrap;overflow:visible}');
  parts.push('.rl{color:#00e5ff;text-decoration:none}');
  parts.push('.rl:hover{text-decoration:underline}');
  parts.push('.ld{text-align:center;padding:60px;color:#64748b}');
  parts.push('.pg{font-size:.8rem;color:#64748b}');
  parts.push('.pn{display:flex;gap:6px;align-items:center;margin-top:16px;justify-content:center;flex-wrap:wrap}');
  parts.push('.pb{padding:6px 12px;border-radius:6px;border:1px solid #334155;background:transparent;color:#94a3b8;cursor:pointer;font-size:.8rem}');
  parts.push('.pb:hover{background:#1e293b;color:#e2e8f0}');
  parts.push('.pb.ac{background:#00e5ff;color:#0f172a;border-color:#00e5ff}');
  parts.push('.pb:disabled{opacity:.4;cursor:not-allowed}');
  parts.push('.rl2{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#64748b}');
  parts.push('.rl2 select{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:4px 8px;color:#e2e8f0;font-size:.8rem}');
  parts.push('@media(max-width:768px){.wrap{padding:12px}header h1{font-size:1.2rem}.stats{grid-template-columns:repeat(2,1fr)}.filters{flex-direction:column}.filters input[type=text]{min-width:auto;width:100%}}');
  parts.push('</style></head><body><div class="wrap">');

  parts.push('<header><h1><span>Call Reports</span> - Tak2AI</h1>');
  parts.push('<button class="btn btn-g" onclick="loadData()">Refresh</button></header>');
  parts.push('<div class="stats" id="st"></div>');

  parts.push('<div class="filters">');
  parts.push('<input type="text" id="qi" placeholder="Search name, phone, location..." oninput="af()">');
  parts.push('<select id="sf" onchange="af()"><option value="">All Sentiment</option><option value="Positive">Positive</option><option value="Neutral">Neutral</option><option value="Negative">Negative</option></select>');
  parts.push('<select id="cf" onchange="af()"><option value="">All Status</option><option value="completed">Completed</option><option value="failed">Failed</option></select>');
  parts.push('<input type="date" id="df" onchange="af()">');
  parts.push('<input type="date" id="dt" onchange="af()">');
  parts.push('<button class="btn btn-g" onclick="rf()">Reset</button></div>');

  parts.push('<div class="tw"><table><thead><tr>');
  parts.push('<th>#</th>');
  parts.push('<th onclick="sb(\'call_date\')">Date</th>');
  parts.push('<th onclick="sb(\'customer_name\')">Name</th>');
  parts.push('<th onclick="sb(\'phone_number\')">Phone</th>');
  parts.push('<th onclick="sb(\'customer_location\')">Location</th>');
  parts.push('<th onclick="sb(\'service_requested\')">Service</th>');
  parts.push('<th onclick="sb(\'sentiment\')">Sentiment</th>');
  parts.push('<th onclick="sb(\'call_status\')">Status</th>');
  parts.push('<th>Duration</th>');
  parts.push('<th>Summary</th>');
  parts.push('<th>Recording</th>');
  parts.push('<th>Conversation</th>');
  parts.push('</tr></thead><tbody id="tb">');
  parts.push('<tr><td colspan="12" class="ld">Loading call reports...</td></tr>');
  parts.push('</tbody></table></div>');

  parts.push('<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;flex-wrap:wrap;gap:12px">');
  parts.push('<div class="pg" id="pi"></div>');
  parts.push('<div class="pn" id="pg2"></div>');
  parts.push('<div class="rl2">Rows: <select id="rl" onchange="af()"><option value="25">25</option><option value="50" selected>50</option><option value="100">100</option><option value="250">250</option><option value="9999">All</option></select></div>');
  parts.push('</div></div>');

  // JavaScript - no nested quote issues
  parts.push('<script>');
  parts.push('var D=[],F=[],cp=1,sf="call_date",sd=-1;');
  parts.push('function loadData(){');
  parts.push('  document.getElementById("tb").innerHTML="<tr><td colspan=12 class=ld>Loading...</td></tr>";');
  parts.push('  google.script.run.withSuccessHandler(function(d){D=d;af()}).withFailureHandler(function(e){document.getElementById("tb").innerHTML="<tr><td colspan=12 class=ld>Error: "+e+"</td></tr>"}).getCallData();');
  parts.push('}');
  parts.push('function af(){');
  parts.push('  var q=document.getElementById("qi").value.toLowerCase(),sn=document.getElementById("sf").value,st=document.getElementById("cf").value,df=document.getElementById("df").value,dt=document.getElementById("dt").value;');
  parts.push('  F=D.filter(function(r){');
  parts.push('    if(sn&&r.sentiment!==sn)return false;');
  parts.push('    if(st&&r.call_status&&r.call_status.toLowerCase()!==st.toLowerCase())return false;');
  parts.push('    if(df&&r.call_date&&new Date(r.call_date)<new Date(df))return false;');
  parts.push('    if(dt&&r.call_date&&new Date(r.call_date)>new Date(dt+"T23:59:59"))return false;');
  parts.push('    if(q){var h=[r.customer_name,r.phone_number,r.customer_location,r.service_requested,r.bot_name].join(" ").toLowerCase();if(h.indexOf(q)===-1)return false}');
  parts.push('    return true;');
  parts.push('  });');
  parts.push('  F.sort(function(a,b){var va=a[sf]||"",vb=b[sf]||"";if(sf==="call_date"){va=new Date(va).getTime()||0;vb=new Date(vb).getTime()||0}if(va<vb)return -1*sd;if(va>vb)return 1*sd;return 0});');
  parts.push('  cp=1;rs();rt();');
  parts.push('}');
  parts.push('function sb(f){if(sf===f)sd*=-1;else{sf=f;sd=-1}af()}');

  // renderStats
  parts.push('function rs(){');
  parts.push('  var t=F.length,p=0,n=0,ng=0,ts=0;');
  parts.push('  F.forEach(function(r){if(r.sentiment==="Positive")p++;else if(r.sentiment==="Neutral")n++;else if(r.sentiment==="Negative")ng++;ts+=(parseInt(r.call_duration_in_seconds)||0)});');
  parts.push('  var dr=ts>=3600?Math.floor(ts/3600)+"h "+Math.floor((ts%3600)/60)+"m":ts>=60?Math.floor(ts/60)+"m "+(ts%60)+"s":ts+"s";');
  parts.push('  document.getElementById("st").innerHTML=');
  parts.push('    \'<div class="sc"><div class="si" style="background:rgba(0,229,255,.1);color:#00e5ff">&#128222;</div><div><div class="sv">\' + t + \'</div><div class="sl">Total Calls</div></div></div>\'+');
  parts.push('    \'<div class="sc"><div class="si" style="background:rgba(34,197,94,.1);color:#22c55e">&#128522;</div><div><div class="sv">\' + p + \'</div><div class="sl">Positive</div></div></div>\'+');
  parts.push('    \'<div class="sc"><div class="si" style="background:rgba(234,179,8,.1);color:#eab308">&#128528;</div><div><div class="sv">\' + n + \'</div><div class="sl">Neutral</div></div></div>\'+');
  parts.push('    \'<div class="sc"><div class="si" style="background:rgba(239,68,68,.1);color:#ef4444">&#128542;</div><div><div class="sv">\' + ng + \'</div><div class="sl">Negative</div></div></div>\'+');
  parts.push('    \'<div class="sc"><div class="si" style="background:rgba(167,139,250,.1);color:#a78bfa">&#9201;</div><div><div class="sv">\' + dr + \'</div><div class="sl">Total Duration</div></div></div>\';');
  parts.push('}');

  // renderTable
  parts.push('function rt(){');
  parts.push('  var lim=parseInt(document.getElementById("rl").value)||50;');
  parts.push('  var tp=Math.ceil(F.length/lim)||1;');
  parts.push('  if(cp>tp)cp=tp;');
  parts.push('  var s=(cp-1)*lim,pd=F.slice(s,s+lim);');
  parts.push('  var h="";');
  parts.push('  if(!pd.length)h="<tr><td colspan=12 class=ld>No call reports found.</td></tr>";');
  parts.push('  pd.forEach(function(r,i){');
  parts.push('    var idx=s+i+1;');
  parts.push('    var dt=r.call_date?new Date(r.call_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):-";');
  parts.push('    var nm=r.customer_name||"Unknown";');
  parts.push('    var ph=r.phone_number||"-";');
  parts.push('    var lc=r.customer_location||"-";');
  parts.push('    var sv=r.service_requested||"-";');
  parts.push('    var se=r.sentiment||"-";');
  parts.push('    var sb2=se==="Positive"?"bp":se==="Negative"?"bn":se==="Neutral"?"bu":"bd";');
  parts.push('    var st=r.call_status||"-";');
  parts.push('    var sc2=st==="completed"?"bc":st==="failed"?"bf":"bd";');
  parts.push('    var ds=parseInt(r.call_duration_in_seconds)||0;');
  parts.push('    var du=ds>=60?Math.floor(ds/60)+"m "+(ds%60)+"s":ds+"s";');
  parts.push('    var sm=(r.summary||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");');
  parts.push('    var cv=(r.full_conversation||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");');
  parts.push('    var rc=r.recording_url;');
  parts.push('    var uid="r"+idx;');

  // Build row - use simple string concat, no nested escaped quotes
  parts.push('    h+="<tr>";');
  parts.push('    h+="<td>"+idx+"</td>";');
  parts.push('    h+="<td>"+dt+"</td>";');
  parts.push('    h+="<td><strong>"+nm+"</strong></td>";');
  parts.push('    h+="<td>"+ph+"</td>";');
  parts.push('    h+="<td>"+lc+"</td>";');
  parts.push('    h+="<td>"+sv+"</td>";');
  parts.push('    h+="<td><span class=\\"b "+sb2+"\\">"+se+"</span></td>";');
  parts.push('    h+="<td><span class=\\"b "+sc2+"\\">"+st+"</span></td>";');
  parts.push('    h+="<td>"+du+"</td>";');
  parts.push('    h+="<td class=\\"sm\\" onclick=\\"this.classList.toggle(\'exp\')\\" title=\\"Click to expand\\">"+(sm||"-")+"</td>";');
  parts.push('    h+="<td>";');
  parts.push('    if(rc)h+="<a class=\\"rl\\" href=\\""+rc+"\\" target=\\"_blank\\">Listen</a>";');
  parts.push('    else h+="-";');
  parts.push('    h+="</td>";');
  parts.push('    h+="<td>";');
  parts.push('    if(cv)h+="<span class=\\"ct\\" onclick=\\"tc(\'"+uid+"\')\\">View</span><div class=\\"cb\\" id=\\""+uid+"\\" style=\\"display:none\\">"+cv+"</div>";');
  parts.push('    else h+="-";');
  parts.push('    h+="</td>";');
  parts.push('    h+="</tr>";');
  parts.push('  });');
  parts.push('  document.getElementById("tb").innerHTML=h;');
  parts.push('  document.getElementById("pi").textContent="Showing "+(s+1)+"-"+Math.min(s+lim,F.length)+" of "+F.length;');
  parts.push('  var pg="";');
  parts.push('  pg+="<button class=\\"pb\\"" +(cp<=1?" disabled":"")+" onclick=\\"gp("+(cp-1)+")\\">&#9664;</button>";');
  parts.push('  for(var p2=Math.max(1,cp-2);p2<=Math.min(tp,cp+2);p2++){');
  parts.push('    pg+="<button class=\\"pb "+(p2===cp?"ac":"")+"\\" onclick=\\"gp("+p2+")\\">"+p2+"</button>";');
  parts.push('  }');
  parts.push('  pg+="<button class=\\"pb\\"" +(cp>=tp?" disabled":"")+" onclick=\\"gp("+(cp+1)+")\\">&#9654;</button>";');
  parts.push('  document.getElementById("pg2").innerHTML=pg;');
  parts.push('}');
  parts.push('function gp(p){cp=p;rt()}');
  parts.push('function tc(id){var e=document.getElementById(id);e.style.display=e.style.display==="none"?"block":"none"}');
  parts.push('function rf(){document.getElementById("qi").value="";document.getElementById("sf").value="";document.getElementById("cf").value="";document.getElementById("df").value="";document.getElementById("dt").value="";af()}');
  parts.push('loadData();');
  parts.push('</script></body></html>');

  return parts.join('\n');
}

function onEdit(e) {}
