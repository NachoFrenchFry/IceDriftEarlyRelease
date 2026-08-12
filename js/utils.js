function hasIntersection(a,b){
    return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}
function rectIntersect(a,b){
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
    const oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    return (ox>0&&oy>0)?{w:ox,h:oy}:null;
}

function resizeCanvas(){
    dpr=window.devicePixelRatio||1;
    canvas.width=Math.round(window.innerWidth*dpr);
    canvas.height=Math.round(window.innerHeight*dpr);
    canvas.style.width=window.innerWidth+'px';
    canvas.style.height=window.innerHeight+'px';
    gameScale=canvas.width/BASE_W;
    SCREEN_HEIGHT=Math.round(canvas.height/gameScale);
    SCREEN_HM=SCREEN_HEIGHT/2;
    gameOffX=0; gameOffY=0;
    ctx.imageSmoothingEnabled=false;
}

function toDesign(cx,cy){const r=canvas.getBoundingClientRect();return[((cx-r.left)*dpr-gameOffX)/gameScale,((cy-r.top)*dpr-gameOffY)/gameScale];}

function toAuthEmail(username){return username.toLowerCase().replace(/[^a-z0-9._-]/g,'_')+'@icedrift.com';}

function charStep(ch,scale){
    const w=(ch==='M'||ch==='m'||ch==='V'||ch==='v'||ch==='W'||ch==='w')?5:4;
    return w*3*scale+3;
}
function getCaretXOffset(text,pos,scale){
    let x=0;
    for(let i=0;i<pos&&i<text.length;i++) x+=charStep(text[i],scale);
    return x;
}
function getCaretPosFromX(text,relX,scale){
    let x=0;
    for(let i=0;i<text.length;i++){
        const step=charStep(text[i],scale);
        if(relX<x+step/2) return i;
        x+=step;
    }
    return text.length;
}
function applyKbShift(){
    if(!window.visualViewport) return;
    const kbOpen=window.visualViewport.height<window.innerHeight-100;
    if(kbOpen&&chatActive){
        const chatBottom=((SCREEN_HEIGHT-30)*gameScale+gameOffY)/dpr;
        const shift=Math.max(0,chatBottom-window.visualViewport.height);
        canvas.style.transform=shift>0?`translateY(-${Math.round(shift)}px)`:'';
        return;
    }
    if(kbOpen&&(page==='LOGIN'||page==='CREATE')&&activeInput&&authFieldRects){
        const field=activeInput==='username'?authFieldRects.un:authFieldRects.pw;
        if(field){
            const fieldBottom=((field.y+field.h)*gameScale+gameOffY)/dpr+30;
            const shift=Math.max(0,fieldBottom-window.visualViewport.height);
            canvas.style.transform=shift>0?`translateY(-${Math.round(shift)}px)`:'';
            return;
        }
    }
    canvas.style.transform='';
}
if(window.visualViewport) window.visualViewport.addEventListener('resize',applyKbShift);
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Cannot load: '+src));i.src=src;});}

function inRect(mx,my,bx,by,bw,bh){return mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh;}
