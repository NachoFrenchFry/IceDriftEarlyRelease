class Tile {
    constructor(){
        this.active=false; this.type="WALL";
        this.tileNum=1; this.tileType=1; this.rot=0;
        this.hitbox={x:0,y:0,w:TILE_SIZE,h:TILE_SIZE};
        this.initialX=0; this.initialY=0;
    }
    init(ix,iy){ this.initialX=ix; this.initialY=iy; this.hitbox={x:ix,y:iy,w:TILE_SIZE,h:TILE_SIZE}; }
    setTile(up,down,left,right,ul,ur,dl,dr){
        if(this.type==="ICE")       {this.tileNum=7; this.tileType=1;this.rot=0;return;}
        if(this.type==="START")     {this.tileNum=9; this.tileType=1;this.rot=0;return;}
        if(this.type==="END")       {this.tileNum=9; this.tileType=2;this.rot=0;return;}
        if(this.type==="KILL_BLOCK"){this.tileNum=10;this.tileType=1;this.rot=0;return;}
        if(this.type==="VOID")      {this.tileNum=10;this.tileType=2;this.rot=0;return;}
        if(this.type==="SPEED_UP")   {this.tileNum=11;this.tileType=1;this.rot=0;return;}
        if(this.type==="SPEED_LEFT") {this.tileNum=11;this.tileType=2;this.rot=0;return;}
        if(this.type==="SPEED_DOWN") {this.tileNum=11;this.tileType=3;this.rot=0;return;}
        if(this.type==="SPEED_RIGHT"){this.tileNum=11;this.tileType=4;this.rot=0;return;}
        if(this.type==="GRASS")      {this.tileNum=8; this.tileType=1;this.rot=0;return;}
        if(this.type==="CHECKPOINT") {this.tileNum=12;this.tileType=1;this.rot=0;return;}
        if(this.type!=="WALL"&&this.type!=="START_WALL") return;
        // Normalize: treat START_WALL same as WALL for neighbor matching
        const norm=(t)=>(t==="START_WALL")?"WALL":t;
        const sn=norm(this.type);
        up.active    = up.active    && norm(up.type)===sn;
        down.active  = down.active  && norm(down.type)===sn;
        left.active  = left.active  && norm(left.type)===sn;
        right.active = right.active && norm(right.type)===sn;
        ul.active = ul.active && norm(ul.type)===sn;
        ur.active = ur.active && norm(ur.type)===sn;
        dl.active = dl.active && norm(dl.type)===sn;
        dr.active = dr.active && norm(dr.type)===sn;
        const u=up.active,d=down.active,l=left.active,r=right.active;
        const UL=ul.active,UR=ur.active,DL=dl.active,DR=dr.active;
        if(!u&&!d&&!l&&!r){this.tileNum=1;this.tileType=1;this.rot=0;}
        else if(!u&&!d&&!l&& r){this.tileNum=2;this.tileType=1;this.rot=0;}
        else if(!u&&!d&& l&&!r){this.tileNum=2;this.tileType=1;this.rot=2;}
        else if(!u&& d&&!l&&!r){this.tileNum=2;this.tileType=1;this.rot=1;}
        else if( u&&!d&&!l&&!r){this.tileNum=2;this.tileType=1;this.rot=3;}
        else if( u&&!d&&!l&& r&& UR){this.tileNum=3;this.tileType=1;this.rot=0;}
        else if(!u&& d&&!l&& r&& DR){this.tileNum=3;this.tileType=1;this.rot=1;}
        else if(!u&& d&& l&&!r&& DL){this.tileNum=3;this.tileType=1;this.rot=2;}
        else if( u&&!d&& l&&!r&& UL){this.tileNum=3;this.tileType=1;this.rot=3;}
        else if( u&&!d&&!l&& r&&!UR){this.tileNum=3;this.tileType=2;this.rot=0;}
        else if(!u&& d&&!l&& r&&!DR){this.tileNum=3;this.tileType=2;this.rot=1;}
        else if(!u&& d&& l&&!r&&!DL){this.tileNum=3;this.tileType=2;this.rot=2;}
        else if( u&&!d&& l&&!r&&!UL){this.tileNum=3;this.tileType=2;this.rot=3;}
        else if(!u&&!d&& l&& r){this.tileNum=4;this.tileType=1;this.rot=0;}
        else if( u&& d&&!l&&!r){this.tileNum=4;this.tileType=1;this.rot=1;}
        else if( u&&!d&& l&& r&& UR&& UL){this.tileNum=5;this.tileType=1;this.rot=0;}
        else if( u&& d&&!l&& r&& UR&& DR){this.tileNum=5;this.tileType=1;this.rot=1;}
        else if(!u&& d&& l&& r&& DR&& DL){this.tileNum=5;this.tileType=1;this.rot=2;}
        else if( u&& d&& l&&!r&& DL&& UL){this.tileNum=5;this.tileType=1;this.rot=3;}
        else if( u&&!d&& l&& r&& UR&&!UL){this.tileNum=5;this.tileType=2;this.rot=0;}
        else if( u&& d&&!l&& r&&!UR&& DR){this.tileNum=5;this.tileType=2;this.rot=1;}
        else if(!u&& d&& l&& r&&!DR&& DL){this.tileNum=5;this.tileType=2;this.rot=2;}
        else if( u&& d&& l&&!r&&!DL&& UL){this.tileNum=5;this.tileType=2;this.rot=3;}
        else if( u&&!d&& l&& r&&!UR&& UL){this.tileNum=5;this.tileType=3;this.rot=0;}
        else if( u&& d&&!l&& r&& UR&&!DR){this.tileNum=5;this.tileType=3;this.rot=1;}
        else if(!u&& d&& l&& r&& DR&&!DL){this.tileNum=5;this.tileType=3;this.rot=2;}
        else if( u&& d&& l&&!r&& DL&&!UL){this.tileNum=5;this.tileType=3;this.rot=3;}
        else if( u&&!d&& l&& r&&!UR&&!UL){this.tileNum=5;this.tileType=4;this.rot=0;}
        else if( u&& d&&!l&& r&&!UR&&!DR){this.tileNum=5;this.tileType=4;this.rot=1;}
        else if(!u&& d&& l&& r&&!DR&&!DL){this.tileNum=5;this.tileType=4;this.rot=2;}
        else if( u&& d&& l&&!r&&!DL&&!UL){this.tileNum=5;this.tileType=4;this.rot=3;}
        else if(u&&d&&l&&r&& UL&& UR&& DL&& DR){this.tileNum=6;this.tileType=1;this.rot=0;}
        else if(u&&d&&l&&r&&!UL&& UR&& DL&& DR){this.tileNum=6;this.tileType=2;this.rot=0;}
        else if(u&&d&&l&&r&& UL&&!UR&& DL&& DR){this.tileNum=6;this.tileType=2;this.rot=1;}
        else if(u&&d&&l&&r&& UL&& UR&& DL&&!DR){this.tileNum=6;this.tileType=2;this.rot=2;}
        else if(u&&d&&l&&r&& UL&& UR&&!DL&& DR){this.tileNum=6;this.tileType=2;this.rot=3;}
        else if(u&&d&&l&&r&&!UL&&!UR&& DL&& DR){this.tileNum=6;this.tileType=3;this.rot=0;}
        else if(u&&d&&l&&r&& UL&&!UR&& DL&&!DR){this.tileNum=6;this.tileType=3;this.rot=1;}
        else if(u&&d&&l&&r&& UL&& UR&&!DL&&!DR){this.tileNum=6;this.tileType=3;this.rot=2;}
        else if(u&&d&&l&&r&&!UL&& UR&&!DL&& DR){this.tileNum=6;this.tileType=3;this.rot=3;}
        else if(u&&d&&l&&r&&!UL&&!UR&& DL&&!DR){this.tileNum=6;this.tileType=4;this.rot=0;}
        else if(u&&d&&l&&r&& UL&&!UR&&!DL&&!DR){this.tileNum=6;this.tileType=4;this.rot=1;}
        else if(u&&d&&l&&r&&!UL&& UR&&!DL&&!DR){this.tileNum=6;this.tileType=4;this.rot=2;}
        else if(u&&d&&l&&r&&!UL&&!UR&&!DL&& DR){this.tileNum=6;this.tileType=4;this.rot=3;}
        else if(u&&d&&l&&r&&!UL&&!UR&&!DL&&!DR){this.tileNum=6;this.tileType=5;this.rot=0;}
        else if(u&&d&&l&&r&& UL&&!UR&&!DL&& DR){this.tileNum=6;this.tileType=6;this.rot=0;}
        else if(u&&d&&l&&r&&!UL&& UR&& DL&&!DR){this.tileNum=6;this.tileType=6;this.rot=1;}
    }
    update(px,py){ this.hitbox.x=this.initialX-px; this.hitbox.y=this.initialY-py; }
    renderGround(ctx,sheet,showHitboxes){
        const hb=this.hitbox;
        if(!this.active||this.type==="WALL"||this.type==="START_WALL"||this.type==="KILL_BLOCK") return;
        if(hb.x>-hb.w-cullMarginX&&hb.y>-hb.h-cullMarginY&&hb.x<SCREEN_WIDTH+cullMarginX&&hb.y<SCREEN_HEIGHT+cullMarginY){
            const sx=(this.tileNum-1)*17,sy=(this.tileType-1)*17;
            const rx=Math.round(hb.x),ry=Math.round(hb.y);
            const cx=rx+hb.w/2,cy=ry+hb.h/2;
            ctx.save();ctx.translate(cx,cy);ctx.rotate(this.rot*Math.PI/2);
            ctx.drawImage(sheet,sx,sy,17,17,-hb.w/2-2,-hb.h/2-2,hb.w+4,hb.h+4);
            ctx.restore();
            if(showHitboxes){
                if(this.type==="ICE"  ){ctx.strokeStyle='rgb(255,255,0)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="START"){ctx.strokeStyle='rgb(255,255,0)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="END"  ){ctx.strokeStyle='rgb(255,255,0)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="VOID" ){ctx.strokeStyle='rgb(128,0,255)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="SPEED_UP"   ){ctx.strokeStyle='rgb(0,255,128)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="SPEED_LEFT" ){ctx.strokeStyle='rgb(0,200,255)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="SPEED_DOWN" ){ctx.strokeStyle='rgb(0,255,200)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="SPEED_RIGHT"){ctx.strokeStyle='rgb(128,255,0)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="GRASS"      ){ctx.strokeStyle='rgb(0,180,80)'; ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
            }
        }
    }
    renderShadow(ctx){
        const hb=this.hitbox;
        if(!this.active||this.type!=="WALL"&&this.type!=="START_WALL"&&this.type!=="KILL_BLOCK") return;
        if(hb.x>-hb.w-cullMarginX&&hb.y>-hb.h-cullMarginY&&hb.x<SCREEN_WIDTH+cullMarginX&&hb.y<SCREEN_HEIGHT+cullMarginY){
            const rx=Math.round(hb.x),ry=Math.round(hb.y);
            ctx.save();ctx.globalAlpha=50/255;ctx.fillStyle='black';
            ctx.fillRect(rx-10,ry+10,hb.w,hb.h);
            ctx.restore();
        }
    }
    render(ctx,sheet,showHitboxes){
        const hb=this.hitbox;
        if(!this.active||this.type!=="WALL"&&this.type!=="START_WALL"&&this.type!=="KILL_BLOCK") return;
        if(hb.x>-hb.w-cullMarginX&&hb.y>-hb.h-cullMarginY&&hb.x<SCREEN_WIDTH+cullMarginX&&hb.y<SCREEN_HEIGHT+cullMarginY){
            const sx=(this.tileNum-1)*17,sy=(this.tileType-1)*17;
            const rx=Math.round(hb.x),ry=Math.round(hb.y);
            const cx=rx+hb.w/2,cy=ry+hb.h/2;
            ctx.save();ctx.translate(cx,cy);ctx.rotate(this.rot*Math.PI/2);
            ctx.drawImage(sheet,sx,sy,17,17,-hb.w/2-2,-hb.h/2-2,hb.w+4,hb.h+4);
            ctx.restore();
            if(showHitboxes){
                if(this.type==="WALL"      ){ctx.strokeStyle='rgb(255,0,0)';  ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="START_WALL"){ctx.strokeStyle='rgb(255,128,0)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
                if(this.type==="KILL_BLOCK"){ctx.strokeStyle='rgb(255,255,255)';ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);}
            }
        }
    }
}

class Car {
    constructor(){
        this.xVel=0; this.yVel=0;
        this.drawDir=270;
        this.xPos=INITIAL_CAR_X;
        this.yPos=INITIAL_CAR_Y;
        this.visual={x:SCREEN_WM-Math.floor(CAR_WIDTH/2),y:SCREEN_HM-Math.floor(CAR_HEIGHT/2),w:CAR_WIDTH,h:CAR_HEIGHT};
        this.hitbox={x:SCREEN_WM-Math.floor(CAR_WIDTH/2),y:SCREEN_HM-Math.floor(CAR_HEIGHT/2),w:50,h:50};
        this.mouseX=0; this.mouseY=0;
    }
    reset(){
        this.xPos=INITIAL_CAR_X; this.yPos=INITIAL_CAR_Y;
        this.xVel=0; this.yVel=0; this.drawDir=270;
    }
    resize(){
        this.visual.x=SCREEN_WM-Math.floor(CAR_WIDTH/2);
        this.visual.y=SCREEN_HM-Math.floor(CAR_HEIGHT/2);
        this.hitbox.x=SCREEN_WM-Math.floor(CAR_WIDTH/2);
        this.hitbox.y=SCREEN_HM-Math.floor(CAR_HEIGHT/2);
    }
    updateMovement(mx,my,dt){
        const ox=mx-(SCREEN_WM-Math.floor(CAR_WIDTH/2));
        const oy=my-(SCREEN_HM-Math.floor(CAR_HEIGHT/2));
        let dx=ox/900, dy=oy/900;
        const accel=ACCELERATION*accelerationMult*(performance.now()<speedTileEnd?2.0:1.0);
        if(dx> accel) dx= accel;
        if(dy> accel) dy= accel;
        if(dx<-accel) dx=-accel;
        if(dy<-accel) dy=-accel;
        this.xVel+=dx*dt; this.yVel+=dy*dt;
        if(dx!==0||dy!==0) this.drawDir=Math.atan2(dy,dx)*180/Math.PI+90;
    }
    updatePosition(tiles,dt){
        // Second chance immunity timer
        if(secondChanceImmune&&performance.now()>=secondChanceImmunityEnd) secondChanceImmune=false;

        const hb=this.hitbox;
        const hbCx=SCREEN_WM-Math.floor(CAR_WIDTH/2);
        const hbCy=SCREEN_HM-Math.floor(CAR_HEIGHT/2);
        hb.x=hbCx; hb.y=hbCy;

        // Wall step-sweep (must run BEFORE tile checks so signX/Y are set)
        let xHit=false,yHit=false,sweepKillHit=false,sweepEndHit=false;
        const signX=Math.sign(this.xVel),signY=Math.sign(this.yVel);
        const xSteps=Math.ceil(Math.abs(this.xVel*dt));
        const ySteps=Math.ceil(Math.abs(this.yVel*dt));
        for(let s=0;s<xSteps;s++){
            hb.x+=signX;
            for(let i=0;i<TILE_GRID_HEIGHT;i++) for(let j=0;j<TILE_GRID_WIDTH;j++){
                const t=tiles[i][j];
                if(!t.active) continue;
                if((t.type==="WALL"||t.type==="START_WALL")&&hasIntersection(hb,t.hitbox)) xHit=true;
                if(t.type==="KILL_BLOCK"&&hasIntersection(hb,t.hitbox)){xHit=true;sweepKillHit=true;}
                if(t.type==="END"&&hasIntersection(hb,t.hitbox)) sweepEndHit=true;
            }
        }
        hb.x=hbCx;
        for(let s=0;s<ySteps;s++){
            hb.y+=signY;
            for(let i=0;i<TILE_GRID_HEIGHT;i++) for(let j=0;j<TILE_GRID_WIDTH;j++){
                const t=tiles[i][j];
                if(!t.active) continue;
                if((t.type==="WALL"||t.type==="START_WALL")&&hasIntersection(hb,t.hitbox)) yHit=true;
                if(t.type==="KILL_BLOCK"&&hasIntersection(hb,t.hitbox)){yHit=true;sweepKillHit=true;}
                if(t.type==="END"&&hasIntersection(hb,t.hitbox)) sweepEndHit=true;
            }
        }
        hb.x=hbCx; hb.y=hbCy;

        // ICE / END / SPEED / GRASS detection
        let onIce=false,anyGrass=false,allGrass=true;
        for(let i=0;i<TILE_GRID_HEIGHT;i++) for(let j=0;j<TILE_GRID_WIDTH;j++){
            const t=tiles[i][j];
            if(!hasIntersection(hb,t.hitbox)) continue;
            if(t.active&&(t.type==="ICE"||t.type==="SPEED_UP"||t.type==="SPEED_LEFT"||t.type==="SPEED_DOWN"||t.type==="SPEED_RIGHT")) onIce=true;
            if(t.active&&(t.type==="SPEED_UP"||t.type==="SPEED_LEFT"||t.type==="SPEED_DOWN"||t.type==="SPEED_RIGHT")){const _sn=performance.now();if(_sn>=speedTileEnd)speedGlowStart=_sn;speedTileEnd=_sn+2000;}
            if(t.active&&t.type==="GRASS") anyGrass=true; else allGrass=false;
            if(t.active&&t.type==="CHECKPOINT"){checkpointX=this.xPos;checkpointY=this.yPos;}
            if(t.active&&t.type==="END"&&!finish&&(hasIntersection(hb,t.hitbox)||sweepEndHit)){
                finish=true; finishTick=performance.now();
                {const _fb=performance.now();
                const _cols=[[255,60,60],[255,180,0],[0,230,80],[0,180,255],[230,60,255],[255,240,0],[255,120,30],[60,255,220]];
                for(let _fi=0;_fi<280;_fi++){
                    const _fa=Math.random()*Math.PI*2,_fspd=5+Math.random()*22;
                    const _fc=_cols[_fi%_cols.length];
                    particles.push({wx:this.xPos+SCREEN_WM+(Math.random()-0.5)*30,wy:this.yPos+SCREEN_HM+(Math.random()-0.5)*30,
                        vx:Math.cos(_fa)*_fspd,vy:Math.sin(_fa)*_fspd,
                        born:_fb,life:600+Math.random()*900,size:5+Math.random()*14,
                        finish:true,r:_fc[0],g:_fc[1],b:_fc[2],rot:Math.random()*Math.PI*2});
                }}
                finishTime=(finishTick-gameStartTime-3000)/1000;
                if(page==='RACE_GAME'){
                    raceLocalFin=true;raceLocalFinTime=finishTime;
                    raceChannel?.send({type:'broadcast',event:'finish',payload:{uid:currentUser?.id,time:finishTime}});
                    checkRaceEnd();
                }
                if(!antiCheatFlagged&&page!=='RACE_GAME'&&!editorFromEditorPlay&&!playingCommunityLevel){
                const dcRewards=[1,5,10,20,100];
                driftCoins+=dcRewards[currentLevel]||0;
                dbSaveProfile();
                dbSaveTime(currentLevel,finishTime);
                }
            }
        }

        // Kill block
        const resetCar=()=>{
            this.xPos=checkpointX!==null?checkpointX:INITIAL_CAR_X;
            this.yPos=checkpointY!==null?checkpointY:INITIAL_CAR_Y;
            this.xVel=0;this.yVel=0;
            const _isCheckpointRespawn=checkpointX!==null;
            const _skipCountdown=_isCheckpointRespawn||page==='RACE_GAME';
            finish=false;if(!_skipCountdown)gameStartTime=performance.now();startWallDeactivated=_skipCountdown;boostOverriding=false;particles=[];iceParticleAccum=0;prevIceVelX=0;prevIceVelY=0;countdownGoEnd=0;evasionDmgCheckEnd=0;ghostTrail=[];ghostTrailLastRecord=0;
            if(!_isCheckpointRespawn) for(let r=0;r<TILE_GRID_HEIGHT;r++) for(let c=0;c<TILE_GRID_WIDTH;c++)
                if(tiles[r][c].type==="START_WALL") tiles[r][c].active=true;
        };
        const _pnow=performance.now();const doDmgCheck=!evasionUnlocked||_pnow>=evasionDmgCheckEnd;if(doDmgCheck&&evasionUnlocked)evasionDmgCheckEnd=_pnow+1000;
        let killBlockHit=false;
        for(let i=0;i<TILE_GRID_HEIGHT&&!killBlockHit;i++) for(let j=0;j<TILE_GRID_WIDTH&&!killBlockHit;j++){
            const t=tiles[i][j];
            if(t.active&&t.type==="KILL_BLOCK"&&hasIntersection(hb,t.hitbox)){
                killBlockHit=true;
                if(doDmgCheck){
                if(secondChanceUnlocked&&!secondChanceImmune&&performance.now()>=secondChanceCooldownEnd){
                    secondChanceImmune=true;
                    const imMs=(secondChanceLevel>=2)?3000:1000;
                    secondChanceImmunityEnd=performance.now()+imMs;
                    secondChanceImmunityTotal=imMs;
                    const scCD=(secondChanceLevel>=2)?5000:10000;
                    secondChanceCooldownEnd=secondChanceImmunityEnd+scCD;
                    secondChanceTotalDuration=scCD;
                }else if(!secondChanceImmune){const EC=[0,.10,.20,.30,.40,.50];if(evasionUnlocked&&performance.now()>=evasionCooldownEnd&&Math.random()<(EC[Math.min(evasionLevel,5)])){evasionCooldownEnd=performance.now()+1500;}else{resetCar();}}
                }
                if(secondChanceImmune){
                    const inter=rectIntersect(hb,t.hitbox);
                    if(inter){
                        if(inter.w<=inter.h){
                            if(hb.x<t.hitbox.x){this.xPos-=inter.w;this.xVel=-Math.abs(this.xVel)*0.15;}
                            else{this.xPos+=inter.w;this.xVel=Math.abs(this.xVel)*0.15;}
                        }else{
                            if(hb.y<t.hitbox.y){this.yPos-=inter.h;this.yVel=-Math.abs(this.yVel)*0.15;}
                            else{this.yPos+=inter.h;this.yVel=Math.abs(this.yVel)*0.15;}
                        }
                    }
                }
            }
        }
        if(!killBlockHit&&sweepKillHit){
            killBlockHit=true;
            if(doDmgCheck){
            if(secondChanceUnlocked&&!secondChanceImmune&&performance.now()>=secondChanceCooldownEnd){
                secondChanceImmune=true;
                const imMs=(secondChanceLevel>=2)?3000:1000;
                secondChanceImmunityEnd=performance.now()+imMs;
                secondChanceImmunityTotal=imMs;
                const scCD=(secondChanceLevel>=2)?5000:10000;
                secondChanceCooldownEnd=secondChanceImmunityEnd+scCD;
                secondChanceTotalDuration=scCD;
            }else if(!secondChanceImmune){const EC=[0,.10,.20,.30,.40,.50];if(evasionUnlocked&&performance.now()>=evasionCooldownEnd&&Math.random()<(EC[Math.min(evasionLevel,5)])){evasionCooldownEnd=performance.now()+1500;}else{resetCar();}}
            }
        }
        this.lastKillHit=killBlockHit;

        // Void + void background
        {
            let anyVoid=false,allVoid=true,anyActiveTile=false;
            for(let i=0;i<TILE_GRID_HEIGHT;i++) for(let j=0;j<TILE_GRID_WIDTH;j++)
                if(hasIntersection(hb,tiles[i][j].hitbox)){
                    if(tiles[i][j].active){
                        anyActiveTile=true;
                        if(tiles[i][j].type==="VOID") anyVoid=true;
                        else allVoid=false;
                    } else { allVoid=false; }
                }
            if((anyVoid&&allVoid)||!anyActiveTile){
                if(doDmgCheck){
                if(secondChanceUnlocked&&!secondChanceImmune&&performance.now()>=secondChanceCooldownEnd){
                    secondChanceImmune=true;
                    const imMs=(secondChanceLevel>=2)?3000:1000;
                    secondChanceImmunityEnd=performance.now()+imMs;
                    secondChanceImmunityTotal=imMs;
                    const scCD=(secondChanceLevel>=2)?5000:10000;
                    secondChanceCooldownEnd=secondChanceImmunityEnd+scCD;
                    secondChanceTotalDuration=scCD;
                }else if(!secondChanceImmune){const EC=[0,.10,.20,.30,.40,.50];if(evasionUnlocked&&performance.now()>=evasionCooldownEnd&&Math.random()<(EC[Math.min(evasionLevel,5)])){evasionCooldownEnd=performance.now()+1500;}else{resetCar();}}
                }
            }
        }

        // Friction
        const onGrass=anyGrass&&allGrass;
        const ff=onGrass?0.91:onIce?FRICTION:0.9;
        this.xVel*=Math.pow(ff,dt); this.yVel*=Math.pow(ff,dt);
        if(Math.abs(this.xVel)<0.05) this.xVel=0;
        if(Math.abs(this.yVel)<0.05) this.yVel=0;

        // Wall bounce with direction check + dampener
        const wallBounceCoeffs=[0.35,0.20,0.10,0.03,0.0,0,0,0];
        const bounceCoeff=(wallDampenerUnlocked&&wallDampenerLevel>=1)?wallBounceCoeffs[wallDampenerLevel-1]:0.4;
        const preWallSpd=Math.sqrt(this.xVel*this.xVel+this.yVel*this.yVel);
        if(xHit&&this.xVel*signX>0) this.xVel*=-bounceCoeff;
        if(yHit&&this.yVel*signY>0) this.yVel*=-bounceCoeff;
        this.lastWallHit=(xHit||yHit)&&preWallSpd>2;
        this.lastWallNX=xHit?-signX:0;this.lastWallNY=yHit?-signY:0;
        this.lastWallPreSpeed=preWallSpd;this.onGrass=onGrass;

        // Speed cap (suspended while boost override is active)
        const spd=Math.sqrt(this.xVel*this.xVel+this.yVel*this.yVel);
        if(boostOverriding&&spd<=35) boostOverriding=false;
        if(!boostOverriding&&performance.now()>=speedTileEnd&&spd>35){this.xVel=this.xVel/spd*35;this.yVel=this.yVel/spd*35;}

        // Position update
        this.xPos+=this.xVel*dt; this.yPos+=this.yVel*dt;

        // Pushout pass (resolve wall penetration using new position)
        const cHB={x:SCREEN_WM-Math.floor(CAR_WIDTH/2),y:SCREEN_HM-Math.floor(CAR_HEIGHT/2),w:50,h:50};
        for(let pi=0;pi<TILE_GRID_HEIGHT;pi++) for(let pj=0;pj<TILE_GRID_WIDTH;pj++){
            const t=tiles[pi][pj];
            if(!t.active||t.type!=="WALL"&&t.type!=="START_WALL"&&!(secondChanceImmune&&t.type==="KILL_BLOCK")) continue;
            const tHB={x:t.initialX-Math.floor(this.xPos),y:t.initialY-Math.floor(this.yPos),w:TILE_SIZE,h:TILE_SIZE};
            const inter=rectIntersect(cHB,tHB);
            if(inter){
                if(inter.w<=inter.h){
                    if(cHB.x<tHB.x){this.xPos-=inter.w;if(this.xVel>0)this.xVel=0;}
                    else{this.xPos+=inter.w;if(this.xVel<0)this.xVel=0;}
                }else{
                    if(cHB.y<tHB.y){this.yPos-=inter.h;if(this.yVel>0)this.yVel=0;}
                    else{this.yPos+=inter.h;if(this.yVel<0)this.yVel=0;}
                }
            }
        }
    }
    update(mx,my,tiles,dt,sjp,rmp){
        // Refill double charge (per-slot)
        if(doubleChargeUnlocked) boost2ChargesLeft=boost2CooldownEnds.filter(e=>performance.now()>=e).length;
        // Boost (shift)
        if(boostUnlocked&&(sjp||(holdBoostUnlocked&&shiftWasDown))){
            const primaryReady=performance.now()>=boostCooldownEnd;
            const extraReady=doubleChargeUnlocked&&boost2ChargesLeft>0;
            if(primaryReady||extraReady){
                const bx2=mx-SCREEN_WM,by2=my-SCREEN_HM;
                const blen=Math.sqrt(bx2*bx2+by2*by2);
                if(blen>1){
                    const BImp=[1.5,2.5,3.5,4.5,6.0,7.5,9.0,11.0];
                    const BCD=[12000,8000,6000,4000,2500,1500,750,350];
                    const _isHold=!sjp&&holdBoostUnlocked&&shiftWasDown;
                    const imp=((boostLevel>=1&&boostLevel<=8)?BImp[boostLevel-1]:5)*(_isHold?0.5:1);
                    const cd=Math.floor(((boostLevel>=1&&boostLevel<=8)?BCD[boostLevel-1]:8000)*reloadCooldownMult);
                    this.xVel+=(bx2/blen)*imp; this.yVel+=(by2/blen)*imp;
                    boostOverriding=true;boostStretchStart=performance.now();
                    {const pnow=performance.now();
                    const bNx=-(bx2/blen),bNy=-(by2/blen);
                    if(page==='LOBBY') lobbyPfxQueue.push({t:'b',dx:bNx,dy:bNy});
                    for(let _i=0;_i<60;_i++){
                        const a=(Math.random()-0.5)*Math.PI*(Math.random()<0.4?1.1:0.7);
                        const ca=Math.cos(a),sa=Math.sin(a);
                        const pdx=bNx*ca-bNy*sa,pdy=bNx*sa+bNy*ca;
                        const isSmoke=Math.random()<0.35;
                        const spd=isSmoke?(1+Math.random()*3):(4+Math.random()*8);
                        particles.push({
                            wx:this.xPos+SCREEN_WM+bNx*32,
                            wy:this.yPos+SCREEN_HM+bNy*32,
                            vx:pdx*spd,vy:pdy*spd,
                            born:pnow,
                            life:isSmoke?(600+Math.random()*500):(200+Math.random()*250),
                            size:isSmoke?(7+Math.random()*8):(3+Math.random()*4),
                            smoke:isSmoke
                        });
                    }}
                    if(primaryReady){boostCooldownEnd=performance.now()+cd;boostCooldownTotal=cd;}
                    else{
                        const crm=[1.0,0.9,0.8,0.7,1.0,0.9,0.8,0.7];
                        const mult=(doubleChargeLevel>=1&&doubleChargeLevel<=8)?crm[doubleChargeLevel-1]:1;
                        const cdVal=cd*mult;
                        const slot=boost2CooldownEnds.findIndex(e=>performance.now()>=e);
                        if(slot>=0){boost2CooldownEnds[slot]=performance.now()+cdVal;boost2CooldownTotals[slot]=cdVal;}
                    }
                }
            }
        }
        // Turbo Brake (right mouse)
        if(turboBrakeUnlocked&&rmp&&performance.now()>=turboBrakeCooldownEnd){
            const cds=[4000,3500,3000,2500,2000,1500,1000,500];
            const cd=(turboBrakeLevel>=1&&turboBrakeLevel<=8)?cds[turboBrakeLevel-1]:4000;
            this.xVel=0; this.yVel=0;
            turboBrakeCooldownEnd=performance.now()+cd;turboBrakeCooldownTotal=cd;
        }
        this.updateMovement(mx,my,dt); this.updatePosition(tiles,dt); this.mouseX=mx; this.mouseY=my;
    }
    render(ctx,carImg,showHitboxes){
        const sk=SKINS[Math.min(selectedSkin,SKINS.length-1)];
        const rW=sk.sw*SKIN_SCALE,rH=CAR_HEIGHT;
        const sOff=5,pivY=10;
        const bsT=Math.min((performance.now()-boostStretchStart)/500,1);
        const bsVal=bsT<1?Math.exp(-3.5*bsT)*Math.cos(2.2*Math.PI*bsT):0;
        const bsX=(1-0.35*bsVal),bsY=(1+0.45*bsVal);
        ctx.save();
        ctx.globalAlpha=50/255;
        ctx.filter='brightness(0)';
        ctx.imageSmoothingEnabled=false;
        ctx.translate(SCREEN_WM-sOff,SCREEN_HM+sOff-pivY);
        ctx.rotate(this.drawDir*Math.PI/180);
        ctx.scale(bsX,bsY);
        ctx.drawImage(carImg,sk.sx,0,sk.sw,SKIN_H,-rW/2,-rH/2,rW,rH);
        ctx.restore();
        ctx.save();
        ctx.imageSmoothingEnabled=false;
        ctx.translate(SCREEN_WM,SCREEN_HM-pivY);
        ctx.rotate(this.drawDir*Math.PI/180);
        ctx.scale(bsX,bsY);
        ctx.drawImage(carImg,sk.sx,0,sk.sw,SKIN_H,-rW/2,-rH/2,rW,rH);
        ctx.restore();
        if(showHitboxes){
            const hb=this.hitbox;
            ctx.strokeStyle='rgb(255,0,0)';
            ctx.strokeRect(hb.x,hb.y,hb.w,hb.h);
            const hcx=hb.x+hb.w/2, hcy=hb.y+hb.h/2;
            ctx.strokeStyle='rgb(0,0,255)';
            ctx.beginPath();
            ctx.moveTo(hcx,hcy);
            ctx.lineTo(this.mouseX,this.mouseY);
            ctx.stroke();
            if(this.xVel!==0||this.yVel!==0){
                const mouseLen=Math.sqrt((this.mouseX-hcx)**2+(this.mouseY-hcy)**2);
                const velLen=Math.sqrt(this.xVel*this.xVel+this.yVel*this.yVel);
                ctx.strokeStyle='rgb(0,255,255)';
                ctx.beginPath();
                ctx.moveTo(hcx,hcy);
                ctx.lineTo(hcx+(this.xVel/velLen)*mouseLen,hcy+(this.yVel/velLen)*mouseLen);
                ctx.stroke();
            }
        }
    }
}

class Background {
    constructor(){
        this.bgType=1;
        this.initCarX=INITIAL_CAR_X;
        this.initCarY=INITIAL_CAR_Y;
        this.bw=0; this.bh=0; this.rects=[];
        this.rebuild();
    }
    setType(t){
        this.bgType=t;
        this.initCarX=INITIAL_CAR_X;
        this.initCarY=INITIAL_CAR_Y;
    }
    rebuild(){
        this.initCarX=INITIAL_CAR_X;
        this.initCarY=INITIAL_CAR_Y;
        const minVS=0.60;
        this.extraX=Math.ceil(SCREEN_WM*(1/minVS-1)/TILE_SIZE)+2;
        this.extraY=Math.ceil(SCREEN_HM*(1/minVS-1)/TILE_SIZE)+2;
        this.bw=Math.ceil(SCREEN_WIDTH/TILE_SIZE)+1+2*this.extraX;
        this.bh=Math.ceil(SCREEN_HEIGHT/TILE_SIZE)+1+2*this.extraY;
        this.rects=[];
        for(let i=0;i<this.bh;i++){
            this.rects[i]=[];
            for(let j=0;j<this.bw;j++)
                this.rects[i][j]={x:(j-this.extraX)*TILE_SIZE,y:(i-this.extraY)*TILE_SIZE,w:TILE_SIZE,h:TILE_SIZE};
        }
    }
    update(px,py){
        const offX=Math.floor(((px-this.initCarX)%TILE_SIZE+TILE_SIZE)%TILE_SIZE);
        const offY=Math.floor(((py-this.initCarY)%TILE_SIZE+TILE_SIZE)%TILE_SIZE);
        for(let i=0;i<this.bh;i++)
            for(let j=0;j<this.bw;j++){
                this.rects[i][j].x=(j-this.extraX)*TILE_SIZE-offX;
                this.rects[i][j].y=(i-this.extraY)*TILE_SIZE-offY;
            }
    }
    render(ctx,sheet){
        const srcX=this.bgType===2?9*17:7*17,srcY=this.bgType===2?17:0;
        for(let i=0;i<this.bh;i++)
            for(let j=0;j<this.bw;j++){
                const r=this.rects[i][j];
                ctx.drawImage(sheet,srcX,srcY,17,17,r.x-2,r.y-2,r.w+4,r.h+4);
            }
    }
}

class MenuBackground {
    constructor(){
        this.gridW=0; this.gridH=0; this.grid=[];
        this.scrollX=0; this.scrollY=0;
        this.rebuild();
    }
    rebuild(){
        this.gridW=Math.ceil(SCREEN_WIDTH/TILE_SIZE)+1;
        this.gridH=Math.ceil(SCREEN_HEIGHT/TILE_SIZE)+1;
        this.grid=[];
        for(let i=0;i<this.gridH;i++){
            this.grid[i]=[];
            for(let j=0;j<this.gridW;j++)
                this.grid[i][j]={x:j*TILE_SIZE,y:i*TILE_SIZE,w:TILE_SIZE,h:TILE_SIZE};
        }
    }
    update(dt){
        this.scrollX-=1.5*dt; this.scrollY-=1.5*dt;
        const ox=((Math.trunc(this.scrollX)%TILE_SIZE)+TILE_SIZE)%TILE_SIZE;
        const oy=((Math.trunc(this.scrollY)%TILE_SIZE)+TILE_SIZE)%TILE_SIZE;
        for(let i=0;i<this.gridH;i++)
            for(let j=0;j<this.gridW;j++){
                this.grid[i][j].x=j*TILE_SIZE-ox;
                this.grid[i][j].y=i*TILE_SIZE-oy;
            }
    }
    render(ctx,sheet){
        for(let i=0;i<this.gridH;i++)
            for(let j=0;j<this.gridW;j++){
                const r=this.grid[i][j];
                ctx.drawImage(sheet,7*17,0,17,17,r.x-2,r.y-2,r.w+4,r.h+4);
            }
    }
}

