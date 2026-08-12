const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
resizeCanvas();
mouseX=SCREEN_WM; mouseY=SCREEN_HM;
let _lastClientX=window.innerWidth/2,_lastClientY=window.innerHeight/2;
canvas.addEventListener('mousemove',e=>{
    _lastClientX=e.clientX;_lastClientY=e.clientY;
    [mouseX,mouseY]=toDesign(e.clientX,e.clientY);
});
canvas.addEventListener('mousedown',e=>{
    if(e.button===0){
        const mb=getMobBoostRect();
        if(mobileControls&&(page==='GAME'||page==='LOBBY'||page==='RACE_GAME')&&mouseX>=mb.x&&mouseY>=mb.y&&mouseX<=mb.x+mb.w&&mouseY<=mb.y+mb.h){
            shiftJustPressed=true;shiftWasDown=true;
        }else{mouseJustPressed=true;mouseDown=true;}
    }
    if(e.button===2){rightMouseDown=true;rightMouseJustPressed=true;}
});
canvas.addEventListener('mouseup',e=>{
    if(e.button===0){mouseDown=false;mouseJustReleased=true;shiftWasDown=false;}
    if(e.button===2) rightMouseDown=false;
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    for(const touch of e.changedTouches){
        const[tx,ty]=toDesign(touch.clientX,touch.clientY);
        const mb=getMobBoostRect();
        const onBoost=mobileControls&&(page==='GAME'||page==='LOBBY'||page==='RACE_GAME')
            &&tx>=mb.x&&ty>=mb.y&&tx<=mb.x+mb.w&&ty<=mb.y+mb.h;
        const isScrollPage=page==='LEADERBOARD'||page==='UPDATES'||page==='SHOP'||page==='SETTINGS';
        const CHBX=170,CHBW=460,CHINY=SCREEN_HEIGHT-40-30;
        const inChatHist=currentUser&&chatActive&&ty<CHINY-6&&ty>=CHINY-286&&tx>=CHBX&&tx<=CHBX+CHBW;
        if(onBoost&&boostTouchId===null){
            boostTouchId=touch.identifier;
            shiftJustPressed=true;shiftWasDown=true;
        }else if(inChatHist&&chatHistTouchId===null){
            chatHistTouchId=touch.identifier;
            chatHistTouchStartY=ty;chatHistTouchStartScroll=chatHistoryScroll;
        }else if(isScrollPage&&scrollTouchId===null){
            scrollTouchId=touch.identifier;
            scrollTouchStartY=ty;
            scrollTouchStartVal=page==='LEADERBOARD'?lbScroll:page==='UPDATES'?upScroll:page==='SHOP'?shopScroll:settingsScroll;
            scrollTouchDragging=false;
            [mouseX,mouseY]=[tx,ty];
        }else if(aimTouchId===null){
            aimTouchId=touch.identifier;
            [mouseX,mouseY]=[tx,ty];
            mouseJustPressed=true;mouseDown=true;
            if((page==='LOGIN'||page==='CREATE')){
                const ir=authFieldRects;
                if(ir.un&&tx>=ir.un.x&&tx<=ir.un.x+ir.un.w&&ty>=ir.un.y&&ty<=ir.un.y+ir.un.h){
                    hiddenUN.value=inputValues.username;hiddenUN.focus();activeInput='username';
                }else if(ir.pw&&tx>=ir.pw.x&&tx<=ir.pw.x+ir.pw.w&&ty>=ir.pw.y&&ty<=ir.pw.y+ir.pw.h){
                    hiddenPW.value=inputValues.password;hiddenPW.focus();activeInput='password';
                }
            }else if((page==='GAME'||page==='LOBBY'||page==='RACE_GAME')&&currentUser&&ty>=SCREEN_HEIGHT-75&&ty<=SCREEN_HEIGHT-25&&tx>=140&&tx<=SCREEN_WIDTH-5){
                setChatActive(true);
            }
        }
    }
},{passive:false});
canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    for(const touch of e.changedTouches){
        if(touch.identifier===aimTouchId){[mouseX,mouseY]=toDesign(touch.clientX,touch.clientY);}
        if(touch.identifier===chatHistTouchId){
            const[,sty]=toDesign(touch.clientX,touch.clientY);
            chatHistoryScroll=Math.max(0,chatHistTouchStartScroll+(chatHistTouchStartY-sty));
        }
        if(touch.identifier===scrollTouchId){
            const[,sty]=toDesign(touch.clientX,touch.clientY);
            const dy=scrollTouchStartY-sty;
            if(Math.abs(dy)>8) scrollTouchDragging=true;
            const sv=Math.max(0,scrollTouchStartVal+dy);
            if(page==='LEADERBOARD') lbScroll=sv;
            if(page==='UPDATES') upScroll=sv;
            if(page==='SHOP') shopScroll=sv;
            if(page==='SETTINGS') settingsScroll=sv;
        }
    }
},{passive:false});
canvas.addEventListener('touchend',e=>{
    for(const touch of e.changedTouches){
        if(touch.identifier===aimTouchId){aimTouchId=null;mouseDown=false;mouseJustReleased=true;}
        if(touch.identifier===boostTouchId){boostTouchId=null;shiftWasDown=false;}
        if(touch.identifier===scrollTouchId){
            if(!scrollTouchDragging) mouseJustPressed=true;
            scrollTouchId=null;scrollTouchDragging=false;
        }
        if(touch.identifier===chatHistTouchId) chatHistTouchId=null;
    }
});

const hiddenUN=document.getElementById('hiddenUN');
const hiddenPW=document.getElementById('hiddenPW');
const hiddenChat=document.getElementById('hiddenChat');
function setChatActive(val){
    chatActive=val;
    if(val){hiddenChat.focus();hiddenChat.value=chatInput;hiddenChat.setSelectionRange(chatCaretPos,chatCaretPos);setTimeout(applyKbShift,350);}
    else{hiddenChat.blur();setTimeout(applyKbShift,50);}
}
hiddenChat.addEventListener('input',()=>{
    chatInput=hiddenChat.value.slice(0,80);
    chatCaretPos=hiddenChat.selectionStart??chatInput.length;
});
hiddenChat.addEventListener('keydown',e=>{
    if(e.key==='Tab'&&isPrivileged(currentUsername)&&chatInput.startsWith('/')){
        e.preventDefault();
        const typed=chatInput.toLowerCase();
        const sugg=ADMIN_COMMANDS.filter(c=>typed==='/'||c.cmd.startsWith(typed));
        if(sugg.length){chatInput=sugg[0].cmd+' ';chatCaretPos=chatInput.length;hiddenChat.value=chatInput;hiddenChat.setSelectionRange(chatCaretPos,chatCaretPos);}
        return;
    }
    if(e.key==='Enter'){e.preventDefault();if(isPrivileged(currentUsername)&&chatInput.startsWith('/'))execAdminCommand(chatInput);else sendChatMessage(chatInput);chatInput='';chatCaretPos=0;setChatActive(false);}
    if(e.key==='Escape'){e.preventDefault();chatInput='';chatCaretPos=0;setChatActive(false);}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Home'||e.key==='End'){setTimeout(()=>{chatCaretPos=hiddenChat.selectionStart??chatCaretPos;},0);}
});
function syncHidden(field){
    const el=field==='username'?hiddenUN:hiddenPW;
    el.value=inputValues[field];
    el.setSelectionRange(caretPos,caretPos);
}
function setActiveInput(field){
    activeInput=field;
    if(field===null){hiddenUN.blur();hiddenPW.blur();canvas.style.transform='';return;}
    const el=field==='password'||field==='confirmPw'?hiddenPW:hiddenUN;
    el.value=inputValues[field];
    caretPos=inputValues[field].length;
    el.setSelectionRange(caretPos,caretPos);
    el.focus();
    setTimeout(applyKbShift,350);
}
hiddenUN.addEventListener('input',()=>{inputValues.username=hiddenUN.value.slice(0,32);caretPos=hiddenUN.selectionStart??inputValues.username.length;});
hiddenPW.addEventListener('input',()=>{inputValues.password=hiddenPW.value.slice(0,32);caretPos=hiddenPW.selectionStart??inputValues.password.length;});
hiddenUN.addEventListener('keydown',e=>{
    if(e.key==='Enter'){authSubmitPending=true;e.preventDefault();}
    if(e.key==='Tab'){e.preventDefault();setActiveInput('password');}
});
hiddenPW.addEventListener('keydown',e=>{
    if(e.key==='Enter'){authSubmitPending=true;e.preventDefault();}
    if(e.key==='Tab'){e.preventDefault();setActiveInput('username');}
});

document.addEventListener('keydown',e=>{
    if(chatActive){
        if(document.activeElement===hiddenChat)return;
        e.preventDefault();
        if(e.key==='Tab'&&isPrivileged(currentUsername)&&chatInput.startsWith('/')){
            const typed=chatInput.toLowerCase();
            const sugg=ADMIN_COMMANDS.filter(c=>typed==='/'||c.cmd.startsWith(typed));
            if(sugg.length){chatInput=sugg[0].cmd+' ';chatCaretPos=chatInput.length;}
        }
        else if(e.key==='Enter'){if(isPrivileged(currentUsername)&&chatInput.startsWith('/'))execAdminCommand(chatInput);else sendChatMessage(chatInput);chatInput='';chatCaretPos=0;setChatActive(false);}
        else if(e.key==='Escape'){chatInput='';chatCaretPos=0;setChatActive(false);}
        else if(e.key==='Backspace'){if(chatCaretPos>0){chatInput=chatInput.slice(0,chatCaretPos-1)+chatInput.slice(chatCaretPos);chatCaretPos--;}}
        else if(e.key==='Delete'){if(chatCaretPos<chatInput.length)chatInput=chatInput.slice(0,chatCaretPos)+chatInput.slice(chatCaretPos+1);}
        else if(e.key==='ArrowLeft'){if(chatCaretPos>0)chatCaretPos--;}
        else if(e.key==='ArrowRight'){if(chatCaretPos<chatInput.length)chatCaretPos++;}
        else if(e.key==='Home'){chatCaretPos=0;}
        else if(e.key==='End'){chatCaretPos=chatInput.length;}
        else if(e.key.length===1&&chatInput.length<80){chatInput=chatInput.slice(0,chatCaretPos)+e.key+chatInput.slice(chatCaretPos);chatCaretPos++;}
        return;
    }
    if(activeInput!==null){
        e.preventDefault();
        const val=inputValues[activeInput];
        if(e.key==='ArrowLeft'){if(caretPos>0)caretPos--;}
        else if(e.key==='ArrowRight'){if(caretPos<val.length)caretPos++;}
        else if(e.key==='Home'){caretPos=0;}
        else if(e.key==='End'){caretPos=val.length;}
        else if(e.key==='Backspace'){
            if(caretPos>0){inputValues[activeInput]=val.slice(0,caretPos-1)+val.slice(caretPos);caretPos--;syncHidden(activeInput);}
        } else if(e.key==='Delete'){
            if(caretPos<val.length){inputValues[activeInput]=val.slice(0,caretPos)+val.slice(caretPos+1);syncHidden(activeInput);}
        } else if(e.key==='Tab'){setActiveInput(activeInput==='username'?'password':'username');}
        else if(e.key==='Enter'){authSubmitPending=true;}
        else if(e.key.length===1&&val.length<32){
            inputValues[activeInput]=val.slice(0,caretPos)+e.key+val.slice(caretPos);
            caretPos++;syncHidden(activeInput);
        }
        return;
    }
    if(e.key==='Shift'){if(!shiftWasDown){shiftJustPressed=true;shiftWasDown=true;
        const now=performance.now();shiftPressLog.push(now);
        shiftPressLog=shiftPressLog.filter(t=>now-t<=2000);
        if(shiftPressLog.length>=40&&!antiCheatFlagged){antiCheatFlagged=true;page='CHEAT_DETECTED';}
    }}
    if(e.key==='Alt'){showHitboxes=true;}
    if((e.key==='r'||e.key==='R')&&(page==='GAME')){levelLoaded=false;}
    if(e.key==='Enter'&&currentUser){setChatActive(true);}
    if(page==='LEVEL_EDITOR'&&(e.metaKey||e.ctrlKey)&&(e.key==='z'||e.key==='Z'||e.key==='y'||e.key==='Y')){
        e.preventDefault();
        if((e.key==='z'||e.key==='Z')&&!e.shiftKey)editorUndo();
        else editorRedo();
    }
    if(page==='LEVEL_EDITOR'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
        e.preventDefault();
        if(e.key==='ArrowLeft')editorKeyLeft=true;
        else if(e.key==='ArrowRight')editorKeyRight=true;
        else if(e.key==='ArrowUp')editorKeyUp=true;
        else if(e.key==='ArrowDown')editorKeyDown=true;
    }
});
document.addEventListener('keyup',e=>{
    if(e.key==='Shift') shiftWasDown=false;
    if(e.key==='Alt') showHitboxes=false;
    if(e.key==='ArrowLeft')editorKeyLeft=false;
    else if(e.key==='ArrowRight')editorKeyRight=false;
    else if(e.key==='ArrowUp')editorKeyUp=false;
    else if(e.key==='ArrowDown')editorKeyDown=false;
});
document.addEventListener('wheel',e=>{
    const _sd=e.deltaY*0.8;
    if(page==='LEADERBOARD') lbScroll=Math.max(0,lbScroll+_sd);
    if(page==='UPDATES') upScroll=Math.max(0,upScroll+_sd);
    if(page==='SHOP') shopScroll=Math.max(0,shopScroll+_sd);
    if(page==='SETTINGS') settingsScroll=Math.max(0,settingsScroll+_sd);
    if(page==='CUSTOM_LEVELS'&&customLevelsTab==='my') myLevelsScroll=Math.max(0,myLevelsScroll+_sd);
    if(page==='CUSTOM_LEVELS'&&customLevelsTab==='community') communityLevelsScroll=Math.max(0,communityLevelsScroll+_sd);
    if(currentUser&&chatActive){chatHistoryScroll=Math.max(0,chatHistoryScroll+_sd);}
    if(page==='LEVEL_EDITOR'){
        const _edAreaW=SCREEN_WIDTH-EDITOR_SIDEBAR_W;
        if(mouseX<_edAreaW){
            const _prevZ=editorZoom,_step=Math.max(1,Math.round(editorZoom*0.1)),_newZ=Math.max(4,Math.min(200,editorZoom+(e.deltaY>0?-_step:_step)));
            if(_newZ!==_prevZ){editorCamX=Math.round(mouseX+(editorCamX-mouseX)*_newZ/_prevZ);editorCamY=Math.round(mouseY+(editorCamY-mouseY)*_newZ/_prevZ);editorZoom=_newZ;}
        } else {
            const _palAreaH=SCREEN_HEIGHT-94-100;
            const _maxScroll=Math.max(0,15*80-_palAreaH);
            editorPalScroll=Math.max(0,Math.min(_maxScroll,editorPalScroll+e.deltaY*0.6));
        }
    }
},{passive:true});
