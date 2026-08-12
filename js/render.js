function getMobBoostRect(){return{x:160,y:SCREEN_HEIGHT-230,w:120,h:120};}
function isDeveloper(u){return DEVELOPERS.includes((u||'').toLowerCase());}
function isAdmin(u){return ADMINS.includes((u||'').toLowerCase());}
function isPrivileged(u){return isDeveloper(u)||isAdmin(u);}

function renderText(ctx,textSheet,text,x,y,size,cr,cg,cb){
    if(size===undefined) size=2;
    const hasColor=cr!==undefined;
    if(cr===undefined) cr=0;
    if(cg===undefined) cg=0;
    if(cb===undefined) cb=0;
    const chars=[];
    let xCur=0;
    for(let i=0;i<text.length;i++){
        const ch=text[i];
        let col=0,row=0,w=4,h=7;
        // Uppercase A-Z
        if(ch==='A'){col=1;}  if(ch==='B'){col=2;}  if(ch==='C'){col=3;}
        if(ch==='D'){col=4;}  if(ch==='E'){col=5;}  if(ch==='F'){col=6;}
        if(ch==='G'){col=7;}  if(ch==='H'){col=8;}  if(ch==='I'){col=9;}
        if(ch==='J'){col=10;} if(ch==='K'){col=11;} if(ch==='L'){col=12;}
        if(ch==='M'){col=13;w=5;} if(ch==='N'){col=14;} if(ch==='O'){col=15;}
        if(ch==='P'){col=16;} if(ch==='Q'){col=17;} if(ch==='R'){col=18;}
        if(ch==='S'){col=19;} if(ch==='T'){col=20;} if(ch==='U'){col=21;}
        if(ch==='V'){col=22;w=5;} if(ch==='W'){col=23;w=5;} if(ch==='X'){col=24;}
        if(ch==='Y'){col=25;} if(ch==='Z'){col=26;}
        // Lowercase a-z (row 8; g/p/q have h=10)
        if(ch==='a'){col=1;row=8;}  if(ch==='b'){col=2;row=8;}  if(ch==='c'){col=3;row=8;}
        if(ch==='d'){col=4;row=8;}  if(ch==='e'){col=5;row=8;}  if(ch==='f'){col=6;row=8;}
        if(ch==='g'){col=7;row=8;h=10;} if(ch==='h'){col=8;row=8;} if(ch==='i'){col=9;row=8;}
        if(ch==='j'){col=10;row=8;} if(ch==='k'){col=11;row=8;} if(ch==='l'){col=12;row=8;}
        if(ch==='m'){col=13;row=8;w=5;} if(ch==='n'){col=14;row=8;} if(ch==='o'){col=15;row=8;}
        if(ch==='p'){col=16;row=8;h=10;} if(ch==='q'){col=17;row=8;h=10;} if(ch==='r'){col=18;row=8;}
        if(ch==='s'){col=19;row=8;} if(ch==='t'){col=20;row=8;} if(ch==='u'){col=21;row=8;}
        if(ch==='v'){col=22;row=8;w=5;} if(ch==='w'){col=23;row=8;w=5;} if(ch==='x'){col=24;row=8;}
        if(ch==='y'){col=25;row=8;h=10;} if(ch==='z'){col=26;row=8;}
        // Digits
        if(ch==='1'){col=1;row=18;} if(ch==='2'){col=2;row=18;} if(ch==='3'){col=3;row=18;}
        if(ch==='4'){col=4;row=18;} if(ch==='5'){col=5;row=18;} if(ch==='6'){col=6;row=18;}
        if(ch==='7'){col=7;row=18;} if(ch==='8'){col=8;row=18;} if(ch==='9'){col=9;row=18;}
        if(ch==='0'){col=10;row=18;}
        // Punctuation
        if(ch==='?'){col=1;row=26;} if(ch==='!'){col=2;row=26;} if(ch==='.'){col=3;row=26;}
        if(ch===','){col=4;row=26;} if(ch===':'){col=5;row=26;} if(ch===';'){col=6;row=26;}
        if(ch==='*'){col=7;row=26;}
        if(ch==='-'){col=8;row=26;} if(ch==='('){col=9;row=26;} if(ch===')'){col=10;row=26;}
        if(ch==="'"){col=11;row=26;} if(ch==='"'){col=12;row=26;} if(ch==='/'){col=13;row=26;}
        if(ch==='+'){col=14;row=26;} if(ch==='='){col=15;row=26;} if(ch==='@'){col=16;row=26;}
        if(ch==='#'){col=17;row=26;} if(ch==='&'){col=18;row=26;} if(ch==='_'){col=19;row=26;}
        if(ch==='<'){col=20;row=26;} if(ch==='>'){col=21;row=26;} if(ch==='['){col=22;row=26;}
        if(ch===']'){col=23;row=26;} if(ch==='~'){col=24;row=26;} if(ch==='%'){col=25;row=26;}
        if(ch==='^'){col=26;row=26;}
        if(col===0){xCur+=4*3*size+3;continue;}
        chars.push({col,row,w,h,cx:xCur});
        xCur+=w*3*size+3;
    }
    if(!hasColor){
        for(const c of chars){
            ctx.drawImage(textSheet,(c.col-1)*5,c.row,c.w,c.h,x+c.cx,y,c.w*3*size,c.h*3*size);
        }
    }else{
        const totalW=Math.max(1,xCur),totalH=Math.max(1,10*3*size);
        const tmp=document.createElement('canvas');
        tmp.width=totalW;tmp.height=totalH;
        const tc=tmp.getContext('2d');
        tc.imageSmoothingEnabled=false;
        for(const c of chars){
            tc.drawImage(textSheet,(c.col-1)*5,c.row,c.w,c.h,c.cx,0,c.w*3*size,c.h*3*size);
        }
        tc.globalCompositeOperation='source-in';
        tc.fillStyle=`rgb(${cr},${cg},${cb})`;
        tc.fillRect(0,0,totalW,totalH);
        ctx.drawImage(tmp,x,y);
    }
}

function renderTextButton(ctx,sheet,textSheet,srcY,btnX,btnY,btnW,label,cr,cg,cb,textOffsetY){
    const SC=5,SRC_H=16,BTN_H=SRC_H*SC; // 80px tall
    const CAP_SW=2,MID_SW=36,CAP_W=CAP_SW*SC,MID_TW=MID_SW*SC;
    const midW=btnW-CAP_W*2;
    function drawParts(dx,dy){
        ctx.drawImage(sheet,0,srcY,CAP_SW,SRC_H,dx,dy,CAP_W,BTN_H);
        let drawn=0;
        while(drawn<midW){
            const dw=Math.min(MID_TW,midW-drawn);
            ctx.drawImage(sheet,CAP_SW,srcY,Math.ceil(dw/SC),SRC_H,dx+CAP_W+drawn,dy,dw,BTN_H);
            drawn+=dw;
        }
        ctx.drawImage(sheet,CAP_SW+MID_SW,srcY,CAP_SW,SRC_H,dx+btnW-CAP_W,dy,CAP_W,BTN_H);
    }
    ctx.save();ctx.globalAlpha=80/255;ctx.filter='brightness(0)';ctx.imageSmoothingEnabled=false;
    drawParts(btnX-5,btnY+5);
    ctx.restore();
    ctx.save();ctx.imageSmoothingEnabled=false;
    drawParts(btnX,btnY);
    ctx.restore();
    if(mouseX>=btnX&&mouseX<=btnX+btnW&&mouseY>=btnY&&mouseY<=btnY+BTN_H){
        ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='white';ctx.fillRect(btnX,btnY,btnW,BTN_H);ctx.restore();
    }
    if(label){
        const lw=label.length*(4*3*2+3);
        renderText(ctx,textSheet,label,Math.floor(btnX+btnW/2-lw/2),btnY+BTN_H/2-14+(textOffsetY||0),2,cr??0,cg??0,cb??0);
    }
}

function renderButton(ctx,btnSheet,textSheet,type,bx,by,bw,bh,text){
    let sx=0,sy=0,sw=40,sh=20;
    if(type===2){sx=40;sy=0;sw=20;sh=20;}
    if(type===3){sx=40;sy=20;sw=20;sh=20;}
    if(type===4){sx=40;sy=40;sw=20;sh=20;}
    if(type===5){sx=40;sy=60;sw=20;sh=20;}
    if(type===6){sx=40;sy=80;sw=20;sh=20;}
    if(type===7){sx=40;sy=100;sw=20;sh=20;}
    if(type===8){sx=40;sy=120;sw=20;sh=20;}
    if(type===9){sx=40;sy=140;sw=20;sh=20;}
    if(type===10){sx=40;sy=160;sw=20;sh=20;}
    if(type===11){sx=40;sy=180;sw=20;sh=20;}
    // Shadow
    ctx.save();
    ctx.globalAlpha=80/255;
    ctx.filter='brightness(0)';
    ctx.drawImage(btnSheet,sx,sy,sw,sh,bx-5,by+5,bw,bh);
    ctx.restore();
    // Button
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(btnSheet,sx,sy,sw,sh,bx,by,bw,bh);
    ctx.restore();
    if(mouseX>=bx&&mouseX<=bx+bw&&mouseY>=by&&mouseY<=by+bh){
        ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='white';ctx.fillRect(bx,by,bw,bh);ctx.restore();
    }
    // Text
    if(text&&text.length>0){
        const size=2;
        const charW=4,charH=7;
        const tw=text.length*(charW*3*size+3);
        const th=charH*3*size;
        const tx=bx+bw/2-tw/2,ty=by+bh/2-th/2;
        renderText(ctx,textSheet,text,tx,ty,size);
    }
}

function renderDriftCoins(ctx,textSheet,iconsImg){
    const numStr=String(driftCoins);
    const scale=2,step=4*3*scale+3,iconSz=60,gap=9,padX=12,padY=9;
    const textW=numStr.length*step;
    const innerH=Math.max(iconSz,7*3*scale);
    const bgW=iconSz+gap+textW+padX*2,bgH=innerH+padY*2;
    const bgX=SCREEN_WIDTH-bgW-18,bgY=18;
    ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
    ctx.beginPath();ctx.roundRect(bgX,bgY,bgW,bgH,9);ctx.fill();ctx.restore();
    const iconX=bgX+padX,iconY=bgY+padY+Math.floor((innerH-iconSz)/2);
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(iconsImg,0,0,12,12,iconX,iconY,iconSz,iconSz);
    ctx.restore();
    renderText(ctx,textSheet,numStr,bgX+padX+iconSz+gap,bgY+padY+Math.floor((innerH-7*3*scale)/2),scale,255,255,255);
}


function renderInputField(label,fieldKey,x,y,w,h,isPassword,showVal=showPassword){
        const focused=activeInput===fieldKey;
        // Shadow
        ctx.save();ctx.globalAlpha=80/255;ctx.fillStyle='black';
        ctx.beginPath();ctx.roundRect(x-4,y+4,w,h,6);ctx.fill();ctx.restore();
        // Background
        ctx.save();ctx.fillStyle=focused?'rgb(50,55,80)':'rgb(32,32,48)';
        ctx.strokeStyle=focused?'rgb(130,160,255)':'rgb(70,70,100)';
        ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();
        ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.stroke();
        ctx.restore();
        // Label
        const labelW=label.length*(4*3+3);
        renderText(ctx,textSheet,label,x,y-28,1,0,0,0);
        // Value text
        const display=isPassword&&!showVal?'*'.repeat(inputValues[fieldKey].length):inputValues[fieldKey];
        if(display) renderText(ctx,textSheet,display,x+12,y+h/2-10,1,220,220,240);
        // Blinking caret
        if(focused&&Math.floor(performance.now()/530)%2===0){
            const clampedCaret=Math.min(caretPos,display.length);
            const cx=x+12+getCaretXOffset(display,clampedCaret,1);
            ctx.fillStyle='rgb(180,200,255)';
            ctx.fillRect(cx,y+h/2-11,2,7*3);
        }
        // Show/hide toggle for password fields
        if(isPassword){
            const togLbl=showVal?'HIDE':'SHOW';
            const togW=togLbl.length*(4*3+3),togH=7*3;
            const togX=x+w-togW-12,togY=y+h/2-togH/2;
            renderText(ctx,textSheet,togLbl,togX,togY,1,showVal?160:100,showVal?200:140,showVal?255:180);
        }
    }
