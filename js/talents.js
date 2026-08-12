function talentCost(b,l){return(BRANCH_COSTS[b]&&BRANCH_COSTS[b][l])||0;}
function talentBranchX(b){return BRANCH_X_WORLD[b]+talentScrollX;}
function talentLevelY(l){return SCREEN_HEIGHT-80-l*BTN_STEP+talentScrollY;}
function talentGetRect(id){
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    const cy=talentLevelY(l+BRANCH_YOFF[b]);
    return{x:talentBranchX(b)-BTN_SIZE/2,y:cy-BTN_SIZE/2,w:BTN_SIZE,h:BTN_SIZE};
}
function talentMaxScrollY(){
    const topBase=(SCREEN_HEIGHT-80-11*BTN_STEP)-BTN_SIZE/2;
    return Math.max(0,80-topBase);
}
function talentTotalCostToBuy(id){
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    let total=0;
    const add=(br,maxL)=>{for(let x=0;x<=maxL;x++){const tid=br*LEVELS_PER_BRANCH+x;if(!talentPurchased[tid])total+=talentCost(br,x);}};
    if(b===4)add(2,3);
    if(b===5){add(2,2);add(3,2);}
    if(b===3)add(2,2);
    if(b===6)add(0,2);
    if(b===8)add(7,3);
    if(b===9)add(2,7);
    if(b===10){add(7,3);add(8,1);}
    for(let x=0;x<=l;x++){const tid=b*LEVELS_PER_BRANCH+x;if(!talentPurchased[tid])total+=talentCost(b,x);}
    return total;
}
function talentCanBuy(id){return !talentPurchased[id]&&(totalTalentPoints-spentTalentPoints)>=talentTotalCostToBuy(id);}
function talentAutoBuyCount(id){
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    let n=0;
    const cnt=(br,maxL)=>{for(let x=0;x<=maxL;x++)if(!talentPurchased[br*LEVELS_PER_BRANCH+x])n++;};
    if(b===4)cnt(2,3);
    if(b===5){cnt(2,2);cnt(3,2);}
    if(b===3)cnt(2,2);
    if(b===6)cnt(0,2);
    if(b===8)cnt(7,3);
    if(b===9)cnt(2,7);
    if(b===10){cnt(7,3);cnt(8,1);}
    for(let x=0;x<l;x++)if(!talentPurchased[b*LEVELS_PER_BRANCH+x])n++;
    return n;
}
function talentApplyEffect(id){
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    const VS=[0.95,0.90,0.85,0.80,0.75,0.70,0.65,0.60];
    const SM=[1.15,1.30,1.50,1.75,2.00,2.50,3.00,4.00];
    const RM=[0.95,0.90,0.85,0.80,0.76,0.72,0.68,0.65];
    if(b===0)visionScale=VS[l];
    if(b===1)accelerationMult=SM[l];
    if(b===2){boostUnlocked=true;boostLevel=l+1;}
    if(b===3)reloadCooldownMult=RM[l];
    if(b===4){wallDampenerUnlocked=true;wallDampenerLevel=l+1;}
    if(b===5){doubleChargeUnlocked=true;doubleChargeLevel=l+1;boostChargesMax=(l<4)?2:3;
        while(boost2CooldownEnds.length<boostChargesMax-1){boost2CooldownEnds.push(0);boost2CooldownTotals.push(1);}
    }
    if(b===6){tacticalSightUnlocked=true;tacticalSightLevel=l+1;}
    if(b===7){turboBrakeUnlocked=true;turboBrakeLevel=l+1;}
    if(b===8){secondChanceUnlocked=true;secondChanceLevel=l+1;}
    if(b===9){holdBoostUnlocked=true;}
    if(b===10){evasionUnlocked=true;evasionLevel=l+1;}
}
function talentRecomputeEffects(){
    visionScale=1;accelerationMult=1;reloadCooldownMult=1;
    boostUnlocked=false;boostLevel=0;wallDampenerUnlocked=false;wallDampenerLevel=0;
    tacticalSightUnlocked=false;tacticalSightLevel=0;turboBrakeUnlocked=false;turboBrakeLevel=0;
    doubleChargeUnlocked=false;doubleChargeLevel=0;boostChargesMax=1;boost2CooldownEnds=[];boost2CooldownTotals=[];
    secondChanceUnlocked=false;secondChanceLevel=0;holdBoostUnlocked=false;evasionUnlocked=false;evasionLevel=0;
    for(let i=0;i<TALENT_COUNT;i++)if(talentPurchased[i])talentApplyEffect(i);
}
function talentBuyTalent(id){
    if(!talentCanBuy(id))return;
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    const autoBuy=(br,maxL)=>{
        for(let x=0;x<=maxL;x++){const tid=br*LEVELS_PER_BRANCH+x;if(!talentPurchased[tid]){talentPurchased[tid]=true;spentTalentPoints+=talentCost(br,x);talentApplyEffect(tid);}}
    };
    if(b===4)autoBuy(2,3);
    if(b===5){autoBuy(2,2);autoBuy(3,2);}
    if(b===3)autoBuy(2,2);
    if(b===6)autoBuy(0,2);
    if(b===8)autoBuy(7,3);
    if(b===9)autoBuy(2,7);
    if(b===10){autoBuy(7,3);autoBuy(8,1);}
    for(let x=0;x<=l;x++){const tid=b*LEVELS_PER_BRANCH+x;if(!talentPurchased[tid]){talentPurchased[tid]=true;spentTalentPoints+=talentCost(b,x);talentApplyEffect(tid);}}
    dbSaveProfileNow();
}
function talentDeselTalent(id){
    const b=Math.floor(id/LEVELS_PER_BRANCH),l=id%LEVELS_PER_BRANCH;
    for(let x=l;x<LEVELS_PER_BRANCH;x++){const tid=b*LEVELS_PER_BRANCH+x;if(talentPurchased[tid]){talentPurchased[tid]=false;spentTalentPoints-=talentCost(b,x);}}
    const clear=(br)=>{for(let x=0;x<LEVELS_PER_BRANCH;x++){const tid=br*LEVELS_PER_BRANCH+x;if(talentPurchased[tid]){talentPurchased[tid]=false;spentTalentPoints-=talentCost(br,x);}}};
    if(!talentPurchased[2*LEVELS_PER_BRANCH+2]){clear(3);clear(4);clear(5);}
    if(!talentPurchased[2*LEVELS_PER_BRANCH+3])clear(4);
    if(!talentPurchased[3*LEVELS_PER_BRANCH+2])clear(5);
    if(!talentPurchased[0*LEVELS_PER_BRANCH+2])clear(6);
    if(!talentPurchased[7*LEVELS_PER_BRANCH+3])clear(8);
    if(!talentPurchased[2*LEVELS_PER_BRANCH+7])clear(9);
    if(!talentPurchased[8*LEVELS_PER_BRANCH+1])clear(10);
    talentRecomputeEffects();
    dbSaveProfileNow();
}
function talentBranchName(b){return["VISION","SPEED","BOOST","RELOAD","WALL BOUNCE","EXTRA CHARGES","MINI MAP","BRAKE","2ND CHANCE","HOLD BOOST","EVASION"][b];}
function talentKeyStr(b){return["","","Press Shift to boost","","","","","Right-click to brake","","Hold Shift to boost",""][b]||"";}
function talentStatStr(b,l){
    const vs=["+5% view","+11% view","+18% view","+25% view","+33% view","+43% view","+54% view","+67% view"];
    const ss=["+15% accel","+30% accel","+50% accel","+75% accel","x2 accel","x2.5 accel","x3 accel","x4 accel"];
    const BImp=[1.5,2.5,3.5,4.5,6.0,7.5,9.0,11.0],BCD=[12000,8000,6000,4000,2500,1500,750,350];
    const rs=["-5% boost CD","-10% boost CD","-15% boost CD","-20% boost CD","-24% boost CD","-28% boost CD","-32% boost CD","-35% boost CD"];
    const ds=["35% bounce off wall","20% bounce off wall","10% bounce off wall","3% bounce off wall","No wall bounce","","",""];
    const dc=["Store 2 boosts","Store 2 / -10% CD","Store 2 / -20% CD","Store 2 / -30% CD","Store 3 boosts","Store 3 / -10% CD","Store 3 / -20% CD","Store 3 / -30% CD"];
    const ts=["150px minimap","165px minimap","180px minimap","195px minimap","210px minimap","225px minimap","240px minimap","255px minimap"];
    const tb=["Brake CD 4.0s","Brake CD 3.5s","Brake CD 3.0s","Brake CD 2.5s","Brake CD 2.0s","Brake CD 1.5s","Brake CD 1.0s","Brake CD 0.5s"];
    const sc=["1s immune / 10s CD","3s immune / 5s CD"];
    const ev=["10% evade chance","20% evade chance","30% evade chance","40% evade chance","50% evade chance"];
    if(b===0)return vs[l];if(b===1)return ss[l];
    if(b===2){const cd=BCD[l]/1000;return"Strength "+Math.floor(BImp[l])+"  CD "+(cd<1?cd.toFixed(1):Math.floor(cd))+"s";}
    if(b===3)return rs[l];if(b===4)return ds[l];if(b===5)return dc[l];
    if(b===6)return ts[l];if(b===7)return tb[l];
    if(b===9)return"hold shift to boost (50% power)";
    if(b===10)return ev[Math.min(l,4)];
    return sc[Math.min(l,1)];
}
function updateTalents(mjp,mjr){
    if(mouseDown&&mjp){
        talentDragActive=true;talentIsDragging=false;talentPressStartedHere=true;
        talentDragStartX=mouseX;talentDragStartY=mouseY;
        talentScrollBaseX=talentScrollX;talentScrollBaseY=talentScrollY;
    }
    if(mjr&&!talentIsDragging&&talentPressStartedHere){
        const bx=20,by=SCREEN_HEIGHT-BTN_SIZE-20,bw=BTN_SIZE,bh=BTN_SIZE;
        if(mouseX>=bx&&mouseX<=bx+bw&&mouseY>=by&&mouseY<=by+bh)page='LEVELS';
    }
    if(!mouseDown){talentDragActive=false;talentIsDragging=false;talentPressStartedHere=false;}
    if(talentDragActive){
        const dx=mouseX-talentDragStartX,dy=mouseY-talentDragStartY;
        if(!talentIsDragging&&(Math.abs(dx)>5||Math.abs(dy)>5))talentIsDragging=true;
        if(talentIsDragging){
            talentScrollX=talentScrollBaseX+dx;talentScrollY=talentScrollBaseY+dy;
            const minX=-(Math.max(...BRANCH_X_WORLD)-SCREEN_WIDTH+250);
            if(talentScrollX>200)talentScrollX=200;
            if(talentScrollX<minX)talentScrollX=minX;
            if(talentScrollY<0)talentScrollY=0;
            if(talentScrollY>talentMaxScrollY())talentScrollY=talentMaxScrollY();
        }
    }
    talentHoveredId=-1;
    for(let i=0;i<TALENT_COUNT;i++){
        if(i%LEVELS_PER_BRANCH>=BRANCH_LEVELS[Math.floor(i/LEVELS_PER_BRANCH)])continue;
        const r=talentGetRect(i);
        if(mouseX>=r.x&&mouseX<=r.x+r.w&&mouseY>=r.y&&mouseY<=r.y+r.h)talentHoveredId=i;
    }
    const hForBuy=mouseDown&&!talentIsDragging&&talentHoveredId>=0&&talentCanBuy(talentHoveredId);
    const hForDes=mouseDown&&!talentIsDragging&&talentHoveredId>=0&&talentPurchased[talentHoveredId];
    if(hForBuy||hForDes){
        const isDesel=talentPurchased[talentHoveredId];
        if(talentHoldingId!==talentHoveredId||talentHoldingIsDesel!==isDesel){
            talentHoldingId=talentHoveredId;talentHoldStart=performance.now();
            talentHoldProgress=0;talentHoldingIsDesel=isDesel;
        }
        talentHoldProgress=(performance.now()-talentHoldStart)/600;
        if(talentHoldProgress>=1){
            if(talentHoldingIsDesel)talentDeselTalent(talentHoldingId);
            else talentBuyTalent(talentHoldingId);
            talentHoldingId=-1;talentHoldProgress=0;
        }
    }else{talentHoldingId=-1;talentHoldProgress=0;}
}
function renderTalents(ctx,btnSheet,greySheet,tintSheet,textSheet,iconsImg){
    ctx.fillStyle='rgb(140,20,20)';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
    // Bottom bar
    const barY=SCREEN_HEIGHT-22;
    ctx.save();ctx.globalAlpha=100/255;ctx.strokeStyle='rgb(180,180,180)';
    ctx.beginPath();ctx.moveTo(0,barY);ctx.lineTo(SCREEN_WIDTH,barY);ctx.stroke();
    ctx.restore();
    // Line helper — solid when both endpoints are purchased, dotted otherwise
    function thickLine(x1,y1,x2,y2,solid){
        ctx.save();ctx.globalAlpha=120/255;ctx.strokeStyle='rgb(0,0,0)';
        ctx.lineWidth=12;ctx.lineCap='round';
        ctx.setLineDash(solid?[]:[12,24]);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    // Vertical trunk lines (primary branches)
    for(const pb of[0,1,2,7]){
        const r=talentGetRect(pb*LEVELS_PER_BRANCH);
        const bx=r.x+r.w/2,by=r.y+r.h;
        thickLine(bx,barY,bx,by,talentPurchased[pb*LEVELS_PER_BRANCH]);
    }
    // Horizontal branch connections
    function hLine(pBranch,pLevel,cBranch){
        const rP=talentGetRect(pBranch*LEVELS_PER_BRANCH+pLevel);
        const rC=talentGetRect(cBranch*LEVELS_PER_BRANCH);
        const solid=talentPurchased[pBranch*LEVELS_PER_BRANCH+pLevel]&&talentPurchased[cBranch*LEVELS_PER_BRANCH];
        thickLine(rP.x+rP.w/2,rP.y+rP.h/2,rC.x+rC.w/2,rC.y+rC.h/2,solid);
    }
    hLine(0,2,6);hLine(2,2,3);hLine(2,3,4);hLine(3,2,5);hLine(7,3,8);hLine(2,7,9);hLine(8,1,10);
    // Vertical lines within branches
    for(let b=0;b<11;b++){
        for(let lv=0;lv<LEVELS_PER_BRANCH-1;lv++){
            if(lv>=BRANCH_LEVELS[b]-1)continue;
            const rL=talentGetRect(b*LEVELS_PER_BRANCH+lv);
            const rH=talentGetRect(b*LEVELS_PER_BRANCH+lv+1);
            const solid=talentPurchased[b*LEVELS_PER_BRANCH+lv]&&talentPurchased[b*LEVELS_PER_BRANCH+lv+1];
            thickLine(rL.x+rL.w/2,rL.y,rH.x+rH.w/2,rH.y+rH.h,solid);
        }
    }
    // Talent buttons
    for(let i=0;i<TALENT_COUNT;i++){
        if(i%LEVELS_PER_BRANCH>=BRANCH_LEVELS[Math.floor(i/LEVELS_PER_BRANCH)])continue;
        const r=talentGetRect(i);
        if(r.x+r.w<-BTN_SIZE||r.x>SCREEN_WIDTH+BTN_SIZE)continue;
        if(r.y+r.h<0||r.y>SCREEN_HEIGHT+BTN_SIZE)continue;
        const b=Math.floor(i/LEVELS_PER_BRANCH),l=i%LEVELS_PER_BRANCH;
        const purchased=talentPurchased[i],canBuy=talentCanBuy(i),hovered=(talentHoveredId===i);
        let expand=0;
        if(talentHoldingId===i){expand=Math.floor(Math.abs(Math.sin(performance.now()*Math.PI/270))*14);}
        else if(hovered)expand=5;
        const dr={x:r.x-expand,y:r.y-expand,w:r.w+expand*2,h:r.h+expand*2};
        const rowMap=[0,1,2,3,4,5,7,6,8,9,10];
        const row=rowMap[b];
        const sx=60,sy=row*20,sw=20,sh=20;
        if(!canBuy&&!purchased){
            if(greySheet){ctx.drawImage(greySheet,sx,sy,sw,sh,dr.x,dr.y,dr.w,dr.h);}
        }else{
            ctx.drawImage(purchased?tintSheet:btnSheet,sx,sy,sw,sh,dr.x,dr.y,dr.w,dr.h);
        }
        // Cost badge
        if(!purchased){
            const bw=40,bh=40;
            const bdx=dr.x+dr.w-bw+5,bdy=dr.y-5;
            ctx.save();ctx.imageSmoothingEnabled=false;
            if(!canBuy) ctx.filter='grayscale(1)';
            ctx.drawImage(iconsImg,0,24,8,8,bdx,bdy,bw,bh);
            ctx.restore();
            const cost=String(talentCost(b,l));
            const numScale=cost.length>=3?13/21:cost.length>=2?16/21:1;
            const cx=Math.floor(bdx+bw/2),cy=Math.floor(bdy+bh/2);
            ctx.save();ctx.translate(cx,cy);ctx.scale(numScale,numScale);
            const nw=cost.length*(4*3+3);
            renderText(ctx,textSheet,cost,Math.floor(-nw/2),-10,1);
            ctx.restore();
        }
    }
    // Tooltip
    if(talentHoveredId>=0){
        const b=Math.floor(talentHoveredId/LEVELS_PER_BRANCH),l=talentHoveredId%LEVELS_PER_BRANCH;
        const purchased=talentPurchased[talentHoveredId];
        const desc=talentBranchName(b);
        const stat=talentStatStr(b,l);
        let hint;
        if(purchased){
            let higherOwned=0;
            for(let x=l+1;x<LEVELS_PER_BRANCH;x++)if(talentPurchased[b*LEVELS_PER_BRANCH+x])higherOwned++;
            hint=higherOwned>0?'HOLD TO REFUND ('+(higherOwned+1)+' LEVELS)':'HOLD TO REFUND';
        }else if(talentCanBuy(talentHoveredId)){
            const ac=talentAutoBuyCount(talentHoveredId),tc=talentTotalCostToBuy(talentHoveredId);
            hint=ac>0?'HOLD TO BUY (+'+ac+' AUTO, '+tc+' TP)':'HOLD TO BUY';
        }else{
            const need=talentTotalCostToBuy(talentHoveredId)-(totalTalentPoints-spentTalentPoints);
            hint='NEED '+need+' MORE TP';
        }
        const key=talentKeyStr(b);
        const ty=SCREEN_HEIGHT-210-(key?36:0);
        const dw=desc.length*(4*3*2+3),sw2=stat.length*(4*3*2+3),hw=hint.length*(4*3+3),kw=key.length*(4*3+3);
        const padX=24,padY=14,boxW=Math.max(dw,Math.max(sw2,Math.max(hw,kw)))+padX*2;
        const hintOff=key?150:118;
        const boxH=hintOff+21+padY*2;
        // Rounded bg
        ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
        const bx2=SCREEN_WM-boxW/2,by2=ty-padY;
        ctx.beginPath();ctx.roundRect(bx2,by2,boxW,boxH,12);ctx.fill();
        ctx.restore();
        renderText(ctx,textSheet,desc,SCREEN_WM-dw/2,ty,2,255,255,255);
        renderText(ctx,textSheet,stat,SCREEN_WM-sw2/2,ty+58,2,255,255,255);
        if(key){renderText(ctx,textSheet,key,SCREEN_WM-kw/2,ty+116,1,120,200,255);}
        renderText(ctx,textSheet,hint,SCREEN_WM-hw/2,ty+hintOff,1,255,255,255);
    }else{
        const dh='DRAG TO SCROLL';
        const dhw=dh.length*(4*3+3);
        renderText(ctx,textSheet,dh,SCREEN_WM-dhw/2,SCREEN_HEIGHT-110,1,255,255,255);
    }
    // Back button
    const bbx=20,bby=SCREEN_HEIGHT-BTN_SIZE-20,bbw=BTN_SIZE,bbh=BTN_SIZE;
    ctx.save();ctx.globalAlpha=80/255;ctx.filter='brightness(0)';
    ctx.drawImage(btnSheet,40,40,20,20,bbx-5,bby+5,bbw,bbh);ctx.restore();
    ctx.drawImage(btnSheet,40,40,20,20,bbx,bby,bbw,bbh);
    // TP display — rendered last so it sits above everything
    const tp=totalTalentPoints-spentTalentPoints;
    const tpStr='TP: '+tp;
    const tpW=tpStr.length*(4*3*2+3),tpH=7*3*2;
    const tpPadX=10,tpPadY=8;
    const tpBW=tpW+tpPadX*2,tpBH=tpH+tpPadY*2;
    const tpBX=SCREEN_WIDTH-tpBW-16,tpBY=SCREEN_HEIGHT-tpBH-16;
    ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
    ctx.beginPath();ctx.roundRect(tpBX,tpBY,tpBW,tpBH,8);ctx.fill();
    ctx.restore();
    renderText(ctx,textSheet,tpStr,tpBX+tpPadX,tpBY+tpPadY,2,255,255,255);
}


const UPDATE_LOG=[
    {date:'AUGUST 13TH 2026',lines:[
        '- Added Unpublish option to the right-click menu on your levels.',
        '- Undo/Redo (Cmd/Ctrl+Z / Cmd+Shift+Z / Ctrl+Y) added to the level editor.',
        '- Restarting a custom level (R) now correctly restarts that level',
        '  instead of loading the first official level.',
        '- Drafts can now be saved without placing a spawn point.',
    ]},
    {date:'AUGUST 10TH 2026',lines:[
        '- Added Custom Levels. Build your own levels in the editor',
        '  and publish them for everyone to play. Access via the',
        '  new Community Levels button on the level select screen.',
        '  If your level is interesting we might even consider adding it',
        '  as an official level!',
        '- Fixed resizing the window clipping the car through walls.',
        '- Fixed ghost trail disappearing abruptly on wall hit.',
    ]},
    {date:'AUGUST 8TH 2026',lines:[
        '- Added Duel a Player. Invite any player to a 1v1 race',
        '  with no DC or TP on the line — just for fun. Invite',
        '  cards pop up on any page so you never miss one.',
        '- Player usernames now display in their original casing',
        '  throughout the game instead of being forced uppercase.',
        '- Mobile boost button repositioned to avoid overlapping',
        '  other buttons and the chat input.',
        '- Removed leaderboard times obtained through cheating.',
        '  DM me if any were missed.',
    ]},
    {date:'JUNE 3RD 2026',lines:[
        '- Added Visuals tab in Settings: toggle Particles,',
        '  Screen Shake, and Edge Glow independently.',
        '- Kill block hit now fades the red vignette in and out smoothly.',
        '- Added Cookie skin (cookery).',
        '- Added Ignition skin (1500 DC).',
    ]},
    {date:'JUNE 1ST 2026',lines:[
        '- Added Multiplayer Racing. Race a random opponent and',
        '  wager 10% of each other\'s DC and TP. Map is selected',
        '  with a slot machine animation.',
        '- Mobile boost button moved to the bottom left.',
        '- Fixed talent saves being lost if you left the page too quickly.',
    ]},
    {date:'MAY 31ST 2026',lines:[
        '- Added Level 5.',
        '- Added Checkpoint block. Touch it to set your respawn point.',
        '- Added Siracha skin (6000 DC).',
        '- Fixed equipped skin not saving correctly between sessions.',
        '- Hold to Boost nerfed to 50% power.',
        '- Second Chance glow and particles now visible in Lobby.',
        '- Speed block glow and particles now visible in Lobby.',
        '- Ghost trail now visible for other players in Lobby.',
        '- All particle effects now visible for other players in Lobby.',
    ]},
    {date:'MAY 30TH 2026',lines:[
        '- Finish line now explodes with a burst of colored particles.',
        '- Car now leaves a ghost trail at very high speed.',
        '- Second Chance immunity now shows a golden glow and particles.',
        '- Speed blocks now show a green glow and particles.',
        '- Fixed chat text cursor not appearing over the chat box.',
        '- Fixed tile and background gaps, especially on mobile.',
        '- Added Dev Skin (exclusive).',
        '- Leaderboard username now updates when you change your username.',
        '- Added /resetdriftcoins and /resettalentpoints admin commands.',
    ]},
    {date:'MAY 29TH 2026',lines:[
        '- Speed blocks no longer cap your speed during the effect.',
        '- Added mobile chat typing support.',
        '- Added drag to scroll in Leaderboard and Updates on mobile.',
        '- Updates button now wobbles when there is a new update.',
        '- Added chat history. Open chat to scroll through all',
        '  messages since you logged in.',
        '- Other players in the Lobby now show particles',
        '  (ice drift, wall hits, boost).',
        '- Wall particles now emit from the contact point.',
        '- Speed block glow fades in and out smoothly.',
        '- Car now squishes slightly at high speed.',
        '- Game now auto-reloads when a new version is available.',
        '- Fixed Evasion talent causing negative Talent Points.',
        '- Security improvements.',
    ]},
    {date:'MAY 28TH 2026',lines:[
        '- Added Skin Shop. Buy car skins with DC.',
        '- Added 4 skins: Default (free), Y2K (500 DC),',
        '  Skateboard (1000 DC), Ant Mobile (5000 DC).',
        '- Added new Talent: Evasion. Extends from max Second Chance.',
        '- Added mobile boost button to Settings.',
        '- Added wall hit particles, kill block particles,',
        '  and green grass drift particles.',
        '- Added screen shake and red vignette on kill block hit.',
        '- Added squash and stretch effect on boost.',
        '- Reduced level 4 coin reward from 100 to 20.',
    ]},
    {date:'MAY 27TH 2026',lines:[
        '- Added global multiplayer chat. Press Enter or click the chat',
        '  box to type. Messages appear on screen and above players',
        '  in the Lobby.',
        '- Added Change Username and Change Password to Settings.',
        '- Added new Talent: Hold Boost. Hold Shift to boost automatically',
        '  when off cooldown. Requires max Boost. Costs 5000 TP.',
        '- Added more typeable symbols to the font.',
        '- Added Multiplayer Lobby.',
    ]},
    {date:'MAY 26TH 2026',lines:[
        '- Added boost particles.',
        '- Boost no longer has a max speed cap.',
        '- Removed pushback when entering void with 2nd Chance immunity.',
        '- Added countdown timer before the start wall disappears.',
        '- Fixed level 4 skip.',
        '- Made level 4 overall easier.',
    ]},
    {date:'MAY 24TH 2026',lines:[
        '- Added Drift Coins(DC). Obtain DC by completing levels.',
        '- Added Talent Points(TP). Convert 5 DC into 1 TP in Convert panel.',
        '- Added Talents. Buy with TP.',
        '- Added New Block: Speed Block.',
        '- Added Accounts.',
        '- Added Leaderboard.',
        '- Added Level 4.',
        '- Added R to restart.',
        '- Added Back button to levels.',
        '- Added Discord Server link.',
        '- Fixed window size bug on spawn.',
        '- Fixed glitching through walls.',
        '- Fixed staying on end block instantly finishing your next run.',
    ]},
    {date:'MAY 16TH 2026',lines:[
        '- Released game.',
    ]},
    {date:'APRIL 18TH 2026',lines:[
        '- Started development.',
    ]},
];
