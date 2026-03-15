import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zone') || searchParams.get('site') || 'default';
  const origin = request.nextUrl.origin;

  const script = `(function() {
  var zid = '${zoneId}';
  var origin = '${origin}';
  var trackApi = '${origin}/api/track';
  var api = origin + '/api/serve?zone=' + zid;
  
  var scripts = document.getElementsByTagName("script");
  var me = document.currentScript || scripts[scripts.length - 1];
  
  function renderAd() {
    if (!me || !me.parentNode) return;
    
    // Create container if not exists
    var containerId = 'trendads-cnt-' + Math.random().toString(36).substr(2, 9);
    var container = document.createElement("div");
    container.id = containerId;
    container.style.width = "100%";
    container.style.margin = "15px 0";
    container.className = "trendads-container";
    me.parentNode.insertBefore(container, me);
    
    fetch(api).then(function(r){return r.json()}).then(function(data){
      if(!data.ad) return;
      var ad = data.ad;
      
      var parent = container.parentElement;
      var w = parent ? parent.clientWidth : 300;
      var h = parent ? parent.clientHeight : 0;
      
      var imgSrc = ad.image_url || "";
      if (imgSrc && imgSrc.startsWith("/")) { imgSrc = origin + imgSrc; }
      var logoUrl = ad.logo_url || ad.logoUrl || "";
      if (logoUrl && logoUrl.startsWith("/")) { logoUrl = origin + logoUrl; }
      
      var titleSrc = ad.title || "Заголовок объявления";
      var descSrc = ad.description || "Текст объявления";
      var host = "visit"; try { host = new URL(ad.target_url).hostname; } catch(e) {}
      
      var getLinkStart = function(wStyle, bounds) { 
        return '<a id="trendads-link-' + ad.id + '" href="' + ad.target_url + '" target="_blank" style="display:flex; flex-direction:column; text-decoration:none; box-sizing:border-box; overflow:hidden; position:relative; cursor:pointer; width:100%; height:100%; font-family: \\'Roboto\\', -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Helvetica, Arial, sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:20px; ' + (bounds || '') + ' ' + wStyle + '">'; 
      }
      
      var isFlexibleHeight = h < 50;
      var html = '';
      
      var layouts = [
        {
          id: "trendads-container-1",
          name: "300x300",
          targetW: 300,
          targetH: 300,
          priority: 2,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; display:flex; flex-direction:column;", "max-width:320px; max-height:300px;");
            out += '<div style="width:100%; height:calc(100% - 64px); position:relative; overflow:hidden; flex-shrink:0; background:#fff;">';
            out += '<img class="trendads-img" src="' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease-in-out;">';
            out += '<div style="position:absolute; bottom:4px; right:4px; z-index:10; background:rgba(0,0,0,0.5); border-radius:4px; padding:3px 6px; display:flex; align-items:center; color:#fff; font-size:11px;">';
            if (logoUrl) { out += '<img src="' + logoUrl + '" style="width:16px; height:16px; margin-right:4px; flex-shrink:0;">'; } else { out += '<div style="width:16px; height:16px; background-color:#266FFE; border-radius:50%; margin-right:4px; flex-shrink:0;"></div>'; }
            out += '<span style="font-family:\\'Roboto\\', sans-serif;"> Ads</span></div>';
            out += '</div>';
            out += '<div style="height:64px; padding:0 14px; display:flex; align-items:center; justify-content:space-between; background-color:#fff; flex-grow:1;">';
            out += '<h3 style="font-size:19px; line-height:23px; font-weight:bold; color:#0e0e0fe6; margin:0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; padding-right:8px; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</h3>';
            out += '<div style="width:60px; height:100%; display:flex; align-items:center; justify-content:flex-end; flex-shrink:0;"><svg width="21" height="19" viewBox="0 0 21 19" fill="none"><path d="M10.1375 1.5712L11.5949 0.11377L20.5477 9.06659L11.5949 18.0194L10.1375 16.562L16.5918 10.1076H0.976448V8.02556H16.5918L10.1375 1.5712Z" fill="#266FFFE6"></path></svg></div>';
            out += '</div>';
            return out;
          }
        },
        {
          id: "trendads-container-2",
          name: "300x442",
          targetW: 300,
          targetH: 442,
          priority: 5,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; font-size:13px; line-height:1.23; overflow:hidden;", "max-width:320px; max-height:442px;");
            out += '<div style="width:100%; max-height:300px; position:relative; overflow:hidden; background-color:#fff; flex-shrink:0;">';
            out += '<img class="trendads-img" src="' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease-in-out;">';
            out += '<div style="position:absolute; top:9px; right:9px; background-color:rgba(18,21,26,0.4); color:rgba(255,255,255,0.8); font-size:8px; height:12px; padding:0 4px; border-radius:16px; text-transform:uppercase; display:flex; align-items:center; letter-spacing:0.125em; z-index:10; font-family:\\'Roboto\\', sans-serif;">Ads</div>';
            out += '</div>';
            out += '<div style="padding:0 16px; margin-top:10px; display:flex; align-items:center; height:16px;">';
            if (logoUrl) { out += '<img src="' + logoUrl + '" style="width:16px; height:16px; margin-right:6px; flex-shrink:0;">'; } else { out += '<div style="width:16px; height:16px; background-color:#266FFE; border-radius:50%; margin-right:6px; flex-shrink:0;"></div>'; }
            out += '<span style="font-size:13px; line-height:1.23; color:rgba(14,14,15,0.9); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:\\'Roboto\\', sans-serif;">' + host + '</span>';
            out += '</div>';
            out += '<div style="padding:0 16px; margin-top:6px;">';
            out += '<h3 style="font-size:21px; line-height:24px; font-weight:bold; color:rgba(14,14,15,0.9); margin:0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</h3>';
            out += '</div>';
            out += '<div style="padding:0 16px; margin-top:6px;">';
            out += '<p style="font-size:15px; line-height:20px; color:rgba(46,48,51,0.8); margin:0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + descSrc + '</p>';
            out += '</div>';
            out += '<div style="padding:12px 16px; margin-top:auto;"><div style="background:#266fffe6; color:#fff; font-size:16px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-family:\\'Roboto\\', sans-serif;">' + (ad.cta || "Узнать больше") + '</div></div>';
            return out;
          }
        },
        {
          id: "trendads-container-3",
          name: "346x460",
          targetW: 346,
          targetH: 460,
          priority: 6,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; display:flex; flex-direction:column; overflow:hidden;", "max-width:366px; max-height:460px;");
            out += '<div style="display:flex; flex-direction:column; width:100%; height:100%;">';
            out += '<div style="padding-top:10px; flex-shrink:0;">';
            out += '<div style="display:flex; align-items:center; margin-right:28px; padding:7px 7px 7px 12px; min-width:0;">';
            if (logoUrl) { out += '<div style="width:20px; height:20px; border-radius:4px; overflow:hidden; flex-shrink:0; background-size:cover; background-position:center; background-image:url(\\\'' + logoUrl + '\\\')"></div>'; } else { out += '<div style="width:20px; height:20px; background-color:#266FFE; border-radius:50%; flex-shrink:0;"></div>'; }
            out += '<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:16px; line-height:20px; font-weight:500; color:#222426; margin-left:8px; flex-shrink:1; font-family:\\'Roboto\\', sans-serif;">' + host + '</span>';
            out += '</div>';
            out += '<div style="font-size:20px; line-height:24px; font-weight:700; color:#222426; margin-left:12px; margin-right:8px; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</div>';
            out += '<div style="font-size:14px; line-height:18px; color:#222426; margin-left:12px; margin-right:8px; padding:4px 0 0; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + descSrc + '</div>';
            out += '</div>';
            out += '<div style="position:relative; overflow:hidden; margin-top:auto; flex-grow:1; min-height:100px; width:100%;">';
            out += '<div style="box-sizing:border-box; display:block; height:100%; width:100%; overflow:hidden; position:relative;">';
            out += '<div class="trendads-img" style="bottom:0; display:block; left:0; position:absolute; right:0; top:0; background-origin:content-box; background-position:center; background-repeat:no-repeat; background-size:cover; background-image:url(\\\'' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '\\\'); transition: transform 0.3s ease-in-out;"></div>';
            out += '</div></div>';
            out += '</div>';
            return out;
          }
        },
        {
          id: "trendads-container-4",
          name: "360x449",
          targetW: 360,
          targetH: 449,
          priority: 6,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; display:flex; flex-direction:column; overflow:hidden;", "max-width:380px; max-height:449px;");
            out += '<div style="display:flex; flex-direction:column; height:100%; position:relative; padding-bottom:15px; box-sizing:border-box;">';
            out += '<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 12px 0; margin-bottom:2px; height:24px; flex-shrink:0; padding-top:18px;">';
            out += '<div style="display:flex; align-items:center; width:100%; min-width:0;">';
            if (logoUrl) { out += '<img src="' + logoUrl + '" style="width:20px; height:20px; margin-right:6px; flex-shrink:0; border-radius:4px;">'; } else { out += '<div style="width:20px; height:20px; background-color:#266FFE; border-radius:50%; margin-right:6px; flex-shrink:0;"></div>'; }
            out += '<span style="font-size:15px; color:#0e0e0fe6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:\\'Roboto\\', sans-serif;">' + host + '</span>';
            out += '<span style="font-size:10px; color:#232426b3; margin-left:auto; text-transform:uppercase; letter-spacing: .075em; font-family:\\'Roboto\\', sans-serif;">Ads</span>';
            out += '</div></div>';
            out += '<div style="display:flex; flex-direction:row; padding:0 6px; margin-top:12px; height:348px; position:relative; flex-shrink:0;">';
            out += '<div style="height:100%; width:100%; position:relative; border-radius:14px; overflow:hidden;">';
            out += '<img class="trendads-img" src="' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '" style="height:100%; width:100%; position:absolute; left:0; top:0; object-fit:cover; transition: transform 0.3s ease-in-out;">';
            out += '</div></div>';
            out += '<div style="display:flex; padding:0 16px; margin-top:16px; margin-bottom:5px; position:relative; flex-shrink:0;">';
            out += '<div style="font-size:17px; line-height:21px; color:#0e0e0fe6; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</div>';
            out += '</div></div>';
            return out;
          }
        },
        {
          id: "trendads-container-5",
          name: "400x100",
          targetW: 400,
          targetH: 100,
          priority: 3,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; display:flex; flex-direction:row; overflow:hidden;", "max-width:420px; max-height:100px;");
            out += '<div style="width:100px; height:100px; flex-shrink:0; overflow:hidden; position:relative;">';
            out += '<img class="trendads-img" src="' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease-in-out;">';
            out += '</div>';
            out += '<div style="width:300px; height:100px; display:flex; flex-direction:column; padding:8px 12px; box-sizing:border-box; min-width:0;">';
            out += '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">';
            out += '<div style="display:flex; align-items:center; gap:6px; min-width:0;">';
            if (logoUrl) { out += '<img src="' + logoUrl + '" style="width:14px; height:14px; border-radius:2px; flex-shrink:0;">'; } else { out += '<div style="width:14px; height:14px; background-color:#266FFE; border-radius:50%; flex-shrink:0;"></div>'; }
            out += '<span style="font-size:13px; color:#0e0e0fe6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:\\'Roboto\\', sans-serif;">' + host + '</span>';
            out += '</div><span style="font-size:8px; color:#232426b3; text-transform:uppercase; font-family:\\'Roboto\\', sans-serif;">Ads</span></div>';
            out += '<div style="flex:1; display:flex; align-items:center; min-width:0;">';
            out += '<h3 style="font-size:22px; line-height:26px; font-weight:bold; color:#0e0e0fe6; margin:0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</h3>';
            out += '</div></div>';
            return out;
          }
        },
        {
          id: "trendads-container-6",
          name: "700x200",
          targetW: 700,
          targetH: 200,
          priority: 8,
          render: function() {
            var out = getLinkStart("background-color:#ffffff; color:#3d3f43; display:flex; flex-direction:row; position:relative; overflow:hidden; padding: 8px 35px;", "max-width:1000px; max-height:200px; min-height:200px;");
            out += '<div style="width:184px; height:184px; border-radius:16px; flex-shrink:0; position:relative; overflow:hidden;">';
            out += '<img class="trendads-img" src="' + (imgSrc || "//direct.yastatic.net/s3/direct-frontend/uac/desktop/assets/44bcbc9271c928d5.png") + '" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease-in-out;">';
            out += '</div>';
            out += '<div style="flex:1; display:flex; flex-direction:column; padding:8px 16px; min-width:0;">';
            out += '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">';
            out += '<div style="display:flex; align-items:center; gap:8px; min-width:0;">';
            if (logoUrl) { out += '<div style="width:20px; height:20px; border-radius:4px; background-size:cover; background-position:center; background-image:url(\\\'' + logoUrl + '\\\'); flex-shrink:0;"></div>'; } else { out += '<div style="width:20px; height:20px; background-color:#266FFE; border-radius:50%; flex-shrink:0;"></div>'; }
            out += '<span style="font-size:14px; font-weight:500; color:#222426; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:\\'Roboto\\', sans-serif;">' + host + '</span>';
            out += '</div><div style="font-size:11px; color:#939CB0; padding:0 6px; background:rgba(236,238,242,0.8); border-radius:4px; line-height:18px; font-family:\\'Roboto\\', sans-serif;">Ads</div></div>';
            out += '<div style="flex:1; min-width:0;">';
            out += '<h2 style="font-size:32px; line-height:36px; font-weight:700; color:#222426; margin:0 0 4px 0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</h2>';
            out += '<p style="font-size:22px; line-height:26px; color:#5c6066; margin:8px 0 0 0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-family:\\'Roboto\\', sans-serif;">' + descSrc + '</p>';
            out += '</div>';
            out += '<div style="margin-top:12px;"><div style="display:inline-flex; align-items:center; justify-content:center; height:36px; padding:0 20px; background-color:#266FFE; color:#ffffff; font-size:14px; font-weight:500; border-radius:8px; font-family:\\'Roboto\\', sans-serif;">' + (ad.cta || "Узнать больше") + '</div></div>';
            out += '</div>';
            return out;
          }
        }
      ];

      var scoredCandidates = layouts.map(function(l) {
        var diffW = w - l.targetW;
        var diffH = Math.abs(h - l.targetH);
        var isMatchW = diffW >= -40;
        var isMatchH = diffH <= 20 || isFlexibleHeight;
        var score = 0;
        if (isMatchW && isMatchH) {
          if (isFlexibleHeight) {
            score = 1000 + l.priority * 10 - Math.abs(diffW);
            if (w > 600 && l.targetW > 600) score += 500;
          } else {
            score = 500 - (Math.abs(diffW) + diffH);
          }
        }
        return { layout: l, score: score };
      });

      var validOnes = scoredCandidates.filter(function(c) { return c.score > 0; });
      validOnes.sort(function(a, b) { return b.score - a.score; });

      if (validOnes.length > 0) {
        var picked = validOnes[0].layout;
        container.id = picked.id;
        html += picked.render();
      } else {
        container.id = "trendads-container-7";
        html += getLinkStart("background-color:#f8fafc; color:#0f172a; border:1px solid #e2e8f0; border-radius:20px; padding:16px; justify-content:center; overflow:hidden;");
        html += '<div style="font-weight:800; font-size:18px; margin-bottom:8px; color:#0f172a; line-height:1.3; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; flex-shrink:0; font-family:\\'Roboto\\', sans-serif;">' + titleSrc + '</div>';
        html += '<div style="font-size:14px; color:#475569; line-height:1.5; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; margin-bottom:12px; flex-shrink:1; font-family:\\'Roboto\\', sans-serif;">' + descSrc + '</div>';
        html += '<div style="margin-top:auto; font-size:12px; font-weight:600; color:#3b82f6; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:6px; flex-shrink:0; font-family:\\'Roboto\\', sans-serif;">';
        if (logoUrl) { html += '<img src="' + logoUrl + '" style="width:14px; height:14px; border-radius:4px;">'; }
        html += '<span> Ads &rarr;</span>';
        html += '</div>';
      }
      
      html += '</a>';
      html += '<img src="' + trackApi + '?event=impression&adId=' + ad.id + '&zoneId=' + zid + '" style="display:none; width:1px; height:1px;">';
      
      // Inline styles for Roboto and Animations
      html += '<style>';
      html += '  @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap");';
      html += '  #trendads-link-' + ad.id + ':hover .trendads-img { transform: scale(1.1) !important; }';
      html += '  #trendads-link-' + ad.id + ' { transition: box-shadow 0.2s ease-in-out !important; }';
      html += '  #trendads-link-' + ad.id + ':hover { box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important; }';
      html += '</style>';
      
      container.innerHTML = html;
      
      var link = container.firstChild;
      link.onclick = function() {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(trackApi + "?event=click&adId=" + ad.id + "&zoneId=" + zid);
        } else {
          fetch(trackApi + "?event=click&adId=" + ad.id + "&zoneId=" + zid, { mode: "cors", keepalive: true });
        }
      };
    }).catch(function(e){ console.error("TrendAds Loader Error:", e); });
  }
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAd);
  } else {
    renderAd();
  }
})();`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

