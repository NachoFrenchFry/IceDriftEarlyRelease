function _editorCapture(){
    return{grid:editorGrid.map(r=>r.slice()),spawnRow:editorSpawnRow,spawnCol:editorSpawnCol};
}
function _editorRestore(snap){
    editorGrid=snap.grid.map(r=>r.slice());
    editorSpawnRow=snap.spawnRow;editorSpawnCol=snap.spawnCol;
}
function editorSnapshot(){
    editorUndoStack.push(_editorCapture());
    if(editorUndoStack.length>50)editorUndoStack.shift();
    editorRedoStack=[];
}
function editorUndo(){
    if(!editorUndoStack.length)return;
    editorRedoStack.push(_editorCapture());
    _editorRestore(editorUndoStack.pop());
}
function editorRedo(){
    if(!editorRedoStack.length)return;
    editorUndoStack.push(_editorCapture());
    _editorRestore(editorRedoStack.pop());
}

// Loading screen
(()=>{
    // Background gradient
    const bg=ctx.createRadialGradient(canvas.width/2,canvas.height/2,0,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*0.8);
    bg.addColorStop(0,'#0a1628');bg.addColorStop(1,'#000408');
    ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);

    // Ice crystal lines radiating from corners and center
    ctx.save();ctx.strokeStyle='rgba(100,180,255,0.07)';ctx.lineWidth=1;
    const pts=[[0,0],[canvas.width,0],[0,canvas.height],[canvas.width,canvas.height],[canvas.width/2,canvas.height/2]];
    for(const [ox,oy] of pts){
        for(let a=0;a<Math.PI*2;a+=Math.PI/8){
            ctx.beginPath();ctx.moveTo(ox,oy);
            ctx.lineTo(ox+Math.cos(a)*canvas.width,oy+Math.sin(a)*canvas.height);
            ctx.stroke();
        }
    }
    ctx.restore();

    // Snowflake shapes scattered
    ctx.save();ctx.strokeStyle='rgba(140,210,255,0.12)';ctx.lineWidth=1.5;
    function snowflake(x,y,r){
        for(let a=0;a<Math.PI*2;a+=Math.PI/3){
            const cx=x+Math.cos(a)*r,cy=y+Math.sin(a)*r;
            ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx,cy);ctx.stroke();
            ctx.beginPath();ctx.moveTo(cx,cy);
            ctx.lineTo(cx+Math.cos(a+Math.PI/6)*r*0.4,cy+Math.sin(a+Math.PI/6)*r*0.4);ctx.stroke();
            ctx.beginPath();ctx.moveTo(cx,cy);
            ctx.lineTo(cx+Math.cos(a-Math.PI/6)*r*0.4,cy+Math.sin(a-Math.PI/6)*r*0.4);ctx.stroke();
        }
    }
    const flakes=[[0.15,0.2,60],[0.85,0.15,45],[0.08,0.75,50],[0.92,0.8,40],[0.5,0.12,35],[0.75,0.6,30]];
    for(const[fx,fy,fr] of flakes) snowflake(canvas.width*fx,canvas.height*fy,fr);
    ctx.restore();
    const cw=canvas.width,ch=canvas.height,cwm=cw/2,chm=ch/2;

    // Title
    ctx.save();
    ctx.font=`bold ${Math.floor(ch*0.13)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(60,130,220,0.18)';ctx.fillText('ICE DRIFT',cwm+4,chm-ch*0.15+4);
    const titleGrad=ctx.createLinearGradient(cwm-200,chm-110,cwm+200,chm-50);
    titleGrad.addColorStop(0,'#a8d8ff');titleGrad.addColorStop(0.5,'#ffffff');titleGrad.addColorStop(1,'#7ec8e3');
    ctx.fillStyle=titleGrad;ctx.fillText('ICE DRIFT',cwm,chm-ch*0.15);
    ctx.restore();

    // Loading bar track
    const barW=Math.min(400,cw*0.5),barH=6,barX=cwm-barW/2,barY=chm+20;
    ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#4488aa';
    ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,3);ctx.fill();
    const fillGrad=ctx.createLinearGradient(barX,0,barX+barW*0.6,0);
    fillGrad.addColorStop(0,'#5bc8ff');fillGrad.addColorStop(1,'#a8eeff');
    ctx.globalAlpha=1;ctx.fillStyle=fillGrad;
    ctx.beginPath();ctx.roundRect(barX,barY,barW*0.6,barH,3);ctx.fill();
    ctx.restore();

    // Loading text
    ctx.save();ctx.font='18px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(160,210,255,0.7)';ctx.fillText('Loading textures...',cwm,chm+50);
    ctx.restore();
})();

Promise.all([
    loadImg('textures/tiles.png'),
    loadImg('textures/car.png'),
    loadImg('textures/title.png'),
    loadImg('textures/text.png'),
    loadImg('textures/buttons.png'),
    loadImg('textures/cooldowns.png'),
    loadImg('textures/icons.png')
]).then(async([_sheet,_carImg,_titleImg,_textSheet,_btnSheet,_cdSheet,_iconsImg])=>{
    sheet=_sheet;carImg=_carImg;titleImg=_titleImg;textSheet=_textSheet;btnSheet=_btnSheet;cdSheet=_cdSheet;iconsImg=_iconsImg;
    subscribeToVersion();

    // Build greyscale version of button sheet for unaffordable talents
    const greyCanvas=document.createElement('canvas');
    greyCanvas.width=btnSheet.naturalWidth||btnSheet.width;
    greyCanvas.height=btnSheet.naturalHeight||btnSheet.height;
    const greyCtx2=greyCanvas.getContext('2d');
    greyCtx2.drawImage(btnSheet,0,0);
    const gd=greyCtx2.getImageData(0,0,greyCanvas.width,greyCanvas.height);
    for(let i=0;i<gd.data.length;i+=4){
        const v=Math.round(0.2126*gd.data[i]+0.7152*gd.data[i+1]+0.0722*gd.data[i+2]);
        gd.data[i]=gd.data[i+1]=gd.data[i+2]=v;
    }
    greyCtx2.putImageData(gd,0,0);
    greySheet=greyCanvas;

    // Build green-tinted version of button sheet for purchased talents (mirrors C++ ColorMod(120,255,120))
    const tintCanvas=document.createElement('canvas');
    tintCanvas.width=btnSheet.naturalWidth||btnSheet.width;
    tintCanvas.height=btnSheet.naturalHeight||btnSheet.height;
    const tintCtx2=tintCanvas.getContext('2d');
    tintCtx2.drawImage(btnSheet,0,0);
    const td=tintCtx2.getImageData(0,0,tintCanvas.width,tintCanvas.height);
    for(let i=0;i<td.data.length;i+=4){
        td.data[i]=Math.round(td.data[i]*120/255);
        td.data[i+2]=Math.round(td.data[i+2]*120/255);
    }
    tintCtx2.putImageData(td,0,0);
    tintSheet=tintCanvas;

    // Build red-tinted version of button sheet for CREATE button
    const redTintCanvas=document.createElement('canvas');
    redTintCanvas.width=btnSheet.naturalWidth||btnSheet.width;
    redTintCanvas.height=btnSheet.naturalHeight||btnSheet.height;
    const redTintCtx=redTintCanvas.getContext('2d');
    redTintCtx.drawImage(btnSheet,0,0);
    const rd=redTintCtx.getImageData(0,0,redTintCanvas.width,redTintCanvas.height);
    for(let i=0;i<rd.data.length;i+=4){
        rd.data[i+1]=Math.round(rd.data[i+1]*120/255);
        rd.data[i+2]=Math.round(rd.data[i+2]*120/255);
    }
    redTintCtx.putImageData(rd,0,0);
    redTintSheet=redTintCanvas;

    // Build white-to-black version of button sheet for convert button
    const bwBtnCanvas=document.createElement('canvas');
    bwBtnCanvas.width=btnSheet.naturalWidth||btnSheet.width;
    bwBtnCanvas.height=btnSheet.naturalHeight||btnSheet.height;
    const bwBtnCtx=bwBtnCanvas.getContext('2d');
    bwBtnCtx.drawImage(btnSheet,0,0);
    const bwd=bwBtnCtx.getImageData(0,0,bwBtnCanvas.width,bwBtnCanvas.height);
    for(let i=0;i<bwd.data.length;i+=4){
        if(bwd.data[i]>200&&bwd.data[i+1]>200&&bwd.data[i+2]>200){
            bwd.data[i]=0;bwd.data[i+1]=0;bwd.data[i+2]=0;
        }
    }
    bwBtnCtx.putImageData(bwd,0,0);
    bwBtnSheet=bwBtnCanvas;

    // Build white-to-red version of button sheet for delete account button
    const redBtnCanvas=document.createElement('canvas');
    redBtnCanvas.width=btnSheet.naturalWidth||btnSheet.width;
    redBtnCanvas.height=btnSheet.naturalHeight||btnSheet.height;
    const redBtnCtx=redBtnCanvas.getContext('2d');
    redBtnCtx.drawImage(btnSheet,0,0);
    const rbd=redBtnCtx.getImageData(0,0,redBtnCanvas.width,redBtnCanvas.height);
    for(let i=0;i<rbd.data.length;i+=4){
        if(rbd.data[i]>200&&rbd.data[i+1]>200&&rbd.data[i+2]>200){
            rbd.data[i]=210;rbd.data[i+1]=30;rbd.data[i+2]=30;
        }
    }
    redBtnCtx.putImageData(rbd,0,0);
    redBtnSheet=redBtnCanvas;

    // Build yellow-tinted version of cdSheet (red pixels → yellow) for immunity state display
    const cdImmuneCanvas=document.createElement('canvas');
    cdImmuneCanvas.width=cdSheet.naturalWidth||cdSheet.width;
    cdImmuneCanvas.height=cdSheet.naturalHeight||cdSheet.height;
    const cdImmuneCtx=cdImmuneCanvas.getContext('2d');
    cdImmuneCtx.drawImage(cdSheet,0,0);
    const id2=cdImmuneCtx.getImageData(0,0,cdImmuneCanvas.width,cdImmuneCanvas.height);
    for(let p=0;p<id2.data.length;p+=4){
        const r=id2.data[p],g=id2.data[p+1],b=id2.data[p+2];
        if(r>150&&g<100&&b<100) id2.data[p+1]=r;
    }
    cdImmuneCtx.putImageData(id2,0,0);
    cdImmuneSheet=cdImmuneCanvas;

    // Build tile grid (positions fixed at init, types set by loadLevel)
    tiles=[];
    for(let i=0;i<TILE_GRID_HEIGHT;i++){
        tiles[i]=[];
        for(let j=0;j<TILE_GRID_WIDTH;j++){
            const t=new Tile();
            t.init(j*TILE_SIZE,i*TILE_SIZE);
            tiles[i][j]=t;
        }
    }

    function doSetTile(i,j){
        const make=(r,c)=>{
            if(r<0||r>=TILE_GRID_HEIGHT||c<0||c>=TILE_GRID_WIDTH) return {active:false,type:"N/A"};
            return {active:tiles[r][c].active, type:tiles[r][c].type};
        };
        tiles[i][j].setTile(
            make(i-1,j),make(i+1,j),make(i,j-1),make(i,j+1),
            make(i-1,j-1),make(i-1,j+1),make(i+1,j-1),make(i+1,j+1)
        );
    }

    function loadLevel(){
        checkpointX=null;checkpointY=null;
        const map=LEVEL_MAPS[currentLevel];
        for(let i=0;i<TILE_GRID_HEIGHT;i++){
            for(let j=0;j<TILE_GRID_WIDTH;j++){
                const v=map[i][j];
                if(v===1){tiles[i][j].active=true;tiles[i][j].type="WALL";}
                else if(v===2){tiles[i][j].active=true;tiles[i][j].type="ICE";}
                else if(v===3){tiles[i][j].active=true;tiles[i][j].type="START";}
                else if(v===4){tiles[i][j].active=true;tiles[i][j].type="END";}
                else if(v===5){tiles[i][j].active=true;tiles[i][j].type="START_WALL";}
                else if(v===6){tiles[i][j].active=true;tiles[i][j].type="KILL_BLOCK";}
                else if(v===7){tiles[i][j].active=true;tiles[i][j].type="VOID";}
                else if(v===8) {tiles[i][j].active=true;tiles[i][j].type="SPEED_UP";}
                else if(v===9) {tiles[i][j].active=true;tiles[i][j].type="SPEED_LEFT";}
                else if(v===10){tiles[i][j].active=true;tiles[i][j].type="SPEED_DOWN";}
                else if(v===11){tiles[i][j].active=true;tiles[i][j].type="SPEED_RIGHT";}
                else if(v===12){tiles[i][j].active=true;tiles[i][j].type="GRASS";}
                else if(v===13){tiles[i][j].active=true;tiles[i][j].type="CHECKPOINT";}
                else{tiles[i][j].active=false;tiles[i][j].type="";}
            }
        }
        for(let i=0;i<TILE_GRID_HEIGHT;i++)
            for(let j=0;j<TILE_GRID_WIDTH;j++)
                doSetTile(i,j);
        levelHasKillBlocks=LEVEL_MAPS[currentLevel].some(row=>row.includes(6));
    }

    function loadLobbyLevel(){
        for(let i=0;i<TILE_GRID_HEIGHT;i++){
            for(let j=0;j<TILE_GRID_WIDTH;j++){
                const v=LEVEL_LOBBY[i][j];
                if(v===1){tiles[i][j].active=true;tiles[i][j].type="WALL";}
                else if(v===2){tiles[i][j].active=true;tiles[i][j].type="ICE";}
                else if(v===3){tiles[i][j].active=true;tiles[i][j].type="START";}
                else if(v===4){tiles[i][j].active=true;tiles[i][j].type="END";}
                else if(v===6){tiles[i][j].active=true;tiles[i][j].type="KILL_BLOCK";}
                else if(v===7){tiles[i][j].active=true;tiles[i][j].type="VOID";}
                else if(v===8){tiles[i][j].active=true;tiles[i][j].type="SPEED_UP";}
                else if(v===9){tiles[i][j].active=true;tiles[i][j].type="SPEED_LEFT";}
                else if(v===10){tiles[i][j].active=true;tiles[i][j].type="SPEED_DOWN";}
                else if(v===11){tiles[i][j].active=true;tiles[i][j].type="SPEED_RIGHT";}
                else if(v===12){tiles[i][j].active=true;tiles[i][j].type="GRASS";}
                else if(v===13){tiles[i][j].active=true;tiles[i][j].type="CHECKPOINT";}
                else{tiles[i][j].active=false;tiles[i][j].type="";}
            }
        }
        for(let i=0;i<TILE_GRID_HEIGHT;i++)
            for(let j=0;j<TILE_GRID_WIDTH;j++)
                doSetTile(i,j);
        levelHasKillBlocks=LEVEL_LOBBY.some(row=>row.includes(6));
    }
    function applyStartWallActivate(){
        for(let i=0;i<TILE_GRID_HEIGHT;i++)
            for(let j=0;j<TILE_GRID_WIDTH;j++){
                if(tiles[i][j].type==="START") tiles[i][j].type="START_WALL";
                doSetTile(i,j);
            }
    }
    function applyStartWallDeactivate(){
        for(let i=0;i<TILE_GRID_HEIGHT;i++)
            for(let j=0;j<TILE_GRID_WIDTH;j++){
                if(tiles[i][j].type==="START_WALL") tiles[i][j].type="START";
                doSetTile(i,j);
            }
    }

    player=new Car();

    function initEditor(){
        editorGrid=[];
        for(let i=0;i<TILE_GRID_HEIGHT;i++){editorGrid[i]=[];for(let j=0;j<TILE_GRID_WIDTH;j++)editorGrid[i][j]=0;}
        editorSpawnRow=null;editorSpawnCol=null;editorBackground=1;editorSelectedTile=2;editorPalScroll=0;
        const _edAreaW=SCREEN_WIDTH-EDITOR_SIDEBAR_W;
        editorZoom=Math.max(4,Math.min(200,Math.min(Math.floor(_edAreaW/TILE_GRID_WIDTH),Math.floor(SCREEN_HEIGHT/TILE_GRID_HEIGHT))));
        editorCamX=Math.floor(_edAreaW/2-TILE_GRID_WIDTH*editorZoom/2);
        editorCamY=Math.floor(SCREEN_HEIGHT/2-TILE_GRID_HEIGHT*editorZoom/2);
        editorPanning=false;editorPaintValue=0;editorLevelPublished=false;
        editorUndoStack=[];editorRedoStack=[];
    }
    function loadLevelIntoEditor(lv){
        initEditor();
        editorLevelId=lv.id;
        editorLevelName=lv.name||'';
        editorBackground=lv.background||1;
        editorLevelPublished=lv.published||false;
        editorSpawnRow=lv.spawn_row!=null?lv.spawn_row:null;
        editorSpawnCol=lv.spawn_col!=null?lv.spawn_col:null;
        if(lv.grid&&lv.grid.length){
            for(const [_r,_c,_v] of lv.grid){
                if(_r>=0&&_r<TILE_GRID_HEIGHT&&_c>=0&&_c<TILE_GRID_WIDTH)editorGrid[_r][_c]=_v;
            }
        }
    }
    function loadEditorLevel(){
        checkpointX=null;checkpointY=null;
        for(let i=0;i<TILE_GRID_HEIGHT;i++){
            for(let j=0;j<TILE_GRID_WIDTH;j++){
                const v=editorGrid[i][j];
                if(v===1){tiles[i][j].active=true;tiles[i][j].type="WALL";}
                else if(v===2){tiles[i][j].active=true;tiles[i][j].type="ICE";}
                else if(v===3){tiles[i][j].active=true;tiles[i][j].type="START";}
                else if(v===4){tiles[i][j].active=true;tiles[i][j].type="END";}
                else if(v===5){tiles[i][j].active=true;tiles[i][j].type="START_WALL";}
                else if(v===6){tiles[i][j].active=true;tiles[i][j].type="KILL_BLOCK";}
                else if(v===7){tiles[i][j].active=true;tiles[i][j].type="VOID";}
                else if(v===8){tiles[i][j].active=true;tiles[i][j].type="SPEED_UP";}
                else if(v===9){tiles[i][j].active=true;tiles[i][j].type="SPEED_LEFT";}
                else if(v===10){tiles[i][j].active=true;tiles[i][j].type="SPEED_DOWN";}
                else if(v===11){tiles[i][j].active=true;tiles[i][j].type="SPEED_RIGHT";}
                else if(v===12){tiles[i][j].active=true;tiles[i][j].type="GRASS";}
                else if(v===13){tiles[i][j].active=true;tiles[i][j].type="CHECKPOINT";}
                else{tiles[i][j].active=false;tiles[i][j].type="";}
            }
        }
        for(let i=0;i<TILE_GRID_HEIGHT;i++)for(let j=0;j<TILE_GRID_WIDTH;j++)doSetTile(i,j);
        levelHasKillBlocks=editorGrid.some(row=>row.includes(6));
    }
    function tryEditorLevel(){
        if(editorSpawnRow===null)return;
        INITIAL_CAR_X=editorSpawnCol*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_WM;
        INITIAL_CAR_Y=editorSpawnRow*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_HM;
        bg.setType(editorBackground);
        loadEditorLevel();
        player.reset();
        for(let i=0;i<TILE_GRID_HEIGHT;i++)for(let j=0;j<TILE_GRID_WIDTH;j++)tiles[i][j].update(player.xPos,player.yPos);
        startWallDeactivated=false;finish=false;boostOverriding=false;particles=[];iceParticleAccum=0;
        prevIceVelX=0;prevIceVelY=0;countdownGoEnd=0;ghostTrail=[];gameStartTime=performance.now();
        levelLoaded=true;editorFromEditorPlay=true;page='GAME';
    }
    function playCommunityLevel(){
        const lv=selectedCustomLevel;
        INITIAL_CAR_X=lv.spawn_col*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_WM;
        INITIAL_CAR_Y=lv.spawn_row*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_HM;
        bg.setType(lv.background);
        loadEditorLevel();
        player.reset();
        for(let i=0;i<TILE_GRID_HEIGHT;i++)for(let j=0;j<TILE_GRID_WIDTH;j++)tiles[i][j].update(player.xPos,player.yPos);
        startWallDeactivated=false;finish=false;boostOverriding=false;particles=[];iceParticleAccum=0;
        prevIceVelX=0;prevIceVelY=0;countdownGoEnd=0;ghostTrail=[];gameStartTime=performance.now();
        levelLoaded=true;playingCommunityLevel=true;page='GAME';
    }

    bg=new Background();
    menuBg=new MenuBackground();

    // Layout helpers (computed dynamically so they respond to resize)
    function getStartBtn(){
        return {bx:Math.floor(SCREEN_WM-START_BUTTON_WIDTH/2),by:Math.floor(SCREEN_HM-START_BUTTON_HEIGHT/2),bw:START_BUTTON_WIDTH,bh:START_BUTTON_HEIGHT};
    }
    function getLevelBtn(i){
        const size=LEVEL_BUTTON_SIZE,gap=LEVEL_BUTTON_GAP,step=size+gap,n=5;
        const lx=Math.floor(SCREEN_WM-(n*step-gap)/2+size/2+i*step);
        return {bx:lx-size/2,by:Math.floor(SCREEN_HM-size/2),bw:size,bh:size};
    }
    function getTalentBtn(){
        return {bx:30,by:SCREEN_HEIGHT-130,bw:LEVEL_BUTTON_SIZE,bh:LEVEL_BUTTON_SIZE};
    }
    function getShopBtn(){
        return {bx:30,by:SCREEN_HEIGHT-250,bw:LEVEL_BUTTON_SIZE,bh:LEVEL_BUTTON_SIZE};
    }
    function getBackBtn(){
        return {bx:30,by:SCREEN_HEIGHT-130,bw:LEVEL_BUTTON_SIZE,bh:LEVEL_BUTTON_SIZE};
    }

    window.addEventListener('resize',()=>{
        const _prevSHM=SCREEN_HM;
        resizeCanvas();
        bg.rebuild();
        menuBg.rebuild();
        [mouseX,mouseY]=toDesign(_lastClientX,_lastClientY);
        // SCREEN_WM is always BASE_W/2 so never changes; SCREEN_HM can change.
        // Compensate car.yPos so the player doesn't jump through walls on resize.
        const _dhm=SCREEN_HM-_prevSHM;
        if(_dhm!==0&&(page==='GAME'||page==='RACE_GAME')){
            player.yPos-=_dhm;
            INITIAL_CAR_Y-=_dhm;
            if(checkpointY!==null)checkpointY-=_dhm;
        }
    });

    let lastTime=0;
    function loop(now){
        const dt=lastTime?Math.min((now-lastTime)/(1000/60),3):1;
        lastTime=now;
        let _wantText=false;
        // Fill letterbox areas then apply scale transform
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.setTransform(gameScale,0,0,gameScale,gameOffX,gameOffY);
        ctx.imageSmoothingEnabled=false;
        const mjp=mouseJustPressed; mouseJustPressed=false;
        const mjr=mouseJustReleased; mouseJustReleased=false;
        const _startPage=page;
        const sjp=shiftJustPressed;  shiftJustPressed=false;
        const rmp=rightMouseJustPressed; rightMouseJustPressed=false;

        if(page==='MENU'){
            menuBg.update(dt);

            // LOGIN / CREATE buttons — stacked vertically, 280×77 each
            const loginBtnW=280,loginBtnH=80,loginBtnX=Math.floor(SCREEN_WM-loginBtnW/2),loginBtnY=Math.floor(SCREEN_HM-loginBtnH-15);
            const createBtnW=280,createBtnH=80,createBtnX=Math.floor(SCREEN_WM-createBtnW/2),createBtnY=Math.floor(SCREEN_HM+15);

            if(mjp){
                if(inRect(mouseX,mouseY,loginBtnX,loginBtnY,loginBtnW,loginBtnH)){
                    inputValues.username='';inputValues.password='';authError='';page='LOGIN';setActiveInput('username');
                }
                if(inRect(mouseX,mouseY,createBtnX,createBtnY,createBtnW,createBtnH)){
                    inputValues.username='';inputValues.password='';authError='';page='CREATE';setActiveInput('username');
                }
            }

            ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            menuBg.render(ctx,sheet);

            // Login button
            renderTextButton(ctx,btnSheet,textSheet,0,loginBtnX,loginBtnY,loginBtnW,'LOGIN',0,0,0);
            // Create button
            renderTextButton(ctx,btnSheet,textSheet,16,createBtnX,createBtnY,createBtnW,'CREATE',0,0,0);

            // Title
            const tx=Math.floor(SCREEN_WM-TITLE_WIDTH/2),ty=100;
            ctx.save();ctx.globalAlpha=80/255;ctx.filter='brightness(0)';
            ctx.drawImage(titleImg,tx-5,ty+5,TITLE_WIDTH,TITLE_HEIGHT);
            ctx.restore();
            ctx.drawImage(titleImg,tx,ty,TITLE_WIDTH,TITLE_HEIGHT);

        } else if(page==='LOGIN'||page==='CREATE'){
            const isCreate=page==='CREATE';
            menuBg.update(dt);

            const formW=500,formX=Math.floor(SCREEN_WM-formW/2);
            const fieldW=formW,fieldH=54;
            const unY=Math.floor(SCREEN_HM-100),pwY=unY+100;
            authFieldRects={un:{x:formX,y:unY,w:fieldW,h:fieldH},pw:{x:formX,y:pwY,w:fieldW,h:fieldH}};
            if(inRect(mouseX,mouseY,formX,unY,fieldW,fieldH)||inRect(mouseX,mouseY,formX,pwY,fieldW,fieldH)) _wantText=true;
            const submitW=240,submitH=80,submitX=Math.floor(SCREEN_WM-submitW/2),submitY=pwY+80;
            const backW=160,backH=50,backX=Math.floor(SCREEN_WM-backW/2),backY=submitY+90;

            // Show/hide toggle hit area (mirrors renderInputField positioning)
            const togLbl=showPassword?'HIDE':'SHOW';
            const togW=togLbl.length*(4*3+3),togH=7*3;
            const togX=formX+fieldW-togW-12,togY=pwY+fieldH/2-togH/2;
            const togPad=8;

            // Field click focus
            {const bb=getBackBtn();
            if(mjp){
                const clickedToggle=inRect(mouseX,mouseY,togX-togPad,togY-togPad,togW+togPad*2,togH+togPad*2);
                if(clickedToggle){ showPassword=!showPassword; }
                else if(inRect(mouseX,mouseY,formX,unY,fieldW,fieldH)){
                    const wasActive=activeInput==='username';
                    setActiveInput('username');
                    const disp=inputValues.username;
                    caretPos=getCaretPosFromX(disp,mouseX-(formX+12),1);
                    if(wasActive) syncHidden('username');
                } else if(inRect(mouseX,mouseY,formX,pwY,fieldW,fieldH)){
                    const wasActive=activeInput==='password';
                    setActiveInput('password');
                    const mask=showPassword?inputValues.password:'*'.repeat(inputValues.password.length);
                    caretPos=getCaretPosFromX(mask,mouseX-(formX+12),1);
                    if(wasActive) syncHidden('password');
                } else if(!inRect(mouseX,mouseY,submitX,submitY,submitW,submitH)&&!inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)) setActiveInput(null);
                if(inRect(mouseX,mouseY,submitX,submitY,submitW,submitH)) authSubmitPending=true;
                if(inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){setActiveInput(null);showPassword=false;page='MENU';}
            }}

            // Submit
            const asp=authSubmitPending; authSubmitPending=false;
            if(asp&&!authLoading&&inputValues.username&&inputValues.password){
                setActiveInput(null);
                if(isCreate) dbSignUp(inputValues.username,inputValues.password);
                else         dbSignIn(inputValues.username,inputValues.password);
            }

            ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            menuBg.render(ctx,sheet);

            // Title
            const ttl=isCreate?'CREATE ACCOUNT':'LOGIN',ttlW=ttl.length*(4*3*2+3);
            renderText(ctx,textSheet,ttl,Math.floor(SCREEN_WM-ttlW/2),Math.floor(SCREEN_HM-200),2,0,0,0);

            // Input fields
            renderInputField('USERNAME','username',formX,unY,fieldW,fieldH,false);
            renderInputField('PASSWORD','password',formX,pwY,fieldW,fieldH,true);

            const sLbl=authLoading?'...':(isCreate?'CREATE':'LOGIN');
            renderTextButton(ctx,btnSheet,textSheet,isCreate?16:0,submitX,submitY,submitW,sLbl,0,0,0);

            // Back button
            {const bb=getBackBtn();renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}

            // Error message
            if(authError){
                const errW=authError.length*(4*3+3);
                renderText(ctx,textSheet,authError,Math.floor(SCREEN_WM-errW/2),backY+70,1,255,80,80);
            }

        } else if(page==='LEVELS'){
            menuBg.update(dt);
            // 2 horizontal hub buttons (where the 4 level buttons were)
            const hubBtnW=300,hubBtnH=80,hubGap=40;
            const hubTotalW=hubBtnW*2+hubGap;
            const hubLobbyX=Math.floor(SCREEN_WM-hubTotalW/2);
            const hubLevelX=hubLobbyX+hubBtnW+hubGap;
            const hubBtnY=Math.floor(SCREEN_HM-hubBtnH/2);
            const hubRaceY=hubBtnY+hubBtnH+16;
            const hubCreateY=hubRaceY+hubBtnH+16;
            if(mjp&&inRect(mouseX,mouseY,hubLobbyX,hubBtnY,hubBtnW,hubBtnH)){
                if(!currentUser){inputValues.username='';inputValues.password='';authError='';page='LOGIN';}
                else page='LOBBY';
            }
            if(mjp&&inRect(mouseX,mouseY,hubLevelX,hubBtnY,hubBtnW,hubBtnH)) page='LEVEL_SELECT';
            if(mjp&&inRect(mouseX,mouseY,hubLobbyX,hubRaceY,hubTotalW,hubBtnH)) page='RACE';
            if(mjp&&inRect(mouseX,mouseY,hubLobbyX,hubCreateY,hubTotalW,hubBtnH)){customLevelsTab='community';myLevelsLoaded=false;myLevelsScroll=0;page='CUSTOM_LEVELS';}
            const tb=getTalentBtn();
            if(mjp&&inRect(mouseX,mouseY,tb.bx,tb.by,tb.bw,tb.bh)) page='TALENTS';
            const shb=getShopBtn();
            if(mjp&&inRect(mouseX,mouseY,shb.bx,shb.by,shb.bw,shb.bh)) page='CONVERT';
            const setW=LEVEL_BUTTON_SIZE,setH=LEVEL_BUTTON_SIZE,setX=30,setY=30;
            if(mjp&&inRect(mouseX,mouseY,setX,setY,setW,setH)) page='SETTINGS';
            const ctrlBtnX=setX+setW+20,ctrlBtnY=setY;
            if(mjp&&inRect(mouseX,mouseY,ctrlBtnX,ctrlBtnY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)) page='CONTROLS';
            const shopIconX=ctrlBtnX+LEVEL_BUTTON_SIZE+20,shopIconY=setY;
            if(mjp&&inRect(mouseX,mouseY,shopIconX,shopIconY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)) page='SHOP';
            const lbBtnX=shopIconX+LEVEL_BUTTON_SIZE+20,lbBtnY=setY;
            if(mjp&&inRect(mouseX,mouseY,lbBtnX,lbBtnY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)){lbLevel=0;lbScroll=0;lbRows=[];dbLoadLeaderboard(0);page='LEADERBOARD';}
            const upBtnX=lbBtnX+LEVEL_BUTTON_SIZE+20,upBtnY=setY;
            if(mjp&&inRect(mouseX,mouseY,upBtnX,upBtnY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)){
                upScroll=0;page='UPDATES';
                if(hasNewUpdate&&currentUser){hasNewUpdate=false;lastUpdateSeen=UPDATE_LOG[0].date;dbSaveProfile();}
            }
            const dcBtnX=upBtnX+LEVEL_BUTTON_SIZE+20,dcBtnY=setY;
            if(mjp&&inRect(mouseX,mouseY,dcBtnX,dcBtnY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)) window.open('https://discord.gg/rjwWPjjMFJ','_blank');
            ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            menuBg.render(ctx,sheet);
            {const _htx=Math.floor(SCREEN_WM-TITLE_WIDTH/2),_hty=hubBtnY-TITLE_HEIGHT-30;
            ctx.save();ctx.globalAlpha=80/255;ctx.filter='brightness(0)';
            ctx.drawImage(titleImg,_htx-5,_hty+5,TITLE_WIDTH,TITLE_HEIGHT);
            ctx.restore();
            ctx.drawImage(titleImg,_htx,_hty,TITLE_WIDTH,TITLE_HEIGHT);}
            renderTextButton(ctx,btnSheet,textSheet,0,hubLobbyX,hubBtnY,hubBtnW,'LOBBY',0,0,0);
            renderTextButton(ctx,btnSheet,textSheet,0,hubLevelX,hubBtnY,hubBtnW,'LEVELS',0,0,0);
            renderTextButton(ctx,btnSheet,textSheet,0,hubLobbyX,hubRaceY,hubTotalW,'MULTIPLAYER RACING',0,0,0);
            renderTextButton(ctx,redBtnSheet,textSheet,16,hubLobbyX,hubCreateY,hubTotalW,'CUSTOM LEVELS',0,0,0);
            // Talents button
            renderButton(ctx,btnSheet,textSheet,3,tb.bx,tb.by,tb.bw,tb.bh,'');
            if(inRect(mouseX,mouseY,tb.bx,tb.by,tb.bw,tb.bh)){
                const label='TALENTS',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=tb.bx+tb.bw+10,ttY=tb.by+tb.bh/2-ttH/2;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }
            // Settings button (top-left)
            {const setW=LEVEL_BUTTON_SIZE,setH=LEVEL_BUTTON_SIZE,setX=30,setY=30;
            renderButton(ctx,btnSheet,textSheet,6,setX,setY,setW,setH,'');
            if(inRect(mouseX,mouseY,setX,setY,setW,setH)){
                const label='SETTINGS',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=setX+setW/2-ttW/2,ttY=setY+setH+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }}
            // Controls button
            {const ctrlX=30+LEVEL_BUTTON_SIZE+20,ctrlY=30;
            renderButton(ctx,btnSheet,textSheet,10,ctrlX,ctrlY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE,'');
            if(inRect(mouseX,mouseY,ctrlX,ctrlY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)){
                const label='CONTROLS',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=ctrlX+LEVEL_BUTTON_SIZE/2-ttW/2,ttY=ctrlY+LEVEL_BUTTON_SIZE+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }}
            // Shop button
            {const shBX=30+LEVEL_BUTTON_SIZE*2+40,shBY=30;
            renderButton(ctx,btnSheet,textSheet,11,shBX,shBY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE,'');
            if(inRect(mouseX,mouseY,shBX,shBY,LEVEL_BUTTON_SIZE,LEVEL_BUTTON_SIZE)){
                const label='SHOP',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=shBX+LEVEL_BUTTON_SIZE/2-ttW/2,ttY=shBY+LEVEL_BUTTON_SIZE+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }}
            // Leaderboard button
            {const lbW=LEVEL_BUTTON_SIZE,lbH=LEVEL_BUTTON_SIZE,lbBX=30+LEVEL_BUTTON_SIZE*3+60,lbBY=30;
            renderButton(ctx,btnSheet,textSheet,7,lbBX,lbBY,lbW,lbH,'');
            if(inRect(mouseX,mouseY,lbBX,lbBY,lbW,lbH)){
                const label='LEADERBOARD',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=lbBX+lbW/2-ttW/2,ttY=lbBY+lbH+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }}
            // Updates button
            {const upW=LEVEL_BUTTON_SIZE,upH=LEVEL_BUTTON_SIZE,upBX=30+LEVEL_BUTTON_SIZE*4+80,upBY=30;
            const upCX=upBX+upW/2,upCY=upBY+upH/2;
            const upWobble=hasNewUpdate?Math.sin(performance.now()/180)*0.22:0;
            ctx.save();ctx.translate(upCX,upCY);ctx.rotate(upWobble);ctx.translate(-upCX,-upCY);
            renderButton(ctx,btnSheet,textSheet,8,upBX,upBY,upW,upH,'');
            ctx.restore();
            if(inRect(mouseX,mouseY,upBX,upBY,upW,upH)){
                const label=hasNewUpdate?'NEW UPDATE!':'UPDATES',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=upBX+upW/2-ttW/2,ttY=upBY+upH+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle=hasNewUpdate?'rgb(40,80,20)':'rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,hasNewUpdate?120:255,hasNewUpdate?230:255,hasNewUpdate?60:255);
            }}
            // Discord button
            {const dcW=LEVEL_BUTTON_SIZE,dcH=LEVEL_BUTTON_SIZE,dcBX=30+LEVEL_BUTTON_SIZE*5+100,dcBY=30;
            renderButton(ctx,btnSheet,textSheet,9,dcBX,dcBY,dcW,dcH,'');
            if(inRect(mouseX,mouseY,dcBX,dcBY,dcW,dcH)){
                const label='Join Our Discord Server!',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=dcBX+dcW/2-ttW/2,ttY=dcBY+dcH+8;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }}
            // Convert button
            renderButton(ctx,btnSheet,textSheet,5,shb.bx,shb.by,shb.bw,shb.bh,'');
            if(inRect(mouseX,mouseY,shb.bx,shb.by,shb.bw,shb.bh)){
                const label='CONVERT',padX=10,padY=8;
                const ttW=label.length*(4*3+3)+padX*2,ttH=7*3+padY*2;
                const ttX=shb.bx+shb.bw+10,ttY=shb.by+shb.bh/2-ttH/2;
                ctx.save();ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(ttX,ttY,ttW,ttH,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,label,ttX+padX,ttY+padY,1,255,255,255);
            }
            renderDriftCoins(ctx,textSheet,iconsImg);
            // Incoming race challenge overlay (visible from any page)
            if(raceIncoming&&currentUser){
                ctx.save();ctx.globalAlpha=0.88;ctx.fillStyle='rgb(20,20,40)';
                ctx.beginPath();ctx.roundRect(SCREEN_WM-230,SCREEN_HM-110,460,210,14);ctx.fill();ctx.restore();
                ctx.save();ctx.strokeStyle='rgb(130,160,255)';ctx.lineWidth=2;
                ctx.beginPath();ctx.roundRect(SCREEN_WM-230,SCREEN_HM-110,460,210,14);ctx.stroke();ctx.restore();
                {const chl='RACE CHALLENGE FROM',chlW=chl.length*(4*3+3);
                renderText(ctx,textSheet,chl,Math.floor(SCREEN_WM-chlW/2),SCREEN_HM-98,1,200,200,220);}
                {const fn=raceIncoming.fromUsername||'?',fnW=fn.length*(4*3*2+3);
                renderText(ctx,textSheet,fn,Math.floor(SCREEN_WM-fnW/2),SCREEN_HM-68,2,255,220,80);}
                const accW=160,decW=160,accX=SCREEN_WM-accW-10,decX=SCREEN_WM+10,notifBtnY=SCREEN_HM+18;
                renderTextButton(ctx,btnSheet,textSheet,0,accX,notifBtnY,accW,'ACCEPT',0,180,80);
                renderTextButton(ctx,btnSheet,textSheet,0,decX,notifBtnY,decW,'DECLINE',180,0,0);
                if(mjp){
                    if(inRect(mouseX,mouseY,accX,notifBtnY,accW,80)){page='RACE';acceptRaceChallenge();}
                    if(inRect(mouseX,mouseY,decX,notifBtnY,decW,80))declineRaceChallenge();
                }
            }

        } else if(page==='LEVEL_SELECT'){
            menuBg.update(dt);
            for(let i=0;i<5;i++){
                const lb=getLevelBtn(i);
                if(mjp&&inRect(mouseX,mouseY,lb.bx,lb.by,lb.bw,lb.bh)){
                    currentLevel=i;
                    INITIAL_CAR_X=(1600-SCREEN_WM)-Math.floor(CAR_WIDTH/2)+LEVEL_START_X[i];
                    INITIAL_CAR_Y=(900-SCREEN_HM)-Math.floor(CAR_HEIGHT/2)+LEVEL_START_Y[i];
                    levelLoaded=false;
                    page='GAME';
                }
            }
            const lsBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,lsBb.bx,lsBb.by,lsBb.bw,lsBb.bh)) page='LEVELS';
            ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            menuBg.render(ctx,sheet);
            for(let i=0;i<5;i++){
                const lb=getLevelBtn(i);
                renderButton(ctx,btnSheet,textSheet,2,lb.bx,lb.by,lb.bw,lb.bh,String(i+1));
            }
            renderButton(ctx,btnSheet,textSheet,4,lsBb.bx,lsBb.by,lsBb.bw,lsBb.bh,'');
            renderDriftCoins(ctx,textSheet,iconsImg);

        } else if(page==='TALENTS'){
            updateTalents(mjp,mjr);
            renderTalents(ctx,btnSheet,greySheet,tintSheet,textSheet,iconsImg);

        } else if(page==='SHOP'){
            menuBg.update(dt);
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const shopTitle='SHOP',shopTW=shopTitle.length*(4*3*2+3);
            renderText(ctx,textSheet,shopTitle,Math.floor(SCREEN_WM-shopTW/2),40,2,0,0,0);

            {const cardW=360,cardH=360,cardGapX=60,cardGapY=40;
            const gridW=cardW*2+cardGapX,gridX=Math.floor(SCREEN_WM-gridW/2);
            const visibleSkinCount=SKINS.filter(sk=>!sk.exclusive||sk.exclusive.includes((currentUsername||'').toLowerCase())).length;
            const totalGridH=Math.ceil(visibleSkinCount/2)*(cardH+cardGapY);
            shopScroll=Math.max(0,Math.min(shopScroll,Math.max(0,totalGridH-(SCREEN_HEIGHT-200))));
            const gridY=130-shopScroll;
            ctx.save();ctx.rect(0,100,SCREEN_WIDTH,SCREEN_HEIGHT-100);ctx.clip();
            let _vi=0;
            for(let i=0;i<SKINS.length;i++){
                const sk=SKINS[i];
                if(sk.exclusive&&!sk.exclusive.includes((currentUsername||'').toLowerCase())) continue;
                const col=_vi%2,row=Math.floor(_vi/2);_vi++;
                const cx=gridX+col*(cardW+cardGapX),cy=gridY+row*(cardH+cardGapY);
                const owned=ownedSkins.includes(i)||(sk.exclusive&&sk.exclusive.includes((currentUsername||'').toLowerCase())),equipped=selectedSkin===i;
                // Card bg
                ctx.save();ctx.globalAlpha=equipped?1:0.9;
                ctx.fillStyle=equipped?'rgb(55,110,55)':owned?'rgb(55,55,85)':'rgb(35,35,55)';
                ctx.beginPath();ctx.roundRect(cx,cy,cardW,cardH,14);ctx.fill();
                if(equipped){ctx.strokeStyle='rgb(120,230,120)';ctx.lineWidth=3;ctx.stroke();}
                ctx.restore();
                // Skin name (size 2)
                const nw=sk.name.length*(4*3*2+3);
                renderText(ctx,textSheet,sk.name,Math.floor(cx+cardW/2-nw/2),cy+20,2,255,255,255);
                // Car preview (5x scale, centred)
                const previewScale=5,previewW=sk.sw*previewScale,previewH=SKIN_H*previewScale;
                ctx.save();ctx.imageSmoothingEnabled=false;
                ctx.drawImage(carImg,sk.sx,0,sk.sw,SKIN_H,Math.floor(cx+cardW/2-previewW/2),cy+65,previewW,previewH);
                ctx.restore();
                // Price / status
                const badge=equipped?'EQUIPPED':owned?'OWNED':sk.price===0?'FREE':sk.price+' DC';
                const bw2=badge.length*(4*3+3);
                const bCol=equipped?[100,230,100]:owned?[120,200,255]:sk.price===0?[100,230,100]:[255,200,60];
                renderText(ctx,textSheet,badge,Math.floor(cx+cardW/2-bw2/2),cy+222,1,bCol[0],bCol[1],bCol[2]);
                // Divider
                ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='white';
                ctx.fillRect(cx+20,cy+250,cardW-40,2);ctx.restore();
                // Button
                const btnH=80,btnY=cy+268;
                if(!owned&&sk.price>0){
                    const canBuy=driftCoins>=sk.price;
                    const btnW=200,btnX=Math.floor(cx+cardW/2-btnW/2);
                    renderTextButton(ctx,canBuy?btnSheet:greySheet,textSheet,0,btnX,btnY,btnW,'BUY',0,0,0);
                    if(mjp&&canBuy&&inRect(mouseX,mouseY,btnX,btnY,btnW,btnH)){
                        driftCoins-=sk.price;ownedSkins=[...ownedSkins,i];selectedSkin=i;
                        localStorage.setItem('icedrift_skin',selectedSkin);
                        localStorage.setItem('icedrift_owned_skins',JSON.stringify(ownedSkins));
                        dbSaveProfile();
                    }
                } else if(owned&&!equipped){
                    const btnW=200,btnX=Math.floor(cx+cardW/2-btnW/2);
                    renderTextButton(ctx,bwBtnSheet,textSheet,0,btnX,btnY,btnW,'EQUIP',0,0,0);
                    if(mjp&&inRect(mouseX,mouseY,btnX,btnY,btnW,btnH)){
                        selectedSkin=i;localStorage.setItem('icedrift_skin',selectedSkin);dbSaveProfile();
                    }
                }
            }}

            ctx.restore();
            const shopBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,shopBb.bx,shopBb.by,shopBb.bw,shopBb.bh)) page='LEVELS';
            renderButton(ctx,btnSheet,textSheet,4,shopBb.bx,shopBb.by,shopBb.bw,shopBb.bh,'');
            renderDriftCoins(ctx,textSheet,iconsImg);

        } else if(page==='CONVERT'){
            menuBg.update(dt);
            const maxConv=Math.floor(driftCoins/5);
            if(maxConv===0) shopConvertAmount=0;
            else shopConvertAmount=Math.max(1,Math.min(shopConvertAmount,maxConv));

            const convBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,convBb.bx,convBb.by,convBb.bw,convBb.bh)) page='LEVELS';

            const pW=820,pH=735,pX=Math.floor(SCREEN_WM-pW/2),pY=Math.floor(SCREEN_HM-pH/2);
            const pickerY=pY+460,btnSz=LEVEL_BUTTON_SIZE;
            const minBtn={x:SCREEN_WM-250,y:pickerY,w:btnSz,h:btnSz};
            const pluBtn={x:SCREEN_WM+150,y:pickerY,w:btnSz,h:btnSz};
            if(mjp&&shopConvertAmount>1&&inRect(mouseX,mouseY,minBtn.x,minBtn.y,minBtn.w,minBtn.h)) shopConvertAmount--;
            if(mjp&&shopConvertAmount<maxConv&&maxConv>0&&inRect(mouseX,mouseY,pluBtn.x,pluBtn.y,pluBtn.w,pluBtn.h)) shopConvertAmount++;

            const convW=320,convH=80,convX=Math.floor(SCREEN_WM-convW/2),convY=pY+615;
            if(mjp&&maxConv>0&&shopConvertAmount>0&&inRect(mouseX,mouseY,convX,convY,convW,convH)){
                const amt=shopConvertAmount;
                db.rpc('convert_dc_to_tp',{p_amount:amt}).then(({error})=>{
                    if(!error){
                        driftCoins-=amt*5;totalTalentPoints+=amt;
                        const newMax=Math.floor(driftCoins/5);
                        shopConvertAmount=newMax===0?0:Math.max(1,Math.min(shopConvertAmount,newMax));
                    }
                });
            }

            ctx.fillStyle='#000';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            menuBg.render(ctx,sheet);
            ctx.save();ctx.globalAlpha=80/255;ctx.filter='brightness(0)';ctx.imageSmoothingEnabled=false;
            ctx.drawImage(iconsImg,12,0,164,147,pX-5,pY+5,pW,pH);ctx.restore();
            ctx.save();ctx.imageSmoothingEnabled=false;
            ctx.drawImage(iconsImg,12,0,164,147,pX,pY,pW,pH);ctx.restore();

            const convTitleStr='CONVERT';
            const convTitleW=convTitleStr.length*(4*3*2+3);
            renderText(ctx,textSheet,convTitleStr,Math.floor(SCREEN_WM-convTitleW/2),pY+36,2,0,0,0);

            const cardY=pY+130,cardH=160,cardW=365,dcCardX=pX+30,tpCardX=pX+pW-30-cardW;
            ctx.save();ctx.imageSmoothingEnabled=false;
            ctx.drawImage(iconsImg,0,0,12,12,dcCardX+20,cardY+20,60,60);ctx.restore();
            renderText(ctx,textSheet,String(driftCoins),dcCardX+95,cardY+20,2,0,0,0);
            renderText(ctx,textSheet,'DRIFT COINS',dcCardX+20,cardY+95,1,0,0,0);
            ctx.save();ctx.imageSmoothingEnabled=false;
            ctx.drawImage(iconsImg,0,12,12,12,tpCardX+20,cardY+20,60,60);ctx.restore();
            renderText(ctx,textSheet,String(totalTalentPoints-spentTalentPoints),tpCardX+95,cardY+20,2,0,0,0);
            renderText(ctx,textSheet,'TALENT POINTS',tpCardX+20,cardY+95,1,0,0,0);

            const exY=pY+325;
            const exStr='5 DRIFT COINS  :  1 TP',exStrW=exStr.length*(4*3+3);
            renderText(ctx,textSheet,exStr,Math.floor(SCREEN_WM-exStrW/2),exY+12,1,0,0,0);
            const plStr='AMOUNT TO CONVERT',plStrW=plStr.length*(4*3+3);
            renderText(ctx,textSheet,plStr,Math.floor(SCREEN_WM-plStrW/2),pY+405,1,0,0,0);

            const minActive=shopConvertAmount>1&&maxConv>0;
            renderButton(ctx,minActive?bwBtnSheet:greySheet,textSheet,2,minBtn.x,minBtn.y,minBtn.w,minBtn.h,'');
            ctx.fillStyle=minActive?'black':'rgba(0,0,0,0.35)';
            ctx.fillRect(minBtn.x+18,minBtn.y+47,64,6);

            const amtStr=maxConv===0?'0':String(shopConvertAmount);
            const amtStrW=amtStr.length*(4*3*2+3);
            ctx.save();ctx.globalAlpha=150/255;ctx.fillStyle='rgb(40,40,60)';
            ctx.beginPath();ctx.roundRect(SCREEN_WM-140,pickerY,280,btnSz,6);ctx.fill();ctx.restore();
            renderText(ctx,textSheet,amtStr,Math.floor(SCREEN_WM-amtStrW/2),pickerY+32,2,0,0,0);

            const pluActive=shopConvertAmount<maxConv&&maxConv>0;
            renderButton(ctx,pluActive?bwBtnSheet:greySheet,textSheet,2,pluBtn.x,pluBtn.y,pluBtn.w,pluBtn.h,'');
            ctx.fillStyle=pluActive?'black':'rgba(0,0,0,0.35)';
            ctx.fillRect(pluBtn.x+18,pluBtn.y+47,64,6);
            ctx.fillRect(pluBtn.x+47,pluBtn.y+18,6,64);

            if(maxConv>0){
                const cgStr='COST: '+(shopConvertAmount*5)+'   GAIN: '+shopConvertAmount+' TP';
                const cgW=cgStr.length*(4*3+3);
                renderText(ctx,textSheet,cgStr,Math.floor(SCREEN_WM-cgW/2),pY+580,1,0,0,0);
            } else {
                const cgStr='NOT ENOUGH DRIFT COINS';
                const cgW=cgStr.length*(4*3+3);
                renderText(ctx,textSheet,cgStr,Math.floor(SCREEN_WM-cgW/2),pY+580,1,200,0,0);
            }
            renderTextButton(ctx,maxConv===0?greySheet:bwBtnSheet,textSheet,0,convX,convY,convW,'CONVERT',0,0,0,-5);

            renderButton(ctx,btnSheet,textSheet,4,convBb.bx,convBb.by,convBb.bw,convBb.bh,'');
            renderDriftCoins(ctx,textSheet,iconsImg);

        } else if(page==='LEADERBOARD'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);

            // Level tabs
            const tabGap=10,tabH=80,tabY=10;
            const tabW=Math.floor((SCREEN_WIDTH-60-4*tabGap)/5);
            const tabsTotal=5*tabW+4*tabGap,tabsX=Math.floor(SCREEN_WM-tabsTotal/2);
            const levelNames=['MAP 1','MAP 2','MAP 3','MAP 4','MAP 5'];
            for(let i=0;i<5;i++){
                const tx=tabsX+i*(tabW+tabGap),ty=tabY;
                const active=lbLevel===i;
                renderTextButton(ctx,active?btnSheet:greySheet,textSheet,0,tx,ty,tabW,levelNames[i],0,0,0);
                if(mjp&&inRect(mouseX,mouseY,tx,ty,tabW,tabH)&&lbLevel!==i){
                    lbLevel=i;lbScroll=0;lbRows=[];dbLoadLeaderboard(i);
                }
            }

            // Rows
            const rowH=48,listX=Math.floor(SCREEN_WM-340),listW=680,listY=108;
            const visibleH=SCREEN_HEIGHT-listY-20;
            const maxScroll=Math.max(0,lbRows.length*rowH-visibleH);
            lbScroll=Math.min(lbScroll,maxScroll);

            ctx.save();ctx.beginPath();ctx.rect(0,listY,SCREEN_WIDTH,visibleH);ctx.clip();
            if(lbLoading){
                const ld='LOADING',ldW=ld.length*(4*3*2+3);
                renderText(ctx,textSheet,ld,Math.floor(SCREEN_WM-ldW/2),Math.floor(SCREEN_HM),2,80,80,80);
            } else if(lbRows.length===0){
                const nd='NO TIMES YET',ndW=nd.length*(4*3+3);
                renderText(ctx,textSheet,nd,Math.floor(SCREEN_WM-ndW/2),Math.floor(SCREEN_HM),1,80,80,80);
            } else {
                for(let i=0;i<lbRows.length;i++){
                    const ry=listY+i*rowH-lbScroll;
                    if(ry+rowH<listY||ry>listY+visibleH) continue;
                    ctx.save();ctx.fillStyle=i%2===0?'rgba(0,0,0,0.06)':'rgba(0,0,0,0.02)';
                    ctx.fillRect(listX,ry,listW,rowH);ctx.restore();
                    const rank=String(i+1)+'.',rankW=rank.length*(4*3+3);
                    renderText(ctx,textSheet,rank,listX+10,ry+rowH/2-10,1,40,40,40);
                    const uname=lbRows[i].username||'unknown',unameW=uname.length*(4*3+3);
                    renderText(ctx,textSheet,uname,listX+60,ry+rowH/2-10,1,10,10,40);
                    const tstr=lbRows[i].time.toFixed(2)+'S',tstrW=tstr.length*(4*3+3);
                    renderText(ctx,textSheet,tstr,listX+listW-tstrW-10,ry+rowH/2-10,1,40,40,40);
                }
            }
            ctx.restore();

            // Back button
            {const bb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)) page='LEVELS';
            renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}

        } else if(page==='UPDATES'){
            ctx.fillStyle='#c8e8c8';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const ttl='UPDATES',ttlW=ttl.length*(4*3*2+3);
            renderText(ctx,textSheet,ttl,Math.floor(SCREEN_WM-ttlW/2),20,2,0,0,0);
            const padX=60,listX=padX,lineH=30,dateH=54,secGap=28,padTop=90;
            ctx.save();ctx.beginPath();ctx.rect(0,padTop,SCREEN_WIDTH,SCREEN_HEIGHT-padTop);ctx.clip();
            let oy=padTop-upScroll;
            for(let si=0;si<UPDATE_LOG.length;si++){
                const sec=UPDATE_LOG[si];
                renderText(ctx,textSheet,sec.date,listX,oy,2,20,60,20);
                oy+=dateH;
                for(const line of sec.lines){
                    renderText(ctx,textSheet,line,listX,oy,1,30,30,30);
                    oy+=lineH;
                }
                oy+=secGap;
                if(si<UPDATE_LOG.length-1){
                    ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle='rgb(20,80,20)';
                    ctx.fillRect(padX,oy-secGap/2,SCREEN_WIDTH-padX*2,2);
                    ctx.restore();
                }
            }
            const totalH=UPDATE_LOG.reduce((s,sec)=>s+dateH+sec.lines.length*lineH+secGap,0);
            upScroll=Math.min(upScroll,Math.max(0,totalH-(SCREEN_HEIGHT-padTop)+40));
            ctx.restore();
            {const bb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){upScroll=0;page='LEVELS';}
            renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}

        } else if(page==='CONTROLS'){
            ctx.fillStyle='#1a3d1a';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const ctlTitle='CONTROLS',ctlTW=ctlTitle.length*(4*3*2+3);
            renderText(ctx,textSheet,ctlTitle,Math.floor(SCREEN_WM-ctlTW/2),50,2,255,255,255);
            const lines=[
                {label:'MOUSE',desc:'Aim and slide direction'},
                {label:'SHIFT',desc:'Boost  (unlocked in Talents)'},
                {label:'HOLD SHIFT',desc:'Auto-Boost  (unlocked in Talents)'},
                {label:'RIGHT CLICK',desc:'Instant Stop  (unlocked in Talents)'},
            ];
            const rowH=36,startY=140;
            for(let i=0;i<lines.length;i++){
                const ry=startY+i*rowH;
                const lw=lines[i].label.length*(4*3+3);
                const colX=Math.floor(SCREEN_WM-150);
                renderText(ctx,textSheet,lines[i].label,colX-lw,ry,1,255,220,80);
                renderText(ctx,textSheet,'—',colX+6,ry,1,180,180,180);
                renderText(ctx,textSheet,lines[i].desc,colX+24,ry,1,200,200,200);
            }
            {const bb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)) page='LEVELS';
            renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}

        } else if(page==='SETTINGS'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const stTitle='SETTINGS',stTitleW=stTitle.length*(4*3*2+3);
            renderText(ctx,textSheet,stTitle,Math.floor(SCREEN_WM-stTitleW/2),40,2,0,0,0);

            // Tabs
            {const stTabs=['GENERAL','CONTROLS','VISUALS'],tabGap=14,tabH=80,tabY=110;
            const autoW=lbl=>lbl.length*(4*3*2+3)+60;
            const tabWidths=stTabs.map(autoW);
            const tabsTotal=tabWidths.reduce((a,b)=>a+b,0)+tabGap*(stTabs.length-1);
            let tabCurX=Math.floor(SCREEN_WM-tabsTotal/2);
            for(let i=0;i<stTabs.length;i++){
                const tw=tabWidths[i];
                renderTextButton(ctx,settingsTab===i?btnSheet:bwBtnSheet,textSheet,0,tabCurX,tabY,tw,stTabs[i],0,0,0);
                if(mjp&&inRect(mouseX,mouseY,tabCurX,tabY,tw,tabH)&&settingsTab!==i) settingsTab=i;
                tabCurX+=tw+tabGap;
            }}

            {const contentTop=210,rowH=110,rowGap=rowH+16;
            ctx.save();ctx.rect(0,contentTop,SCREEN_WIDTH,SCREEN_HEIGHT-contentTop);ctx.clip();
            if(settingsTab===0){
                if(currentUsername){
                    const autoW=lbl=>lbl.length*(4*3*2+3)+60;
                    let sy=contentTop+20-settingsScroll;
                    const unLabel='LOGGED IN AS',unLabelW=unLabel.length*(4*3+3);
                    renderText(ctx,textSheet,unLabel,Math.floor(SCREEN_WM-unLabelW/2),sy,1,140,140,160);sy+=34;
                    const unName=currentUsername,unNameW=unName.length*(4*3*2+3);
                    renderText(ctx,textSheet,unName,Math.floor(SCREEN_WM-unNameW/2),sy,2,0,0,0);sy+=rowGap;
                    const cuW=autoW('CHANGE USERNAME'),cuH=80,cuX=Math.floor(SCREEN_WM-cuW/2),cuY=sy;
                    const cpW=autoW('CHANGE PASSWORD'),cpH=80,cpX=Math.floor(SCREEN_WM-cpW/2),cpY=cuY+rowGap;
                    const loW=autoW('LOG OUT'),loH=80,loX=Math.floor(SCREEN_WM-loW/2),loY=cpY+rowGap;
                    const delW=autoW('DELETE ACCOUNT'),delH=80,delX=Math.floor(SCREEN_WM-delW/2),delY=loY+rowGap;
                    const totalH=delY+delH+150-contentTop;
                    settingsScroll=Math.max(0,Math.min(settingsScroll,Math.max(0,totalH-(SCREEN_HEIGHT-contentTop))));

                    renderTextButton(ctx,bwBtnSheet,textSheet,0,cuX,cuY,cuW,'CHANGE USERNAME',0,0,0);
                    renderTextButton(ctx,bwBtnSheet,textSheet,0,cpX,cpY,cpW,'CHANGE PASSWORD',0,0,0);
                    renderTextButton(ctx,btnSheet,textSheet,16,loX,loY,loW,'LOG OUT',0,0,0);
                    renderTextButton(ctx,redBtnSheet,textSheet,16,delX,delY,delW,'DELETE ACCOUNT',0,0,0);

                    if(deleteConfirm){
                        const warnMsg='ARE YOU SURE? THIS CANNOT BE UNDONE.',warnW=warnMsg.length*(4*3+3);
                        renderText(ctx,textSheet,warnMsg,Math.floor(SCREEN_WM-warnW/2),delY+100,1,180,30,30);
                        const confW=autoW('CONFIRM DELETE'),confH=80,confX=Math.floor(SCREEN_WM-confW/2),confY=delY+130;
                        renderTextButton(ctx,bwBtnSheet,textSheet,16,confX,confY,confW,'CONFIRM DELETE',180,30,30);
                        if(mjp&&inRect(mouseX,mouseY,confX,confY,confW,confH)) dbDeleteAccount();
                    }

                    if(mjp){
                        if(inRect(mouseX,mouseY,cuX,cuY,cuW,cuH)){authError='';inputValues.username='';setActiveInput(null);page='CHANGE_USERNAME';}
                        if(inRect(mouseX,mouseY,cpX,cpY,cpW,cpH)){authError='';inputValues.password='';setActiveInput(null);page='CHANGE_PASSWORD';}
                        if(inRect(mouseX,mouseY,loX,loY,loW,loH)){
                            (async()=>{
                                if(_saveProfileTimer){clearTimeout(_saveProfileTimer);_saveProfileTimer=null;}
                                await _dbSaveProfileNow();
                                db.auth.signOut();
                                leaveChatChannel();leaveLobbyChannel();leaveRaceChallengeChannel();unsubscribeFromProfile();
                                currentUser=null;currentUsername='';driftCoins=0;totalTalentPoints=0;spentTalentPoints=0;
                                talentPurchased=new Array(TALENT_COUNT).fill(false);talentRecomputeEffects();
                                inputValues.username='';inputValues.password='';deleteConfirm=false;setChatActive(false);page='MENU';
                            })();
                        }
                        if(inRect(mouseX,mouseY,delX,delY,delW,delH)) deleteConfirm=!deleteConfirm;
                    }
                } else {
                    const notLoggedIn='NOT LOGGED IN',nlW=notLoggedIn.length*(4*3*2+3);
                    renderText(ctx,textSheet,notLoggedIn,Math.floor(SCREEN_WM-nlW/2),Math.floor(SCREEN_HM-10),2,120,120,130);
                }
            } else if(settingsTab===1){
                settingsScroll=0;
                const mcLabel='MOBILE CONTROLS',mcLW=mcLabel.length*(4*3+3);
                const mcBtnW=('ON').length*(4*3*2+3)+60,mcBtnH=80,mcRowY=Math.floor(contentTop+(SCREEN_HEIGHT-contentTop)/2-60);
                const mcTotalW=mcLW+24+mcBtnW,mcLabelX=Math.floor(SCREEN_WM-mcTotalW/2),mcBtnX=mcLabelX+mcLW+24;
                renderText(ctx,textSheet,mcLabel,mcLabelX,mcRowY+22,1,80,80,80);
                renderTextButton(ctx,mobileControls?btnSheet:bwBtnSheet,textSheet,0,mcBtnX,mcRowY,mcBtnW,mobileControls?'ON':'OFF',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,mcBtnX,mcRowY,mcBtnW,mcBtnH)){
                    mobileControls=!mobileControls;
                    localStorage.setItem('mobileControls',mobileControls?'1':'0');
                }
            } else if(settingsTab===2){
                settingsScroll=0;
                const _vBtnW=('ON').length*(4*3*2+3)+60,_vBtnH=80,_vGap=24,_vSy0=contentTop+30;
                {const _lbl='SHOW PARTICLES',_lW=_lbl.length*(4*3+3),_tw=_lW+_vGap+_vBtnW;
                const _lx=Math.floor(SCREEN_WM-_tw/2),_bx=_lx+_lW+_vGap,_ry=_vSy0;
                renderText(ctx,textSheet,_lbl,_lx,_ry+22,1,80,80,80);
                renderTextButton(ctx,showParticles?btnSheet:bwBtnSheet,textSheet,0,_bx,_ry,_vBtnW,showParticles?'ON':'OFF',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,_bx,_ry,_vBtnW,_vBtnH)){showParticles=!showParticles;localStorage.setItem('icedrift_particles',showParticles?'1':'0');}}
                {const _lbl='SCREEN SHAKE',_lW=_lbl.length*(4*3+3),_tw=_lW+_vGap+_vBtnW;
                const _lx=Math.floor(SCREEN_WM-_tw/2),_bx=_lx+_lW+_vGap,_ry=_vSy0+rowGap;
                renderText(ctx,textSheet,_lbl,_lx,_ry+22,1,80,80,80);
                renderTextButton(ctx,showScreenShake?btnSheet:bwBtnSheet,textSheet,0,_bx,_ry,_vBtnW,showScreenShake?'ON':'OFF',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,_bx,_ry,_vBtnW,_vBtnH)){showScreenShake=!showScreenShake;localStorage.setItem('icedrift_screenshake',showScreenShake?'1':'0');}}
                {const _lbl='EDGE GLOW',_lW=_lbl.length*(4*3+3),_tw=_lW+_vGap+_vBtnW;
                const _lx=Math.floor(SCREEN_WM-_tw/2),_bx=_lx+_lW+_vGap,_ry=_vSy0+rowGap*2;
                renderText(ctx,textSheet,_lbl,_lx,_ry+22,1,80,80,80);
                renderTextButton(ctx,showEdgeGlow?btnSheet:bwBtnSheet,textSheet,0,_bx,_ry,_vBtnW,showEdgeGlow?'ON':'OFF',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,_bx,_ry,_vBtnW,_vBtnH)){showEdgeGlow=!showEdgeGlow;localStorage.setItem('icedrift_edgeglow',showEdgeGlow?'1':'0');}}
            }
            ctx.restore();}

            {const bb=getBackBtn();renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}
            if(mjp){const bb=getBackBtn();if(inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){deleteConfirm=false;settingsScroll=0;page='LEVELS';}}


        } else if(page==='RACE'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            {const ttl='MULTIPLAYER RACING',ttlW=ttl.length*(4*3*2+3);
            renderText(ctx,textSheet,ttl,Math.floor(SCREEN_WM-ttlW/2),50,2,0,0,0);}

            if(raceState==='menu'){
                if(currentUser){
                    const btnW=610,btn1Y=Math.floor(SCREEN_HM-110),btn2Y=Math.floor(SCREEN_HM+30);
                    const bX=Math.floor(SCREEN_WM-btnW/2);
                    renderTextButton(ctx,btnSheet,textSheet,0,bX,btn1Y,btnW,'FIND RANDOM OPPONENT',0,0,0);
                    {const d1='WIN OR LOSE 10% OF EACH OTHER\'S DC + TP',d1W=d1.length*(4*3+3);
                    renderText(ctx,textSheet,d1,Math.floor(SCREEN_WM-d1W/2),btn1Y+92,1,60,60,80);}
                    if(mjp&&inRect(mouseX,mouseY,bX,btn1Y,btnW,80)){raceMode='random';raceState='queue';joinRaceQueueChannel();}
                    renderTextButton(ctx,bwBtnSheet,textSheet,0,bX,btn2Y,btnW,'DUEL A PLAYER',0,0,0);
                    {const d2='JUST FOR FUN - NO DC OR TP WAGERED',d2W=d2.length*(4*3+3);
                    renderText(ctx,textSheet,d2,Math.floor(SCREEN_WM-d2W/2),btn2Y+92,1,60,60,80);}
                    if(mjp&&inRect(mouseX,mouseY,bX,btn2Y,btnW,80)){raceMode='duel';raceState='duel_send';inputValues.username='';duelInput='';duelError='';setActiveInput('username');}
                } else {
                    const nl='LOGIN TO RACE',nlW=nl.length*(4*3*2+3);
                    renderText(ctx,textSheet,nl,Math.floor(SCREEN_WM-nlW/2),Math.floor(SCREEN_HM-21),2,120,120,130);
                }
            } else if(raceState==='queue'){
                const st='SEARCHING FOR OPPONENT...',stW=st.length*(4*3+3);
                renderText(ctx,textSheet,st,Math.floor(SCREEN_WM-stW/2),Math.floor(SCREEN_HM-60),1,0,0,0);
                const canW=200,canY=Math.floor(SCREEN_HM+10),canX=Math.floor(SCREEN_WM-canW/2);
                renderTextButton(ctx,btnSheet,textSheet,0,canX,canY,canW,'CANCEL',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,canX,canY,canW,80)){leaveRaceQueueChannel();raceState='menu';}
            } else if(raceState==='duel_send'){
                duelInput=inputValues.username;
                const fW=400,fH=54,fX=Math.floor(SCREEN_WM-fW/2),fY=Math.floor(SCREEN_HM-80);
                ctx.save();ctx.globalAlpha=80/255;ctx.fillStyle='black';
                ctx.beginPath();ctx.roundRect(fX-4,fY+4,fW,fH,6);ctx.fill();ctx.restore();
                ctx.save();ctx.fillStyle=activeInput==='username'?'rgb(50,55,80)':'rgb(32,32,48)';
                ctx.strokeStyle=activeInput==='username'?'rgb(130,160,255)':'rgb(70,70,100)';
                ctx.lineWidth=2;
                ctx.beginPath();ctx.roundRect(fX,fY,fW,fH,6);ctx.fill();
                ctx.beginPath();ctx.roundRect(fX,fY,fW,fH,6);ctx.stroke();
                ctx.restore();
                const dlbl='PLAYER USERNAME',dlblW=dlbl.length*(4*3+3);
                renderText(ctx,textSheet,dlbl,fX,fY-28,1,0,0,0);
                if(inputValues.username) renderText(ctx,textSheet,inputValues.username,fX+12,fY+fH/2-10,1,220,220,240);
                if(activeInput==='username'&&Math.floor(performance.now()/530)%2===0){
                    const clampedCaret=Math.min(caretPos,inputValues.username.length);
                    const cx=fX+12+getCaretXOffset(inputValues.username,clampedCaret,1);
                    ctx.fillStyle='rgb(180,200,255)';ctx.fillRect(cx,fY+fH/2-11,2,7*3);
                }
                const dSendW=200,dSendY=fY+fH+20,dSendX=Math.floor(SCREEN_WM-dSendW/2);
                renderTextButton(ctx,btnSheet,textSheet,0,dSendX,dSendY,dSendW,'INVITE',0,0,0);
                if(duelError){const errW=duelError.length*(4*3+3);renderText(ctx,textSheet,duelError,Math.floor(SCREEN_WM-errW/2),dSendY+100,1,255,80,80);}
                if(mjp){
                    if(inRect(mouseX,mouseY,fX,fY,fW,fH)){setActiveInput('username');}
                    else{setActiveInput(null);}
                    if(inRect(mouseX,mouseY,dSendX,dSendY,dSendW,80)){duelInput=inputValues.username;sendDuelInvite();}
                }
            } else if(raceState==='duel_wait'){
                const oName=inputValues.username||duelInput||'player';
                const st='WAITING FOR '+oName+' TO ACCEPT...',stW=st.length*(4*3+3);
                renderText(ctx,textSheet,st,Math.floor(SCREEN_WM-stW/2),Math.floor(SCREEN_HM-60),1,0,0,0);
                const dCanW=200,dCanY=Math.floor(SCREEN_HM+10),dCanX=Math.floor(SCREEN_WM-dCanW/2);
                renderTextButton(ctx,btnSheet,textSheet,0,dCanX,dCanY,dCanW,'CANCEL',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,dCanX,dCanY,dCanW,80)){raceState='duel_send';raceSessionId=null;duelError='';clearTimeout(duelWaitTimeout);if(raceChannel){raceChannel.unsubscribe();raceChannel=null;}setActiveInput(null);}
            } else if(raceState==='challenge_send'){
                raceChallengeInput=inputValues.username;
                const fW=400,fH=54,fX=Math.floor(SCREEN_WM-fW/2),fY=Math.floor(SCREEN_HM-80);
                ctx.save();ctx.globalAlpha=80/255;ctx.fillStyle='black';
                ctx.beginPath();ctx.roundRect(fX-4,fY+4,fW,fH,6);ctx.fill();ctx.restore();
                ctx.save();ctx.fillStyle=activeInput==='username'?'rgb(50,55,80)':'rgb(32,32,48)';
                ctx.strokeStyle=activeInput==='username'?'rgb(130,160,255)':'rgb(70,70,100)';
                ctx.lineWidth=2;
                ctx.beginPath();ctx.roundRect(fX,fY,fW,fH,6);ctx.fill();
                ctx.beginPath();ctx.roundRect(fX,fY,fW,fH,6);ctx.stroke();
                ctx.restore();
                const lbl='OPPONENT USERNAME',lblW=lbl.length*(4*3+3);
                renderText(ctx,textSheet,lbl,fX,fY-28,1,0,0,0);
                if(inputValues.username) renderText(ctx,textSheet,inputValues.username,fX+12,fY+fH/2-10,1,220,220,240);
                if(activeInput==='username'&&Math.floor(performance.now()/530)%2===0){
                    const clampedCaret=Math.min(caretPos,inputValues.username.length);
                    const cx=fX+12+getCaretXOffset(inputValues.username,clampedCaret,1);
                    ctx.fillStyle='rgb(180,200,255)';ctx.fillRect(cx,fY+fH/2-11,2,7*3);
                }
                const sendW=160,sendY=fY+fH+20,sendX=Math.floor(SCREEN_WM-sendW/2);
                renderTextButton(ctx,btnSheet,textSheet,0,sendX,sendY,sendW,'SEND',0,0,0);
                if(raceChallengeError){const errW=raceChallengeError.length*(4*3+3);renderText(ctx,textSheet,raceChallengeError,Math.floor(SCREEN_WM-errW/2),sendY+100,1,255,80,80);}
                if(mjp){
                    if(inRect(mouseX,mouseY,fX,fY,fW,fH)){setActiveInput('username');}
                    if(inRect(mouseX,mouseY,sendX,sendY,sendW,80)){raceChallengeInput=inputValues.username;sendRaceChallenge();}
                }
            } else if(raceState==='challenge_wait'){
                const oName=inputValues.username||raceChallengeInput||'player';
                const st='WAITING FOR '+oName+' TO ACCEPT...',stW=st.length*(4*3+3);
                renderText(ctx,textSheet,st,Math.floor(SCREEN_WM-stW/2),Math.floor(SCREEN_HM-60),1,0,0,0);
                const canW=200,canY=Math.floor(SCREEN_HM+10),canX=Math.floor(SCREEN_WM-canW/2);
                renderTextButton(ctx,btnSheet,textSheet,0,canX,canY,canW,'CANCEL',0,0,0);
                if(mjp&&inRect(mouseX,mouseY,canX,canY,canW,80)){raceState='challenge_send';raceSessionId=null;raceChallengeError='';}
            } else if(raceState==='ready'){
                const st='OPPONENT FOUND! WAITING...',stW=st.length*(4*3+3);
                renderText(ctx,textSheet,st,Math.floor(SCREEN_WM-stW/2),Math.floor(SCREEN_HM-21),1,0,0,0);
            } else if(raceState==='map_anim'){
                const _maNow=performance.now();
                const _dur=2800;
                const _t=Math.min(1,(_maNow-raceMapAnimStart)/_dur);
                const mapNames=['MAP 1','MAP 2','MAP 3','MAP 4','MAP 5'];
                const _ease=1-Math.pow(1-_t,3);
                const _scrollPos=(raceMap-7)+7*_ease;
                const _cardW=500,BTN_H=80,_gap=20,_step=BTN_H+_gap;
                const _drawBtnBg=(sh,srcY,dx,dy,bW)=>{
                    const CAP_SW=2,MID_SW=36,SC=5,SRC_H=16,CAP_W=CAP_SW*SC,MID_TW=MID_SW*SC;
                    const midW=bW-CAP_W*2;
                    ctx.drawImage(sh,0,srcY,CAP_SW,SRC_H,dx,dy,CAP_W,BTN_H);
                    let drawn=0;
                    while(drawn<midW){const dw=Math.min(MID_TW,midW-drawn);ctx.drawImage(sh,CAP_SW,srcY,Math.ceil(dw/SC),SRC_H,dx+CAP_W+drawn,dy,dw,BTN_H);drawn+=dw;}
                    ctx.drawImage(sh,CAP_SW+MID_SW,srcY,CAP_SW,SRC_H,dx+bW-CAP_W,dy,CAP_W,BTN_H);
                };
                ctx.save();ctx.globalAlpha=0.78;ctx.fillStyle='rgb(5,8,22)';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);ctx.restore();
                ctx.save();ctx.beginPath();ctx.rect(0,SCREEN_HM-_step*2-10,SCREEN_WIDTH,_step*4+20);ctx.clip();
                for(let _ci=-4;_ci<=4;_ci++){
                    const _idx=((Math.round(_scrollPos)+_ci)%5+5)%5;
                    const _offY=(_ci+(Math.round(_scrollPos)-_scrollPos))*_step;
                    const _cy=SCREEN_HM+_offY;
                    const _dist=Math.abs(_offY/_step);
                    const _isFinal=_t>0.82&&_idx===raceMap&&_dist<0.5;
                    const _alpha=Math.max(0,0.9-_dist*0.38)*(_dist<0.01?1:0.75);
                    const _scl=Math.max(0.55,1-_dist*0.22)*(_isFinal?1+(_t-0.82)/0.18*0.15:1);
                    const _bW=Math.floor(_cardW*_scl);
                    const _bX=Math.floor(SCREEN_WM-_bW/2);
                    const _bY=Math.floor(_cy-BTN_H/2);
                    const _sh=_isFinal?btnSheet:bwBtnSheet;
                    ctx.save();ctx.globalAlpha=_alpha*(80/255);ctx.filter='brightness(0)';ctx.imageSmoothingEnabled=false;
                    _drawBtnBg(_sh,0,_bX-5,_bY+5,_bW);
                    ctx.restore();
                    ctx.save();ctx.globalAlpha=_alpha;ctx.imageSmoothingEnabled=false;
                    _drawBtnBg(_sh,0,_bX,_bY,_bW);
                    ctx.restore();
                    if(_isFinal){ctx.save();ctx.globalAlpha=0.18;ctx.fillStyle='white';ctx.fillRect(_bX,_bY,_bW,BTN_H);ctx.restore();}
                    const _mn=mapNames[_idx],_mnW=_mn.length*(4*3*2+3);
                    ctx.save();ctx.globalAlpha=_alpha;
                    renderText(ctx,textSheet,_mn,Math.floor(SCREEN_WM-_mnW/2),_bY+BTN_H/2-14,2,0,0,0);
                    ctx.restore();
                }
                ctx.restore();
                if(_t>0.82){
                    const _rv=Math.min(1,(_t-0.82)/0.18);
                    const _grd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,20,SCREEN_WM,SCREEN_HM,380);
                    _grd.addColorStop(0,`rgba(255,255,255,${(0.15*_rv).toFixed(2)})`);
                    _grd.addColorStop(1,'rgba(255,255,255,0)');
                    ctx.save();ctx.fillStyle=_grd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);ctx.restore();
                }
                {const lbl='COMPETING ON',lW=lbl.length*(4*3+3);
                ctx.save();ctx.globalAlpha=0.65;
                renderText(ctx,textSheet,lbl,Math.floor(SCREEN_WM-lW/2),SCREEN_HM-_step*2-38,1,180,185,210);
                ctx.restore();}
                if(raceOpponent){
                    const vs='VS '+(raceOpponent.username||'opponent'),vsW=vs.length*(4*3+3);
                    ctx.save();ctx.globalAlpha=0.85;
                    renderText(ctx,textSheet,vs,Math.floor(SCREEN_WM-vsW/2),SCREEN_HM+_step*2+24,1,255,215,60);
                    ctx.restore();
                }
                if(_t>=1){raceState='racing';page='RACE_GAME';}
            }

            // Incoming challenge notification overlay
            if(raceIncoming){
                ctx.save();ctx.globalAlpha=0.85;ctx.fillStyle='rgb(20,20,40)';
                ctx.beginPath();ctx.roundRect(SCREEN_WM-220,SCREEN_HM-100,440,200,12);ctx.fill();ctx.restore();
                ctx.save();ctx.strokeStyle='rgb(130,160,255)';ctx.lineWidth=2;
                ctx.beginPath();ctx.roundRect(SCREEN_WM-220,SCREEN_HM-100,440,200,12);ctx.stroke();ctx.restore();
                const chl='RACE CHALLENGE FROM',chlW=chl.length*(4*3+3);
                renderText(ctx,textSheet,chl,Math.floor(SCREEN_WM-chlW/2),SCREEN_HM-90,1,255,255,255);
                const fn=raceIncoming.fromUsername||'?',fnW=fn.length*(4*3*2+3);
                renderText(ctx,textSheet,fn,Math.floor(SCREEN_WM-fnW/2),SCREEN_HM-60,2,255,220,80);
                const accW=160,decW=160,accX=SCREEN_WM-accW-10,decX=SCREEN_WM+10,notifBtnY=SCREEN_HM+20;
                renderTextButton(ctx,btnSheet,textSheet,0,accX,notifBtnY,accW,'ACCEPT',0,180,80);
                renderTextButton(ctx,btnSheet,textSheet,0,decX,notifBtnY,decW,'DECLINE',180,0,0);
                if(mjp){
                    if(inRect(mouseX,mouseY,accX,notifBtnY,accW,80))acceptRaceChallenge();
                    if(inRect(mouseX,mouseY,decX,notifBtnY,decW,80))declineRaceChallenge();
                }
            }

            {const bb=getBackBtn();renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}
            if(mjp){const bb=getBackBtn();if(inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){leaveRaceAll();page='LEVELS';}}

        } else if(page==='CHANGE_USERNAME'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            {const ttl='CHANGE USERNAME',ttlW=ttl.length*(4*3*2+3);
            renderText(ctx,textSheet,ttl,Math.floor(SCREEN_WM-ttlW/2),40,2,0,0,0);}

            const cuFormW=500,cuFormX=Math.floor(SCREEN_WM-cuFormW/2),cuFH=54;
            const cuFY=Math.floor(SCREEN_HM-40);
            const cuSubW=240,cuSubX=Math.floor(SCREEN_WM-cuSubW/2),cuSubY=cuFY+80;
            authFieldRects={un:{x:cuFormX,y:cuFY,w:cuFormW,h:cuFH},pw:null};

            if(inRect(mouseX,mouseY,cuFormX,cuFY,cuFormW,cuFH)) _wantText=true;
            if(mjp){
                if(inRect(mouseX,mouseY,cuFormX,cuFY,cuFormW,cuFH)){
                    setActiveInput('username');
                    caretPos=getCaretPosFromX(inputValues.username,mouseX-(cuFormX+12),1);
                }else if(!inRect(mouseX,mouseY,cuSubX,cuSubY,cuSubW,80)){setActiveInput(null);}
                if(inRect(mouseX,mouseY,cuSubX,cuSubY,cuSubW,80)) authSubmitPending=true;
            }
            {const asp=authSubmitPending;authSubmitPending=false;
            if(asp&&!authLoading&&inputValues.username) dbChangeUsername(inputValues.username);}

            renderInputField('NEW USERNAME','username',cuFormX,cuFY,cuFormW,cuFH,false);
            renderTextButton(ctx,btnSheet,textSheet,0,cuSubX,cuSubY,cuSubW,authLoading?'...':'CONFIRM',0,0,0);
            {const bb=getBackBtn();renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}
            if(mjp){const bb=getBackBtn();if(inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){setActiveInput(null);authError='';page='SETTINGS';}}
            if(authError){const errW=authError.length*(4*3+3);renderText(ctx,textSheet,authError,Math.floor(SCREEN_WM-errW/2),cuSubY+100,1,255,80,80);}

        } else if(page==='CHANGE_PASSWORD'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            {const ttl='CHANGE PASSWORD',ttlW=ttl.length*(4*3*2+3);
            renderText(ctx,textSheet,ttl,Math.floor(SCREEN_WM-ttlW/2),40,2,0,0,0);}

            const cpFormW=500,cpFormX=Math.floor(SCREEN_WM-cpFormW/2),cpFH=54;
            const cpF1Y=Math.floor(SCREEN_HM-130); // current password
            const cpF2Y=cpF1Y+100;                 // new password
            const cpF3Y=cpF2Y+100;                 // confirm new password
            const cpSubW=240,cpSubX=Math.floor(SCREEN_WM-cpSubW/2),cpSubY=cpF3Y+80;
            authFieldRects={un:{x:cpFormX,y:cpF1Y,w:cpFormW,h:cpFH},pw:{x:cpFormX,y:cpF2Y,w:cpFormW,h:cpFH}};

            function cpFieldClick(fy,fk){
                setActiveInput(fk);
                const disp=showPassword?inputValues[fk]:'*'.repeat(inputValues[fk].length);
                caretPos=getCaretPosFromX(disp,mouseX-(cpFormX+12),1);
            }
            {const _togW=('SHOW').length*(4*3+3),_togH=7*3,_togPad=8;
            const _togX=cpFormX+cpFormW-_togW-12;
            const _cpFYs=[cpF1Y,cpF2Y,cpF3Y];
            for(const _fy of _cpFYs) if(inRect(mouseX,mouseY,cpFormX,_fy,cpFormW,cpFH)) _wantText=true;
            if(mjp){
                let _togHit=false;
                for(let _fi=0;_fi<_cpFYs.length;_fi++){const _tY=_cpFYs[_fi]+cpFH/2-_togH/2;if(inRect(mouseX,mouseY,_togX-_togPad,_tY-_togPad,_togW+_togPad*2,_togH+_togPad*2)){cpShowPw[_fi]=!cpShowPw[_fi];_togHit=true;break;}}
                if(!_togHit){
                    if(inRect(mouseX,mouseY,cpFormX,cpF1Y,cpFormW,cpFH))      cpFieldClick(cpF1Y,'username');
                    else if(inRect(mouseX,mouseY,cpFormX,cpF2Y,cpFormW,cpFH)) cpFieldClick(cpF2Y,'password');
                    else if(inRect(mouseX,mouseY,cpFormX,cpF3Y,cpFormW,cpFH)) cpFieldClick(cpF3Y,'confirmPw');
                    else if(!inRect(mouseX,mouseY,cpSubX,cpSubY,cpSubW,80))   setActiveInput(null);
                    if(inRect(mouseX,mouseY,cpSubX,cpSubY,cpSubW,80)) authSubmitPending=true;
                }
            }}
            {const asp=authSubmitPending;authSubmitPending=false;
            if(asp&&!authLoading&&inputValues.username&&inputValues.password){
                if(inputValues.password!==inputValues.confirmPw) authError="New passwords don't match";
                else dbChangePassword(inputValues.username,inputValues.password);
            }}

            renderInputField('CURRENT PASSWORD','username',cpFormX,cpF1Y,cpFormW,cpFH,true,cpShowPw[0]);
            renderInputField('NEW PASSWORD','password',cpFormX,cpF2Y,cpFormW,cpFH,true,cpShowPw[1]);
            renderInputField('CONFIRM NEW PASSWORD','confirmPw',cpFormX,cpF3Y,cpFormW,cpFH,true,cpShowPw[2]);
            renderTextButton(ctx,btnSheet,textSheet,0,cpSubX,cpSubY,cpSubW,authLoading?'...':'CONFIRM',0,0,0);
            {const bb=getBackBtn();renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');}
            if(mjp){const bb=getBackBtn();if(inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){setActiveInput(null);authError='';inputValues.username='';inputValues.password='';inputValues.confirmPw='';cpShowPw=[false,false,false];page='SETTINGS';}}
            if(authError){const errW=authError.length*(4*3+3);renderText(ctx,textSheet,authError,Math.floor(SCREEN_WM-errW/2),cpSubY+100,1,255,80,80);}

        } else if(page==='GAME'||page==='RACE_GAME'){
            if(!levelLoaded){
                if(editorFromEditorPlay){
                    loadEditorLevel();bg.setType(editorBackground);
                    INITIAL_CAR_X=editorSpawnCol*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_WM;
                    INITIAL_CAR_Y=editorSpawnRow*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_HM;
                } else if(playingCommunityLevel&&selectedCustomLevel){
                    loadLevelIntoEditor(selectedCustomLevel);loadEditorLevel();bg.setType(selectedCustomLevel.background);
                    INITIAL_CAR_X=selectedCustomLevel.spawn_col*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_WM;
                    INITIAL_CAR_Y=selectedCustomLevel.spawn_row*TILE_SIZE+Math.floor(TILE_SIZE/2)-SCREEN_HM;
                } else {
                    loadLevel();bg.setType(LEVEL_BACKGROUND[currentLevel]);
                    INITIAL_CAR_X=(1600-SCREEN_WM)-Math.floor(CAR_WIDTH/2)+LEVEL_START_X[currentLevel];
                    INITIAL_CAR_Y=(900-SCREEN_HM)-Math.floor(CAR_HEIGHT/2)+LEVEL_START_Y[currentLevel];
                }
                player.reset();
                for(let i=0;i<TILE_GRID_HEIGHT;i++)
                    for(let j=0;j<TILE_GRID_WIDTH;j++)
                        tiles[i][j].update(player.xPos,player.yPos);
                startWallDeactivated=false;
                if(page==='RACE_GAME'&&raceMapAnimStart){
                    // Base countdown on local animation start (perf.now), not wall clock.
                    // Both clients run the 2800ms map animation, so syncing on that gives
                    // Supabase-latency-level accuracy (~100-300ms) instead of clock-skew issues.
                    gameStartTime=raceMapAnimStart+1800;
                } else {
                    gameStartTime=performance.now();
                }
                finish=false;
                boostOverriding=false;particles=[];iceParticleAccum=0;prevIceVelX=0;prevIceVelY=0;prevIceVelX=0;prevIceVelY=0;countdownGoEnd=0;
                levelLoaded=true;
            }

            if(!startWallDeactivated){
                applyStartWallActivate();
                if(performance.now()-gameStartTime>=3000){
                    applyStartWallDeactivate();
                    startWallDeactivated=true;
                    countdownGoEnd=performance.now()+700;
                }
            }

            const gameBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,gameBb.bx,gameBb.by,gameBb.bw,gameBb.bh)){
                if(page==='RACE_GAME'){raceChannel?.send({type:'broadcast',event:'forfeit',payload:{uid:currentUser?.id}});applyRaceResult(false);}
                else if(editorFromEditorPlay){editorFromEditorPlay=false;levelLoaded=false;page='LEVEL_EDITOR';}
                else if(playingCommunityLevel){playingCommunityLevel=false;levelLoaded=false;page='CUSTOM_LEVEL_DETAIL';}
                else page='LEVEL_SELECT';
            }

            const prevPX=player.xPos+SCREEN_WM,prevPY=player.yPos+SCREEN_HM;
            player.update(mouseX,mouseY,tiles,dt,sjp,rmp);
            {const _gspd=Math.sqrt(player.xVel*player.xVel+player.yVel*player.yVel);
            const _gnow=performance.now();
            if(_gspd>20){
                const _gl=ghostTrail.length>0?ghostTrail[ghostTrail.length-1]:null;
                const _gdx=_gl?player.xPos-_gl.wx:999,_gdy=_gl?player.yPos-_gl.wy:999;
                if(_gdx*_gdx+_gdy*_gdy>22*22){
                    ghostTrail.push({wx:player.xPos,wy:player.yPos,dir:player.drawDir,born:_gnow,life:380,spd:_gspd});
                }
            }
            ghostTrail=ghostTrail.filter(g=>_gnow-g.born<g.life);}
            {const spd=Math.sqrt(player.xVel*player.xVel+player.yVel*player.yVel);
            const prevSpd=Math.sqrt(prevIceVelX*prevIceVelX+prevIceVelY*prevIceVelY);
            let driftFactor=0;
            if(spd>0.3&&prevSpd>0.3){
                const cross=Math.abs(prevIceVelX*player.yVel-prevIceVelY*player.xVel)/(spd*prevSpd);
                driftFactor=cross;
            }
            prevIceVelX=player.xVel;prevIceVelY=player.yVel;
            if(driftFactor>0.02&&spd>0.3){
                iceParticleAccum+=dt*driftFactor*spd*5;
                const pnow=performance.now();
                while(iceParticleAccum>=1){
                    iceParticleAccum-=1;
                    const inv=1/spd,bx=-player.xVel*inv,by=-player.yVel*inv;
                    const rearX=bx*(CAR_HEIGHT*0.5),rearY=by*(CAR_HEIGHT*0.5);
                    const a=(Math.random()-0.5)*Math.PI*0.7;
                    const ca=Math.cos(a),sa=Math.sin(a);
                    const dx=bx*ca-by*sa,dy=bx*sa+by*ca;
                    particles.push({
                        wx:player.xPos+SCREEN_WM+rearX+(Math.random()-0.5)*8,
                        wy:player.yPos+SCREEN_HM+rearY+(Math.random()-0.5)*8,
                        vx:dx*(2+Math.random()*spd*0.45),
                        vy:dy*(2+Math.random()*spd*0.45),
                        born:pnow,life:300+Math.random()*350,
                        size:4+Math.random()*6,ice:true,grass:player.onGrass,rot:Math.random()*Math.PI*2,bright:Math.random()
                    });
                }
            }}
            {const pnow=performance.now();
            if(player.lastWallHit){
                const wSpd=player.lastWallPreSpeed,nx=player.lastWallNX,ny=player.lastWallNY;
                const cnt=Math.min(55,Math.floor(wSpd*2.5+10));
                const cX=player.xPos+SCREEN_WM-nx*(CAR_HEIGHT*0.5);
                const cY=player.yPos+SCREEN_HM-ny*(CAR_HEIGHT*0.5);
                for(let i=0;i<cnt;i++){
                    const a=(Math.random()-0.5)*Math.PI;
                    const ca=Math.cos(a),sa=Math.sin(a);
                    const dx=nx*ca-ny*sa,dy=nx*sa+ny*ca;
                    particles.push({wx:cX+(Math.random()-0.5)*6,wy:cY+(Math.random()-0.5)*6,
                        vx:dx*(1.5+Math.random()*wSpd*0.35),vy:dy*(1.5+Math.random()*wSpd*0.35),
                        born:pnow,life:200+Math.random()*200,size:3+Math.random()*4,wall:true,rot:Math.random()*Math.PI*2,bright:Math.random()});
                }
            }
            if(player.lastKillHit){
                for(let i=0;i<50;i++){
                    const a=Math.random()*Math.PI*2,kSpd=3+Math.random()*9;
                    particles.push({wx:prevPX+(Math.random()-0.5)*10,wy:prevPY+(Math.random()-0.5)*10,
                        vx:Math.cos(a)*kSpd,vy:Math.sin(a)*kSpd,
                        born:pnow,life:300+Math.random()*300,size:3+Math.random()*5,kill:true,rot:Math.random()*Math.PI*2,bright:Math.random()});
                }
                if(pnow>=killGlowEnd)killGlowStart=pnow;
                killGlowEnd=pnow+600;killGlowDur=600;
                if(showScreenShake){screenShakeEnd=pnow+500;screenShakeDur=500;}
            }
            if(secondChanceImmune&&pnow<secondChanceImmunityEnd&&pnow-_sc2Pfx>25){
                _sc2Pfx=pnow;
                for(let _si=0;_si<30;_si++){
                    const _sa2=Math.random()*Math.PI*2,_ss=1+Math.random()*4.5;
                    const _gold=Math.random()>0.4;
                    particles.push({wx:player.xPos+SCREEN_WM+(Math.random()-0.5)*36,wy:player.yPos+SCREEN_HM+(Math.random()-0.5)*36,
                        vx:Math.cos(_sa2)*_ss,vy:Math.sin(_sa2)*_ss-1.2,
                        born:pnow,life:400+Math.random()*400,size:3+Math.random()*7,
                        finish:true,r:255,g:_gold?Math.floor(180+Math.random()*60):Math.floor(120+Math.random()*80),b:_gold?0:Math.floor(Math.random()*60),rot:Math.random()*Math.PI*2});
                }
            }
            if(pnow<speedTileEnd&&pnow-_spdPfx>25){
                _spdPfx=pnow;
                for(let _si=0;_si<30;_si++){
                    const _sa3=Math.random()*Math.PI*2,_ss3=1+Math.random()*4;
                    const _grn=Math.random()>0.35;
                    particles.push({wx:player.xPos+SCREEN_WM+(Math.random()-0.5)*32,wy:player.yPos+SCREEN_HM+(Math.random()-0.5)*32,
                        vx:Math.cos(_sa3)*_ss3,vy:Math.sin(_sa3)*_ss3-0.8,
                        born:pnow,life:350+Math.random()*350,size:2+Math.random()*6,
                        finish:true,r:_grn?0:180,g:255,b:_grn?Math.floor(80+Math.random()*80):255,rot:Math.random()*Math.PI*2});
                }
            }
            if(pnow-_cpPfx>25){
                _cpPfx=pnow;
                for(let _cpi=0;_cpi<TILE_GRID_HEIGHT;_cpi++) for(let _cpj=0;_cpj<TILE_GRID_WIDTH;_cpj++){
                    const _cpt=tiles[_cpi][_cpj];
                    if(!_cpt.active||_cpt.type!=='CHECKPOINT') continue;
                    const _cph=_cpt.hitbox;
                    if(_cph.x<-_cph.w-cullMarginX||_cph.y<-_cph.h-cullMarginY||_cph.x>SCREEN_WIDTH+cullMarginX||_cph.y>SCREEN_HEIGHT+cullMarginY) continue;
                    const _cpwx=player.xPos+_cph.x+_cph.w/2,_cpwy=player.yPos+_cph.y+_cph.h/2;
                    for(let _cpp=0;_cpp<5;_cpp++){
                        const _cpvx=(Math.random()-0.5)*0.9;
                        const _cpvy=-0.5-Math.random()*2.0;
                        particles.push({wx:_cpwx+(Math.random()-0.5)*_cph.w*0.7,wy:_cpwy+(Math.random()-0.5)*_cph.h*0.7,
                            vx:_cpvx,vy:_cpvy,born:pnow,life:400+Math.random()*450,size:2+Math.random()*6,
                            finish:true,r:255,g:Math.floor(185+Math.random()*35),b:0,
                            rot:Math.random()*Math.PI*2});
                    }
                }
            }}
            // Dev skin always-on effects (nachofrenchfry only)
            if(currentUsername?.toLowerCase()==='nachofrenchfry'&&SKINS[selectedSkin]?.name==='DEV SKIN'){
                const _devNow=performance.now();
                const _da=player.drawDir*Math.PI/180,_dc=Math.cos(_da),_ds=Math.sin(_da);
                const _cwx=player.xPos+SCREEN_WM,_cwy=player.yPos+SCREEN_HM-10;
                for(const[_cx,_cy]of[[-37.5,-42],[37.5,-42],[-37.5,42],[37.5,42]]){
                    const _cpx=_cwx+_cx*_dc-_cy*_ds,_cpy=_cwy+_cx*_ds+_cy*_dc;
                    for(let _k=0;_k<3;_k++){
                        const _ca=Math.random()*Math.PI*2,_cs=1.5+Math.random()*3.5;
                        particles.push({wx:_cpx+(Math.random()-0.5)*5,wy:_cpy+(Math.random()-0.5)*5,vx:Math.cos(_ca)*_cs,vy:Math.sin(_ca)*_cs,born:_devNow,life:300+Math.random()*300,size:4+Math.random()*7,finish:true,r:80,g:Math.floor(190+Math.random()*55),b:255,rot:Math.random()*Math.PI*2});
                    }
                }
                const _bwx=_cwx-42*_ds,_bwy=_cwy+42*_dc;
                for(let _fi=0;_fi<3;_fi++){
                    const _fSpd=2.5+Math.random()*3;
                    if(Math.random()<0.3){particles.push({wx:_bwx+(Math.random()-0.5)*8,wy:_bwy+(Math.random()-0.5)*8,vx:(-_ds+(Math.random()-0.5)*0.5)*_fSpd,vy:(_dc+(Math.random()-0.5)*0.5)*_fSpd,born:_devNow,life:300+Math.random()*200,size:5+Math.random()*5,smoke:true});}
                    else{particles.push({wx:_bwx+(Math.random()-0.5)*6,wy:_bwy+(Math.random()-0.5)*6,vx:(-_ds+(Math.random()-0.5)*0.5)*_fSpd,vy:(_dc+(Math.random()-0.5)*0.5)*_fSpd,born:_devNow,life:100+Math.random()*120,size:3+Math.random()*4});}
                }
            }
            // Race opponent particles (ice drift + dev car)
            if(page==='RACE_GAME'&&raceOpponent){
                const _rPnow=performance.now();
                if(raceOppDrift&&raceOppDrift.spd>0.3){
                    raceOppIceAccum+=dt*raceOppDrift.factor*raceOppDrift.spd*1.4;
                    while(raceOppIceAccum>=1){
                        raceOppIceAccum--;
                        const bx=-raceOppDrift.vx,by=-raceOppDrift.vy;
                        const rX=bx*(CAR_HEIGHT*0.5),rY=by*(CAR_HEIGHT*0.5);
                        const a=(Math.random()-0.5)*Math.PI*0.7;
                        const ca=Math.cos(a),sa=Math.sin(a);
                        const dx=bx*ca-by*sa,dy=bx*sa+by*ca;
                        particles.push({wx:raceOppX+rX+(Math.random()-0.5)*8,wy:raceOppY+rY+(Math.random()-0.5)*8,
                            vx:dx*(2+Math.random()*raceOppDrift.spd*0.45),vy:dy*(2+Math.random()*raceOppDrift.spd*0.45),
                            born:_rPnow,life:300+Math.random()*350,size:4+Math.random()*6,ice:true,rot:Math.random()*Math.PI*2,bright:Math.random()});
                    }
                } else {raceOppIceAccum=0;}
                if(SKINS[raceOpponent.skin]?.name==='DEV SKIN'&&(raceOpponent.username||'').toLowerCase()==='nachofrenchfry'&&_rPnow-raceOppDevPfx>25){
                    raceOppDevPfx=_rPnow;
                    const _oda=(raceOppDir*Math.PI/180),_odc=Math.cos(_oda),_ods=Math.sin(_oda);
                    const _ocx=raceOppX,_ocy=raceOppY-10;
                    for(const[_cx,_cy]of[[-37.5,-42],[37.5,-42],[-37.5,42],[37.5,42]]){
                        const _cpx=_ocx+_cx*_odc-_cy*_ods,_cpy=_ocy+_cx*_ods+_cy*_odc;
                        for(let _k=0;_k<2;_k++){
                            const _ca=Math.random()*Math.PI*2,_cs=1.5+Math.random()*3.5;
                            particles.push({wx:_cpx+(Math.random()-0.5)*5,wy:_cpy+(Math.random()-0.5)*5,vx:Math.cos(_ca)*_cs,vy:Math.sin(_ca)*_cs,born:_rPnow,life:300+Math.random()*300,size:4+Math.random()*7,finish:true,r:80,g:Math.floor(190+Math.random()*55),b:255,rot:Math.random()*Math.PI*2});
                        }
                    }
                    const _obwx=_ocx-42*_ods,_obwy=_ocy+42*_odc;
                    for(let _fi=0;_fi<3;_fi++){
                        const _fSpd=2.5+Math.random()*3;
                        if(Math.random()<0.3){particles.push({wx:_obwx+(Math.random()-0.5)*8,wy:_obwy+(Math.random()-0.5)*8,vx:(-_ods+(Math.random()-0.5)*0.5)*_fSpd,vy:(_odc+(Math.random()-0.5)*0.5)*_fSpd,born:_rPnow,life:300+Math.random()*200,size:5+Math.random()*5,smoke:true});}
                        else{particles.push({wx:_obwx+(Math.random()-0.5)*6,wy:_obwy+(Math.random()-0.5)*6,vx:(-_ods+(Math.random()-0.5)*0.5)*_fSpd,vy:(_odc+(Math.random()-0.5)*0.5)*_fSpd,born:_rPnow,life:100+Math.random()*120,size:3+Math.random()*4});}
                    }
                }
            }
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].update(player.xPos,player.yPos);
            bg.update(player.xPos,player.yPos);

            cullMarginX=Math.max(0,SCREEN_WM*(1/visionScale-1));
            cullMarginY=Math.max(0,SCREEN_HM*(1/visionScale-1));
            ctx.fillStyle='rgb(0,0,0)';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            {const _st=showScreenShake?Math.max(0,(screenShakeEnd-performance.now())/screenShakeDur):0;
            const _sa=_st*screenShakeMaxAmt;
            const _sx=_sa?(Math.random()*2-1)*_sa:0,_sy=_sa?(Math.random()*2-1)*_sa:0;
            ctx.save();ctx.translate(SCREEN_WM+_sx,SCREEN_HM+_sy);}
            ctx.scale(visionScale,visionScale);
            ctx.translate(-SCREEN_WM,-SCREEN_HM);
            bg.render(ctx,sheet);
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].renderGround(ctx,sheet,showHitboxes);
            // Checkpoint glow
            {const _cgNow=performance.now(),_cgP=0.22+Math.sin(_cgNow*0.004)*0.07;
            for(let _cgi=0;_cgi<TILE_GRID_HEIGHT;_cgi++) for(let _cgj=0;_cgj<TILE_GRID_WIDTH;_cgj++){
                const _cgt=tiles[_cgi][_cgj];
                if(!_cgt.active||_cgt.type!=='CHECKPOINT') continue;
                const _cgh=_cgt.hitbox;
                if(_cgh.x<-_cgh.w-cullMarginX||_cgh.y<-_cgh.h-cullMarginY||_cgh.x>SCREEN_WIDTH+cullMarginX||_cgh.y>SCREEN_HEIGHT+cullMarginY) continue;
                const _cgcx=Math.round(_cgh.x+_cgh.w/2),_cgcy=Math.round(_cgh.y+_cgh.h/2),_cgr=_cgh.w*1.8;
                const _cgrd=ctx.createRadialGradient(_cgcx,_cgcy,2,_cgcx,_cgcy,_cgr);
                _cgrd.addColorStop(0,`rgba(255,200,0,${(_cgP*1.3).toFixed(3)})`);
                _cgrd.addColorStop(0.5,`rgba(255,170,0,${_cgP.toFixed(3)})`);
                _cgrd.addColorStop(1,'rgba(255,140,0,0)');
                ctx.fillStyle=_cgrd;ctx.fillRect(_cgh.x-_cgh.w*0.8,_cgh.y-_cgh.h*0.8,_cgh.w*2.6,_cgh.h*2.6);
            }}
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].renderShadow(ctx);
            // Fill diagonal shadow gap: when (i,j) and (i+1,j+1) are walls but (i,j+1) is not
            {const isWall=t=>t.active&&(t.type==="WALL"||t.type==="START_WALL"||t.type==="KILL_BLOCK");
            ctx.save();ctx.globalAlpha=50/255;ctx.fillStyle='black';
            for(let i=0;i<TILE_GRID_HEIGHT-1;i++)
                for(let j=0;j<TILE_GRID_WIDTH-1;j++){
                    if(!isWall(tiles[i][j])||!isWall(tiles[i+1][j+1])||isWall(tiles[i][j+1]))continue;
                    const hb=tiles[i][j].hitbox;
                    if(hb.x>-hb.w-cullMarginX&&hb.y>-hb.h-cullMarginY&&hb.x<SCREEN_WIDTH+cullMarginX&&hb.y<SCREEN_HEIGHT+cullMarginY)
                        ctx.fillRect(Math.round(hb.x)+hb.w-10,Math.round(hb.y)+hb.h,10,10);
                }
            ctx.restore();}
            // Kill block radial glow (behind tiles)
            {const _kgNow=performance.now(),_kgP=0.09+Math.sin(_kgNow*0.004)*0.03;
            for(let _ki=0;_ki<TILE_GRID_HEIGHT;_ki++) for(let _kj=0;_kj<TILE_GRID_WIDTH;_kj++){
                const _ktile=tiles[_ki][_kj];
                if(!_ktile.active||_ktile.type!=='KILL_BLOCK') continue;
                const _kh=_ktile.hitbox;
                if(_kh.x<-_kh.w-cullMarginX||_kh.y<-_kh.h-cullMarginY||_kh.x>SCREEN_WIDTH+cullMarginX||_kh.y>SCREEN_HEIGHT+cullMarginY) continue;
                const _kcx=Math.round(_kh.x+_kh.w/2),_kcy=Math.round(_kh.y+_kh.h/2),_kr=_kh.w*1.8;
                const _grd=ctx.createRadialGradient(_kcx,_kcy,2,_kcx,_kcy,_kr);
                _grd.addColorStop(0,`rgba(255,20,0,${(_kgP*1.4).toFixed(3)})`);
                _grd.addColorStop(0.5,`rgba(255,0,0,${_kgP.toFixed(3)})`);
                _grd.addColorStop(1,'rgba(255,0,0,0)');
                ctx.fillStyle=_grd;ctx.fillRect(_kh.x-_kh.w*0.8,_kh.y-_kh.h*0.8,_kh.w*2.6,_kh.h*2.6);
            }}
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].render(ctx,sheet,showHitboxes);
            // Particles
            {const pnow=performance.now();
            particles=particles.filter(p=>pnow-p.born<p.life);
            for(const p of particles){
                const t=(pnow-p.born)/p.life;
                p.wx+=p.vx*dt; p.wy+=p.vy*dt;
                p.vx*=Math.pow(p.ice||p.wall||p.kill?0.80:p.finish?0.88:p.smoke?0.90:0.85,dt);
                p.vy*=Math.pow(p.ice||p.wall||p.kill?0.80:p.finish?0.88:p.smoke?0.90:0.85,dt);
                const sx=p.wx-player.xPos,sy=p.wy-player.yPos;
                if(!showParticles) continue;
                ctx.save();
                if(p.ice||p.wall||p.kill||p.finish){
                    ctx.globalAlpha=Math.pow(1-t,1.5)*0.95;
                    ctx.translate(sx,sy);
                    ctx.rotate(p.rot+t*Math.PI*4);
                    const s=p.size*(1-t*0.3);
                    const br=p.bright??0.5;
                    let r,g,b;
                    if(p.finish){r=p.r;g=p.g;b=p.b;}
                    else if(p.wall){r=Math.floor(140+br*80);g=Math.floor(135+br*75);b=Math.floor(125+br*65);}
                    else if(p.grass){r=Math.floor(30+br*90);g=Math.floor(130+br*110);b=Math.floor(20+br*50);}
                    else{r=Math.floor((15+br*195)*(1-t*0.3));g=Math.floor((60+br*170)*(1-t*0.1));b=255;}
                    ctx.fillStyle=`rgb(${r},${g},${b})`;
                    ctx.fillRect(-s,-s,s*2,s*2);
                }else{
                    ctx.globalAlpha=(1-t)*(p.smoke?0.55:0.85);
                    if(p.smoke){
                        const v=Math.floor(60+t*60);
                        ctx.fillStyle=`rgb(${v},${v},${v})`;
                    }else{
                        const r=255,g=Math.floor(200*(1-t*t)),b=0;
                        ctx.fillStyle=`rgb(${r},${g},${b})`;
                    }
                    const radius=p.size*(1+t*0.6);
                    ctx.beginPath();ctx.arc(sx,sy,radius,0,Math.PI*2);ctx.fill();
                }
                ctx.restore();
            }}
            // Ghost trail (world-space, before player)
            {const _sk=SKINS[Math.min(selectedSkin,SKINS.length-1)];
            const _rW=_sk.sw*SKIN_SCALE,_rH=CAR_HEIGHT,_pivY=10;
            const _gnow2=performance.now();
            for(const g of ghostTrail){
                const _dx=g.wx-player.xPos,_dy=g.wy-player.yPos;
                if(_dx*_dx+_dy*_dy<28*28) continue;
                const _gt=(_gnow2-g.born)/g.life;
                if(_gt>=1) continue;
                const _fi=Math.min(1,(_gnow2-g.born)/100);
                const _gsf=Math.max(0,Math.min(1,((g.spd||24)-18)/6));
                ctx.save();
                ctx.globalAlpha=Math.max(0,_fi*(1-_gt)*0.5*_gsf);
                ctx.imageSmoothingEnabled=false;
                ctx.translate(SCREEN_WM+(g.wx-player.xPos),SCREEN_HM+(g.wy-player.yPos)-_pivY);
                ctx.rotate(g.dir*Math.PI/180);
                ctx.drawImage(carImg,_sk.sx,0,_sk.sw,SKIN_H,-_rW/2,-_rH/2,_rW,_rH);
                ctx.restore();
            }}
            // Second chance golden aura (fade in/out only, no pulse)
            if(secondChanceImmune&&performance.now()<secondChanceImmunityEnd){
                const _sNow=performance.now();
                const _scEl=_sNow-(secondChanceImmunityEnd-secondChanceImmunityTotal);
                const _scRem=secondChanceImmunityEnd-_sNow;
                const _scF=Math.min(1,_scEl/400)*Math.min(1,_scRem/400);
                ctx.save();
                const _grd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM-10,10,SCREEN_WM,SCREEN_HM-10,150);
                _grd.addColorStop(0,`rgba(255,230,0,${(0.38*_scF).toFixed(2)})`);
                _grd.addColorStop(0.3,`rgba(255,200,0,${(0.22*_scF).toFixed(2)})`);
                _grd.addColorStop(0.65,`rgba(255,140,0,${(0.12*_scF).toFixed(2)})`);
                _grd.addColorStop(1,'rgba(255,80,0,0)');
                ctx.fillStyle=_grd;ctx.fillRect(SCREEN_WM-155,SCREEN_HM-165,310,330);
                ctx.restore();
            }
            // Speed tile player aura (fade in/out only, no pulse)
            if(performance.now()<speedTileEnd){
                const _sn=performance.now(),_sel=_sn-speedGlowStart,_srem=speedTileEnd-_sn;
                const _sfa=Math.min(1,_sel/300)*Math.min(1,_srem/300);
                ctx.save();
                const _sgrd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM-10,10,SCREEN_WM,SCREEN_HM-10,150);
                _sgrd.addColorStop(0,`rgba(0,255,120,${(0.38*_sfa).toFixed(2)})`);
                _sgrd.addColorStop(0.3,`rgba(0,220,80,${(0.22*_sfa).toFixed(2)})`);
                _sgrd.addColorStop(0.65,`rgba(0,180,60,${(0.12*_sfa).toFixed(2)})`);
                _sgrd.addColorStop(1,'rgba(0,150,40,0)');
                ctx.fillStyle=_sgrd;ctx.fillRect(SCREEN_WM-155,SCREEN_HM-165,310,330);
                ctx.restore();
            }
            // Race opponent car + ghost trail (inside world-space transform)
            if(page==='RACE_GAME'&&raceOpponent){
                const _rSk=SKINS[Math.min(raceOpponent.skin||0,SKINS.length-1)];
                const _rOpW=_rSk.sw*SKIN_SCALE,_rOpH=CAR_HEIGHT,_rPivY=10;
                const _rOppSx=raceOppX-player.xPos;
                const _rOppSy=raceOppY-player.yPos;
                const _rDir=raceOppDir*Math.PI/180;
                const _rNow2=performance.now();
                const _rSpdFade=Math.max(0,Math.min(1,(raceOppSpd-18)/8));
                // Ghost trail
                for(const g of raceOppGhostTrail){
                    if((g.wx-raceOppX)*(g.wx-raceOppX)+(g.wy-raceOppY)*(g.wy-raceOppY)<28*28)continue;
                    const _gtt=(_rNow2-g.born)/g.life;if(_gtt>=1)continue;
                    const _gfi=Math.min(1,(_rNow2-g.born)/100);
                    ctx.save();ctx.globalAlpha=Math.max(0,_gfi*(1-_gtt)*0.5*_rSpdFade);
                    ctx.imageSmoothingEnabled=false;
                    ctx.translate(g.wx-player.xPos,g.wy-player.yPos-_rPivY);ctx.rotate(g.dir*Math.PI/180);
                    ctx.drawImage(carImg,_rSk.sx,0,_rSk.sw,SKIN_H,-_rOpW/2,-_rOpH/2,_rOpW,_rOpH);
                    ctx.restore();
                }
                // Shadow
                ctx.save();ctx.globalAlpha=50/255;ctx.filter='brightness(0)';ctx.imageSmoothingEnabled=false;
                ctx.translate(_rOppSx-5,_rOppSy+5-_rPivY);ctx.rotate(_rDir);
                ctx.drawImage(carImg,_rSk.sx,0,_rSk.sw,SKIN_H,-_rOpW/2,-_rOpH/2,_rOpW,_rOpH);
                ctx.restore();
                // Car
                ctx.save();ctx.imageSmoothingEnabled=false;
                ctx.translate(_rOppSx,_rOppSy-_rPivY);ctx.rotate(_rDir);
                ctx.drawImage(carImg,_rSk.sx,0,_rSk.sw,SKIN_H,-_rOpW/2,-_rOpH/2,_rOpW,_rOpH);
                ctx.restore();
                // Name label
                {const nm=raceOpponent.username||'opponent';
                const nw=nm.length*(4*3+3),padX=8,padY=5;
                const lx=Math.floor(_rOppSx-nw/2-padX),ly=Math.floor(_rOppSy-_rOpH/2-_rPivY-7*3-padY*2-6);
                ctx.save();ctx.globalAlpha=0.8;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(lx,ly,nw+padX*2,7*3+padY*2,4);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,nm,lx+padX,ly+padY,1,255,255,255);}
            }
            player.render(ctx,carImg,showHitboxes);
            ctx.restore();
            if(showEdgeGlow&&levelHasKillBlocks){
                const _akNow=performance.now(),_akP=0.18+Math.sin(_akNow*0.003)*0.05;
                const _akGrd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,0,SCREEN_WM,SCREEN_HM,Math.max(SCREEN_WIDTH,SCREEN_HEIGHT)*0.75);
                _akGrd.addColorStop(0,'rgba(255,0,0,0)');
                _akGrd.addColorStop(0.5,`rgba(255,0,0,${(_akP*0.4).toFixed(3)})`);
                _akGrd.addColorStop(1,`rgba(255,0,0,${_akP.toFixed(3)})`);
                ctx.fillStyle=_akGrd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            }

            if(mobileControls&&boostUnlocked){
                const mb=getMobBoostRect();
                const active=boostTouchId!==null;
                ctx.save();ctx.globalAlpha=active?0.7:0.35;
                ctx.fillStyle=active?'rgb(255,180,40)':'rgb(255,255,255)';
                ctx.beginPath();ctx.roundRect(mb.x,mb.y,mb.w,mb.h,20);ctx.fill();ctx.restore();
                const bl='BOOST',blw=bl.length*(4*3+3);
                ctx.save();ctx.globalAlpha=active?1:0.6;
                renderText(ctx,textSheet,bl,Math.floor(mb.x+mb.w/2-blw/2),Math.floor(mb.y+mb.h/2-10),1,0,0,0);
                ctx.restore();
            }

            // Countdown
            {const elapsed=performance.now()-gameStartTime;
            let cdLabel='',cdR=255,cdG=255,cdB=255;
            if(!startWallDeactivated){
                if(elapsed<1000){cdLabel='3';cdR=230;cdG=60;cdB=60;}
                else if(elapsed<2000){cdLabel='2';cdR=230;cdG=160;cdB=40;}
                else{cdLabel='1';cdR=80;cdG=220;cdB=80;}
            }else if(performance.now()<countdownGoEnd){cdLabel='GO!';cdR=60;cdG=220;cdB=80;}
            if(cdLabel){
                const sz=4,cw=cdLabel.length*(4*3*sz+3),ch=7*3*sz;
                const cx2=Math.floor(SCREEN_WM-cw/2),cy2=Math.floor(SCREEN_HM-ch/2)-60;
                renderText(ctx,textSheet,cdLabel,cx2+3,cy2+3,sz,0,0,0);
                renderText(ctx,textSheet,cdLabel,cx2,cy2,sz,cdR,cdG,cdB);
            }}

            renderButton(ctx,btnSheet,textSheet,4,gameBb.bx,gameBb.by,gameBb.bw,gameBb.bh,'');
            if(editorFromEditorPlay&&editorPublishing){
                const _pb='BEAT THE LEVEL TO PUBLISH';const _sz=2;
                const _pw=_pb.length*(4*_sz*3+3),_ph=7*3*_sz;
                const _px=Math.floor(SCREEN_WM-_pw/2),_py=16;
                ctx.save();ctx.globalAlpha=0.75;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(_px-14,_py-10,_pw+28,_ph+20,8);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,_pb,_px+2,_py+2,_sz,0,0,0);
                renderText(ctx,textSheet,_pb,_px,_py,_sz,255,255,255);}

            // Tactical sight minimap
            if(tacticalSightUnlocked){
                const mSize=150+(tacticalSightLevel-1)*15;
                const mX=SCREEN_WIDTH-mSize-10,mY=10;
                ctx.save();
                ctx.globalAlpha=180/255;ctx.fillStyle='rgb(0,0,0)';
                ctx.fillRect(mX-2,mY-2,mSize+4,mSize+4);
                ctx.globalAlpha=200/255;ctx.strokeStyle='rgb(200,200,200)';
                ctx.strokeRect(mX-2,mY-2,mSize+4,mSize+4);
                ctx.globalAlpha=1;
                const tW=mSize/TILE_GRID_WIDTH,tH=mSize/TILE_GRID_HEIGHT;
                for(let mi=0;mi<TILE_GRID_HEIGHT;mi++){
                    for(let mj=0;mj<TILE_GRID_WIDTH;mj++){
                        const t=tiles[mi][mj];
                        if(!t.active)continue;
                        const tp=t.type;
                        if(tp==='WALL'||tp==='START_WALL') ctx.fillStyle='rgb(120,120,130)';
                        else if(tp==='ICE')                ctx.fillStyle='rgb(160,210,240)';
                        else if(tp==='END')                ctx.fillStyle='rgb(255,220,50)';
                        else if(tp==='START')              ctx.fillStyle='rgb(100,200,100)';
                        else if(tp==='KILL_BLOCK')         ctx.fillStyle='rgb(200,50,50)';
                        else if(tp==='VOID')               ctx.fillStyle='rgb(20,20,40)';
                        else if(tp==='CHECKPOINT')         ctx.fillStyle='rgb(255,200,0)';
                        else continue;
                        ctx.fillRect(mX+mj*tW,mY+mi*tH,Math.max(1,Math.round(tW)),Math.max(1,Math.round(tH)));
                    }
                }
                const pj=(player.xPos+SCREEN_WM)/TILE_SIZE;
                const pi=(player.yPos+SCREEN_HM)/TILE_SIZE;
                ctx.fillStyle='rgb(255,50,50)';
                ctx.fillRect(mX+pj*tW-2,mY+pi*tH-2,5,5);
                ctx.restore();
            }

            // HUD cooldown indicators
            {
                const hn=performance.now();
                const HX=20,HSTEP=68,SC=5; // SC = pixels per texture pixel
                const IW=17,IH=12,SW=12,SH=12,GAP=1; // icon and state tile sizes
                function cdState(endT,total){
                    if(hn>=endT)return 0;
                    return Math.min(20,Math.floor(((endT-hn)/total)*20));
                }
                function hudSprite(y,iconRow,state,stateSheet=cdSheet){
                    ctx.drawImage(cdSheet,0,iconRow*IH,IW,IH,HX,y,IW*SC,IH*SC);
                    ctx.drawImage(stateSheet,IW+GAP,state*SH,SW,SH,HX+IW*SC,y,SW*SC,SH*SC);
                }
                let ny=20;
                if(boostUnlocked){
                    hudSprite(ny,0,cdState(boostCooldownEnd,boostCooldownTotal));
                    ny+=HSTEP;
                    if(doubleChargeUnlocked){
                        for(let s=0;s<boost2CooldownEnds.length;s++){
                            hudSprite(ny,1,cdState(boost2CooldownEnds[s],boost2CooldownTotals[s]));
                            ny+=HSTEP;
                        }
                    }
                }
                if(turboBrakeUnlocked){
                    hudSprite(ny,2,cdState(turboBrakeCooldownEnd,turboBrakeCooldownTotal));
                    ny+=HSTEP;
                }
                if(secondChanceUnlocked){
                    if(secondChanceImmune)
                        hudSprite(ny,3,cdState(secondChanceImmunityEnd,secondChanceImmunityTotal),cdImmuneSheet);
                    else
                        hudSprite(ny,3,cdState(secondChanceCooldownEnd,secondChanceTotalDuration));
                }
            }

            // Race: broadcast position + HUD
            if(page==='RACE_GAME'){
                const _rnow=performance.now();
                if(currentUser&&_rnow-raceLastBroadcast>50){
                    raceLastBroadcast=_rnow;
                    {const _rv=Math.hypot(player.xVel,player.yVel);
                    const _rda=player.drawDir*Math.PI/180;
                    const _rCross=_rv>0.3?Math.abs(player.xVel*Math.sin(_rda)-player.yVel*Math.cos(_rda))/_rv:0;
                    const _rDrift=(_rCross>0.08&&_rv>0.3)?{factor:Math.min(1,_rCross),spd:_rv,vx:player.xVel/_rv,vy:player.yVel/_rv}:null;
                    raceChannel?.send({type:'broadcast',event:'pos',payload:{uid:currentUser.id,x:player.xPos+SCREEN_WM,y:player.yPos+SCREEN_HM,dir:player.drawDir,spd:_rv*60,drift:_rDrift}});}
                }
                // Race HUD overlay
                if(raceOppFin&&!raceLocalFin){
                    const hw='OPPONENT FINISHED: '+raceOppFinTime.toFixed(2)+'S - KEEP RACING OR FORFEIT',hwW=hw.length*(4*3+3);
                    ctx.save();ctx.globalAlpha=0.82;ctx.fillStyle='rgb(20,20,40)';
                    ctx.fillRect(Math.floor(SCREEN_WM-hwW/2-10),8,hwW+20,7*3+14);
                    ctx.restore();
                    renderText(ctx,textSheet,hw,Math.floor(SCREEN_WM-hwW/2),15,1,255,220,80);
                } else if(raceOppFin){
                    const hw='OPPONENT FINISHED: '+raceOppFinTime.toFixed(2)+'S',hwW=hw.length*(4*3+3);
                    ctx.save();ctx.globalAlpha=0.82;ctx.fillStyle='rgb(20,20,40)';
                    ctx.fillRect(Math.floor(SCREEN_WM-hwW/2-10),8,hwW+20,7*3+14);
                    ctx.restore();
                    renderText(ctx,textSheet,hw,Math.floor(SCREEN_WM-hwW/2),15,1,255,220,80);
                }
                // Forfeit button top-right (shift left of minimap if tactical sight active)
                {const fftW=240,fftY=10;
                const _mmSz=tacticalSightUnlocked?(150+(tacticalSightLevel-1)*15+16):0;
                const fftX=SCREEN_WIDTH-_mmSz-fftW-20;
                renderTextButton(ctx,btnSheet,textSheet,0,fftX,fftY,fftW,'FORFEIT',180,0,0);
                if(mjp&&inRect(mouseX,mouseY,fftX,fftY,fftW,80)){
                    raceChannel?.send({type:'broadcast',event:'forfeit',payload:{uid:currentUser?.id}});
                    applyRaceResult(false);
                }}
            }

            if(finish&&page!=='RACE_GAME'){
                const text='YOU FINISHED IN '+finishTime.toFixed(2)+' SECONDS!';
                const size=2,charW=4,charH=7;
                const tw=text.length*(charW*3*size+3);
                const th=charH*3*size;
                renderText(ctx,textSheet,text,SCREEN_WM-tw/2,(SCREEN_HM-th/2)-SCREEN_HM/2,size);
                if(performance.now()-finishTick>=3000){
                    if(editorFromEditorPlay){
                        if(editorPublishing){
                            editorPublishing=false;
                            editorFromEditorPlay=false;levelLoaded=false;
                            customLevelsTab='my';page='CUSTOM_LEVELS';
                            dbSaveCustomLevel(true,finishTime).then(()=>{myLevelsLoaded=false;communityLevelsLoaded=false;});
                        } else {
                            editorFromEditorPlay=false;levelLoaded=false;page='LEVEL_EDITOR';
                        }
                    } else if(playingCommunityLevel){
                        playingCommunityLevel=false;levelLoaded=false;
                        if(selectedCustomLevel)dbSaveCustomLevelRecord(selectedCustomLevel.id,finishTime);
                        page='CUSTOM_LEVEL_DETAIL';
                    } else page='LEVEL_SELECT';
                    finish=false;
                }
            }
            // Debug hint
            if(!showHitboxes){
                const hint='Hold Option or Alt to Show Debug Info';
                const hw=hint.length*(4*3+3);
                ctx.save();ctx.globalAlpha=200/255;
                renderText(ctx,textSheet,hint,SCREEN_WIDTH-hw-12,SCREEN_HEIGHT-7*3-12,1,255,255,255);
                ctx.restore();
            }
            if(showEdgeGlow){const _now=performance.now();if(_now<speedTileEnd){
                const _el=_now-speedGlowStart,_rem=speedTileEnd-_now;
                const _fa=Math.min(1,Math.min(_el/300,_rem/300));
                const grd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,Math.min(SCREEN_WIDTH,SCREEN_HEIGHT)*0.15,SCREEN_WM,SCREEN_HM,Math.max(SCREEN_WIDTH,SCREEN_HEIGHT)*0.75);
                grd.addColorStop(0,'rgba(0,255,80,0)');
                grd.addColorStop(0.5,`rgba(0,255,80,${(_fa*0.5).toFixed(2)})`);
                grd.addColorStop(1,`rgba(0,255,80,${(_fa*0.9).toFixed(2)})`);
                ctx.fillStyle=grd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            }}
            if(showEdgeGlow){const _kgt=performance.now();if(_kgt<killGlowEnd){
                const _kel=_kgt-killGlowStart,_krem=killGlowEnd-_kgt;
                const _kfa=Math.min(1,_kel/200)*Math.min(1,_krem/200);
                const grd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,Math.min(SCREEN_WIDTH,SCREEN_HEIGHT)*0.1,SCREEN_WM,SCREEN_HM,Math.max(SCREEN_WIDTH,SCREEN_HEIGHT)*0.8);
                grd.addColorStop(0,'rgba(255,0,0,0)');
                grd.addColorStop(0.5,`rgba(255,0,0,${(0.45*_kfa).toFixed(2)})`);
                grd.addColorStop(1,`rgba(255,0,0,${(0.8*_kfa).toFixed(2)})`);
                ctx.fillStyle=grd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            }}

        } else if(page==='LOBBY'){
            if(!lobbyLoaded){
                loadLobbyLevel();
                bg.setType(2);
                INITIAL_CAR_X=Math.floor(50*TILE_SIZE-SCREEN_WM);
                INITIAL_CAR_Y=Math.floor(50*TILE_SIZE-SCREEN_HM);
                player.reset();
                player.xVel=0;player.yVel=0;
                for(let i=0;i<TILE_GRID_HEIGHT;i++)
                    for(let j=0;j<TILE_GRID_WIDTH;j++)
                        tiles[i][j].update(player.xPos,player.yPos);
                boostOverriding=false;particles=[];iceParticleAccum=0;prevIceVelX=0;prevIceVelY=0;ghostTrail=[];
                otherPlayers={};lastLobbyBroadcast=0;
                joinLobbyChannel();
                lobbyLoaded=true;
            }

            const lobbyBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,lobbyBb.bx,lobbyBb.by,lobbyBb.bw,lobbyBb.bh)){
                leaveLobbyChannel();
                lobbyLoaded=false;
                ghostTrail=[];
                page='LEVELS';
            }

            player.update(mouseX,mouseY,tiles,dt,sjp,rmp);
            {const _lgspd=Math.sqrt(player.xVel*player.xVel+player.yVel*player.yVel);
            const _lgnow=performance.now();
            if(_lgspd>20){
                const _lgl=ghostTrail.length>0?ghostTrail[ghostTrail.length-1]:null;
                const _lgdx=_lgl?player.xPos-_lgl.wx:999,_lgdy=_lgl?player.yPos-_lgl.wy:999;
                if(_lgdx*_lgdx+_lgdy*_lgdy>22*22)
                    ghostTrail.push({wx:player.xPos,wy:player.yPos,dir:player.drawDir,born:_lgnow,life:380,spd:_lgspd});
            }
            ghostTrail=ghostTrail.filter(g=>_lgnow-g.born<g.life);}
            {const spd=Math.sqrt(player.xVel*player.xVel+player.yVel*player.yVel);
            const prevSpd=Math.sqrt(prevIceVelX*prevIceVelX+prevIceVelY*prevIceVelY);
            let _ldf=0;
            if(spd>0.3&&prevSpd>0.3){
                const cross=Math.abs(prevIceVelX*player.yVel-prevIceVelY*player.xVel)/(spd*prevSpd);
                _ldf=cross;
            }
            prevIceVelX=player.xVel;prevIceVelY=player.yVel;
            _lobbyDrift=(_ldf>0.02&&spd>0.3)?{factor:Math.min(1,_ldf),spd,vx:player.xVel/spd,vy:player.yVel/spd}:null;
            if(_ldf>0.02&&spd>0.3){
                iceParticleAccum+=dt*_ldf*spd*5;
                const pnow=performance.now();
                while(iceParticleAccum>=1){
                    iceParticleAccum-=1;
                    const inv=1/spd,bx=-player.xVel*inv,by=-player.yVel*inv;
                    const rearX=bx*(CAR_HEIGHT*0.5),rearY=by*(CAR_HEIGHT*0.5);
                    const a=(Math.random()-0.5)*Math.PI*0.7;
                    const ca=Math.cos(a),sa=Math.sin(a);
                    const dx=bx*ca-by*sa,dy=bx*sa+by*ca;
                    particles.push({
                        wx:player.xPos+SCREEN_WM+rearX+(Math.random()-0.5)*8,
                        wy:player.yPos+SCREEN_HM+rearY+(Math.random()-0.5)*8,
                        vx:dx*(2+Math.random()*spd*0.45),
                        vy:dy*(2+Math.random()*spd*0.45),
                        born:pnow,life:300+Math.random()*350,
                        size:4+Math.random()*6,ice:true,grass:player.onGrass,rot:Math.random()*Math.PI*2,bright:Math.random()
                    });
                }
            }}
            {const pnow=performance.now();
            if(player.lastWallHit){
                const wSpd=player.lastWallPreSpeed,nx=player.lastWallNX,ny=player.lastWallNY;
                const cnt=Math.min(55,Math.floor(wSpd*2.5+10));
                const cX=player.xPos+SCREEN_WM-nx*(CAR_HEIGHT*0.5);
                const cY=player.yPos+SCREEN_HM-ny*(CAR_HEIGHT*0.5);
                for(let i=0;i<cnt;i++){
                    const a=(Math.random()-0.5)*Math.PI;
                    const ca=Math.cos(a),sa=Math.sin(a);
                    const dx=nx*ca-ny*sa,dy=nx*sa+ny*ca;
                    particles.push({wx:cX+(Math.random()-0.5)*6,wy:cY+(Math.random()-0.5)*6,
                        vx:dx*(1.5+Math.random()*wSpd*0.35),vy:dy*(1.5+Math.random()*wSpd*0.35),
                        born:pnow,life:200+Math.random()*200,size:3+Math.random()*4,wall:true,rot:Math.random()*Math.PI*2,bright:Math.random()});
                }
                lobbyPfxQueue.push({t:'w',nx,ny,spd:wSpd});
            }}
            {const pnow=performance.now();
            if(secondChanceImmune&&pnow<secondChanceImmunityEnd&&pnow-_sc2Pfx>25){
                _sc2Pfx=pnow;
                for(let _si=0;_si<30;_si++){
                    const _sa2=Math.random()*Math.PI*2,_ss=1+Math.random()*4.5;
                    const _gold=Math.random()>0.4;
                    particles.push({wx:player.xPos+SCREEN_WM+(Math.random()-0.5)*36,wy:player.yPos+SCREEN_HM+(Math.random()-0.5)*36,
                        vx:Math.cos(_sa2)*_ss,vy:Math.sin(_sa2)*_ss-1.2,
                        born:pnow,life:400+Math.random()*400,size:3+Math.random()*7,
                        finish:true,r:255,g:_gold?Math.floor(180+Math.random()*60):Math.floor(120+Math.random()*80),b:_gold?0:Math.floor(Math.random()*60),rot:Math.random()*Math.PI*2});
                }
            }
            if(pnow<speedTileEnd&&pnow-_spdPfx>25){
                _spdPfx=pnow;
                for(let _si=0;_si<30;_si++){
                    const _sa3=Math.random()*Math.PI*2,_ss3=1+Math.random()*4;
                    const _grn=Math.random()>0.35;
                    particles.push({wx:player.xPos+SCREEN_WM+(Math.random()-0.5)*32,wy:player.yPos+SCREEN_HM+(Math.random()-0.5)*32,
                        vx:Math.cos(_sa3)*_ss3,vy:Math.sin(_sa3)*_ss3-0.8,
                        born:pnow,life:350+Math.random()*350,size:2+Math.random()*6,
                        finish:true,r:_grn?0:180,g:255,b:_grn?Math.floor(80+Math.random()*80):255,rot:Math.random()*Math.PI*2});
                }
            }
            if(pnow-_cpPfx>25){
                _cpPfx=pnow;
                for(let _cpi=0;_cpi<TILE_GRID_HEIGHT;_cpi++) for(let _cpj=0;_cpj<TILE_GRID_WIDTH;_cpj++){
                    const _cpt=tiles[_cpi][_cpj];
                    if(!_cpt.active||_cpt.type!=='CHECKPOINT') continue;
                    const _cph=_cpt.hitbox;
                    if(_cph.x<-_cph.w-cullMarginX||_cph.y<-_cph.h-cullMarginY||_cph.x>SCREEN_WIDTH+cullMarginX||_cph.y>SCREEN_HEIGHT+cullMarginY) continue;
                    const _cpwx=player.xPos+_cph.x+_cph.w/2,_cpwy=player.yPos+_cph.y+_cph.h/2;
                    for(let _cpp=0;_cpp<5;_cpp++){
                        const _cpvx=(Math.random()-0.5)*0.9;
                        const _cpvy=-0.5-Math.random()*2.0;
                        particles.push({wx:_cpwx+(Math.random()-0.5)*_cph.w*0.7,wy:_cpwy+(Math.random()-0.5)*_cph.h*0.7,
                            vx:_cpvx,vy:_cpvy,born:pnow,life:400+Math.random()*450,size:2+Math.random()*6,
                            finish:true,r:255,g:Math.floor(185+Math.random()*35),b:0,
                            rot:Math.random()*Math.PI*2});
                    }
                }
            }}
            // Dev skin always-on effects (nachofrenchfry only, lobby)
            if(currentUsername?.toLowerCase()==='nachofrenchfry'&&SKINS[selectedSkin]?.name==='DEV SKIN'){
                const _devNow=performance.now();
                const _da=player.drawDir*Math.PI/180,_dc=Math.cos(_da),_ds=Math.sin(_da);
                const _cwx=player.xPos+SCREEN_WM,_cwy=player.yPos+SCREEN_HM-10;
                for(const[_cx,_cy]of[[-37.5,-42],[37.5,-42],[-37.5,42],[37.5,42]]){
                    const _cpx=_cwx+_cx*_dc-_cy*_ds,_cpy=_cwy+_cx*_ds+_cy*_dc;
                    for(let _k=0;_k<3;_k++){
                        const _ca=Math.random()*Math.PI*2,_cs=1.5+Math.random()*3.5;
                        particles.push({wx:_cpx+(Math.random()-0.5)*5,wy:_cpy+(Math.random()-0.5)*5,vx:Math.cos(_ca)*_cs,vy:Math.sin(_ca)*_cs,born:_devNow,life:300+Math.random()*300,size:4+Math.random()*7,finish:true,r:80,g:Math.floor(190+Math.random()*55),b:255,rot:Math.random()*Math.PI*2});
                    }
                }
                const _bwx=_cwx-42*_ds,_bwy=_cwy+42*_dc;
                for(let _fi=0;_fi<3;_fi++){
                    const _fSpd=2.5+Math.random()*3;
                    if(Math.random()<0.3){particles.push({wx:_bwx+(Math.random()-0.5)*8,wy:_bwy+(Math.random()-0.5)*8,vx:(-_ds+(Math.random()-0.5)*0.5)*_fSpd,vy:(_dc+(Math.random()-0.5)*0.5)*_fSpd,born:_devNow,life:300+Math.random()*200,size:5+Math.random()*5,smoke:true});}
                    else{particles.push({wx:_bwx+(Math.random()-0.5)*6,wy:_bwy+(Math.random()-0.5)*6,vx:(-_ds+(Math.random()-0.5)*0.5)*_fSpd,vy:(_dc+(Math.random()-0.5)*0.5)*_fSpd,born:_devNow,life:100+Math.random()*120,size:3+Math.random()*4});}
                }
            }
            // Spawn particles for other players (ice drift + pending pfx events)
            {const pnow=performance.now();
            for(const[,op]of Object.entries(otherPlayers)){
                if(op.drift&&op.drift.spd>0.3){
                    op.iceAccum=(op.iceAccum||0)+dt*op.drift.factor*op.drift.spd*1.4;
                    while(op.iceAccum>=1){
                        op.iceAccum--;
                        const bx=-op.drift.vx,by=-op.drift.vy;
                        const rX=bx*(CAR_HEIGHT*0.5),rY=by*(CAR_HEIGHT*0.5);
                        const a=(Math.random()-0.5)*Math.PI*0.7;
                        const ca=Math.cos(a),sa=Math.sin(a);
                        const dx=bx*ca-by*sa,dy=bx*sa+by*ca;
                        particles.push({wx:op.x+rX+(Math.random()-0.5)*8,wy:op.y+rY+(Math.random()-0.5)*8,
                            vx:dx*(2+Math.random()*op.drift.spd*0.45),vy:dy*(2+Math.random()*op.drift.spd*0.45),
                            born:pnow,life:300+Math.random()*350,size:4+Math.random()*6,ice:true,grass:false,rot:Math.random()*Math.PI*2,bright:Math.random()});
                    }
                }
                for(const ev of(op.pfxPending||[])){
                    if(ev.t==='w'){
                        const cnt2=Math.min(55,Math.floor(ev.spd*2.5+10));
                        const cX2=op.x-ev.nx*(CAR_HEIGHT*0.5),cY2=op.y-ev.ny*(CAR_HEIGHT*0.5);
                        for(let i=0;i<cnt2;i++){
                            const a=(Math.random()-0.5)*Math.PI;
                            const ca=Math.cos(a),sa=Math.sin(a);
                            const dx=ev.nx*ca-ev.ny*sa,dy=ev.nx*sa+ev.ny*ca;
                            particles.push({wx:cX2+(Math.random()-0.5)*6,wy:cY2+(Math.random()-0.5)*6,
                                vx:dx*(1.5+Math.random()*ev.spd*0.35),vy:dy*(1.5+Math.random()*ev.spd*0.35),
                                born:pnow,life:200+Math.random()*200,size:3+Math.random()*4,wall:true,rot:Math.random()*Math.PI*2,bright:Math.random()});
                        }
                    }else if(ev.t==='b'){
                        const bNx=ev.dx,bNy=ev.dy;
                        for(let _i=0;_i<60;_i++){
                            const a=(Math.random()-0.5)*Math.PI*(Math.random()<0.4?1.1:0.7);
                            const ca=Math.cos(a),sa=Math.sin(a);
                            const pdx=bNx*ca-bNy*sa,pdy=bNx*sa+bNy*ca;
                            const isSmk=Math.random()<0.35,spd2=isSmk?(1+Math.random()*3):(4+Math.random()*8);
                            particles.push({wx:op.x+bNx*32,wy:op.y+bNy*32,vx:pdx*spd2,vy:pdy*spd2,
                                born:pnow,life:isSmk?(600+Math.random()*500):(200+Math.random()*250),
                                size:isSmk?(7+Math.random()*8):(3+Math.random()*4),smoke:isSmk});
                        }
                    }
                }
                // Second chance and speed particles for other players
                const _opScRem=op.sc_rem>0?Math.max(0,op.sc_rem-(pnow-op.sc_ts)):0;
                if(_opScRem>0&&pnow-(op._sc2Pfx||0)>25){
                    op._sc2Pfx=pnow;
                    for(let _si=0;_si<30;_si++){
                        const _sa2=Math.random()*Math.PI*2,_ss=1+Math.random()*4.5;
                        const _gold=Math.random()>0.4;
                        particles.push({wx:op.x+(Math.random()-0.5)*36,wy:op.y+(Math.random()-0.5)*36,vx:Math.cos(_sa2)*_ss,vy:Math.sin(_sa2)*_ss-1.2,born:pnow,life:400+Math.random()*400,size:3+Math.random()*7,finish:true,r:255,g:_gold?Math.floor(180+Math.random()*60):Math.floor(120+Math.random()*80),b:_gold?0:Math.floor(Math.random()*60),rot:Math.random()*Math.PI*2});
                    }
                }
                const _opSpdRem=op.spd_rem>0?Math.max(0,op.spd_rem-(pnow-op.spd_ts)):0;
                if(_opSpdRem>0&&pnow-(op._spdPfx||0)>25){
                    op._spdPfx=pnow;
                    for(let _si=0;_si<30;_si++){
                        const _sa3=Math.random()*Math.PI*2,_ss3=1+Math.random()*4;
                        const _grn=Math.random()>0.35;
                        particles.push({wx:op.x+(Math.random()-0.5)*32,wy:op.y+(Math.random()-0.5)*32,vx:Math.cos(_sa3)*_ss3,vy:Math.sin(_sa3)*_ss3-0.8,born:pnow,life:350+Math.random()*350,size:2+Math.random()*6,finish:true,r:_grn?0:180,g:255,b:_grn?Math.floor(80+Math.random()*80):255,rot:Math.random()*Math.PI*2});
                    }
                }
                // Dev skin corner sparks + fire trail for other players
                if(SKINS[op.skin]?.name==='DEV SKIN'&&(op.username||'').toLowerCase()==='nachofrenchfry'&&pnow-(op._devPfx||0)>25){
                    op._devPfx=pnow;
                    const _oda=((op.dir||270)*Math.PI/180),_odc=Math.cos(_oda),_ods=Math.sin(_oda);
                    const _ocx=op.x,_ocy=op.y-10;
                    for(const[_cx,_cy]of[[-37.5,-42],[37.5,-42],[-37.5,42],[37.5,42]]){
                        const _cpx=_ocx+_cx*_odc-_cy*_ods,_cpy=_ocy+_cx*_ods+_cy*_odc;
                        for(let _k=0;_k<2;_k++){
                            const _ca=Math.random()*Math.PI*2,_cs=1.5+Math.random()*3.5;
                            particles.push({wx:_cpx+(Math.random()-0.5)*5,wy:_cpy+(Math.random()-0.5)*5,vx:Math.cos(_ca)*_cs,vy:Math.sin(_ca)*_cs,born:pnow,life:300+Math.random()*300,size:4+Math.random()*7,finish:true,r:80,g:Math.floor(190+Math.random()*55),b:255,rot:Math.random()*Math.PI*2});
                        }
                    }
                    const _obwx=_ocx-42*_ods,_obwy=_ocy+42*_odc;
                    for(let _fi=0;_fi<3;_fi++){
                        const _fSpd=2.5+Math.random()*3;
                        if(Math.random()<0.3){particles.push({wx:_obwx+(Math.random()-0.5)*8,wy:_obwy+(Math.random()-0.5)*8,vx:(-_ods+(Math.random()-0.5)*0.5)*_fSpd,vy:(_odc+(Math.random()-0.5)*0.5)*_fSpd,born:pnow,life:300+Math.random()*200,size:5+Math.random()*5,smoke:true});}
                        else{particles.push({wx:_obwx+(Math.random()-0.5)*6,wy:_obwy+(Math.random()-0.5)*6,vx:(-_ods+(Math.random()-0.5)*0.5)*_fSpd,vy:(_odc+(Math.random()-0.5)*0.5)*_fSpd,born:pnow,life:100+Math.random()*120,size:3+Math.random()*4});}
                    }
                }
                op.pfxPending=[];
            }}
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].update(player.xPos,player.yPos);
            bg.update(player.xPos,player.yPos);

            // Broadcast own position
            {const now=performance.now();
            if(currentUser&&now-lastLobbyBroadcast>50){
                lastLobbyBroadcast=now;
                const _bsT=Math.min((now-boostStretchStart)/500,1);
                const _bsVal=_bsT<1?Math.exp(-3.5*_bsT)*Math.cos(2.2*Math.PI*_bsT):0;
                const _pfxNow=performance.now();
                lobbyChannel?.send({type:'broadcast',event:'pos',payload:{uid:currentUser.id,x:player.xPos+SCREEN_WM,y:player.yPos+SCREEN_HM,dir:player.drawDir,username:currentUsername,skin:selectedSkin,bsx:parseFloat((1-0.35*_bsVal).toFixed(3)),bsy:parseFloat((1+0.45*_bsVal).toFixed(3)),drift:_lobbyDrift,pfx:lobbyPfxQueue.splice(0),sc_rem:secondChanceImmune&&_pfxNow<secondChanceImmunityEnd?Math.round(secondChanceImmunityEnd-_pfxNow):0,sc_total:secondChanceImmunityTotal,spd_rem:_pfxNow<speedTileEnd?Math.round(speedTileEnd-_pfxNow):0,spd_el:_pfxNow<speedTileEnd?Math.round(_pfxNow-speedGlowStart):0}});
            }}

            // Remove stale other players
            {const now=performance.now();
            for(const uid of Object.keys(otherPlayers)){
                if(now-otherPlayers[uid].ts>5000)delete otherPlayers[uid];
            }}

            cullMarginX=Math.max(0,SCREEN_WM*(1/visionScale-1));
            cullMarginY=Math.max(0,SCREEN_HM*(1/visionScale-1));
            ctx.fillStyle='rgb(0,0,0)';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            ctx.save();
            ctx.translate(SCREEN_WM,SCREEN_HM);
            ctx.scale(visionScale,visionScale);
            ctx.translate(-SCREEN_WM,-SCREEN_HM);
            bg.render(ctx,sheet);
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].renderGround(ctx,sheet,false);
            // Checkpoint glow (lobby)
            {const _cgNow=performance.now(),_cgP=0.22+Math.sin(_cgNow*0.004)*0.07;
            for(let _cgi=0;_cgi<TILE_GRID_HEIGHT;_cgi++) for(let _cgj=0;_cgj<TILE_GRID_WIDTH;_cgj++){
                const _cgt=tiles[_cgi][_cgj];
                if(!_cgt.active||_cgt.type!=='CHECKPOINT') continue;
                const _cgh=_cgt.hitbox;
                if(_cgh.x<-_cgh.w-cullMarginX||_cgh.y<-_cgh.h-cullMarginY||_cgh.x>SCREEN_WIDTH+cullMarginX||_cgh.y>SCREEN_HEIGHT+cullMarginY) continue;
                const _cgcx=Math.round(_cgh.x+_cgh.w/2),_cgcy=Math.round(_cgh.y+_cgh.h/2),_cgr=_cgh.w*1.8;
                const _cgrd=ctx.createRadialGradient(_cgcx,_cgcy,2,_cgcx,_cgcy,_cgr);
                _cgrd.addColorStop(0,`rgba(255,200,0,${(_cgP*1.3).toFixed(3)})`);
                _cgrd.addColorStop(0.5,`rgba(255,170,0,${_cgP.toFixed(3)})`);
                _cgrd.addColorStop(1,'rgba(255,140,0,0)');
                ctx.fillStyle=_cgrd;ctx.fillRect(_cgh.x-_cgh.w*0.8,_cgh.y-_cgh.h*0.8,_cgh.w*2.6,_cgh.h*2.6);
            }}
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].renderShadow(ctx);
            {const isWall=t=>t.active&&t.type==="WALL";
            ctx.save();ctx.globalAlpha=50/255;ctx.fillStyle='black';
            for(let i=0;i<TILE_GRID_HEIGHT-1;i++)
                for(let j=0;j<TILE_GRID_WIDTH-1;j++){
                    if(!isWall(tiles[i][j])||!isWall(tiles[i+1][j+1])||isWall(tiles[i][j+1]))continue;
                    const hb=tiles[i][j].hitbox;
                    if(hb.x>-hb.w-cullMarginX&&hb.y>-hb.h-cullMarginY&&hb.x<SCREEN_WIDTH+cullMarginX&&hb.y<SCREEN_HEIGHT+cullMarginY)
                        ctx.fillRect(Math.round(hb.x)+hb.w-10,Math.round(hb.y)+hb.h,10,10);
                }
            ctx.restore();}
            // Kill block radial glow (behind tiles, lobby)
            {const _kgNow=performance.now(),_kgP=0.09+Math.sin(_kgNow*0.004)*0.03;
            for(let _ki=0;_ki<TILE_GRID_HEIGHT;_ki++) for(let _kj=0;_kj<TILE_GRID_WIDTH;_kj++){
                const _ktile=tiles[_ki][_kj];
                if(!_ktile.active||_ktile.type!=='KILL_BLOCK') continue;
                const _kh=_ktile.hitbox;
                if(_kh.x<-_kh.w-cullMarginX||_kh.y<-_kh.h-cullMarginY||_kh.x>SCREEN_WIDTH+cullMarginX||_kh.y>SCREEN_HEIGHT+cullMarginY) continue;
                const _kcx=Math.round(_kh.x+_kh.w/2),_kcy=Math.round(_kh.y+_kh.h/2),_kr=_kh.w*1.8;
                const _grd=ctx.createRadialGradient(_kcx,_kcy,2,_kcx,_kcy,_kr);
                _grd.addColorStop(0,`rgba(255,20,0,${(_kgP*1.4).toFixed(3)})`);
                _grd.addColorStop(0.5,`rgba(255,0,0,${_kgP.toFixed(3)})`);
                _grd.addColorStop(1,'rgba(255,0,0,0)');
                ctx.fillStyle=_grd;ctx.fillRect(_kh.x-_kh.w*0.8,_kh.y-_kh.h*0.8,_kh.w*2.6,_kh.h*2.6);
            }}
            for(let i=0;i<TILE_GRID_HEIGHT;i++)
                for(let j=0;j<TILE_GRID_WIDTH;j++)
                    tiles[i][j].render(ctx,sheet,false);
            // Boost particles
            {const pnow=performance.now();
            particles=particles.filter(p=>pnow-p.born<p.life);
            for(const p of particles){
                const t=(pnow-p.born)/p.life;
                p.wx+=p.vx*dt;p.wy+=p.vy*dt;
                p.vx*=Math.pow(p.ice||p.wall||p.kill?0.80:p.finish?0.88:p.smoke?0.90:0.85,dt);
                p.vy*=Math.pow(p.ice||p.wall||p.kill?0.80:p.finish?0.88:p.smoke?0.90:0.85,dt);
                const sx=p.wx-player.xPos,sy=p.wy-player.yPos;
                if(!showParticles) continue;
                ctx.save();
                if(p.ice||p.wall||p.kill||p.finish){
                    ctx.globalAlpha=Math.pow(1-t,1.5)*0.95;
                    ctx.translate(sx,sy);ctx.rotate(p.rot+t*Math.PI*4);
                    const s=p.size*(1-t*0.3);
                    const br=p.bright??0.5;
                    let r,g,b;
                    if(p.finish){r=p.r;g=p.g;b=p.b;}
                    else if(p.wall){r=Math.floor(140+br*80);g=Math.floor(135+br*75);b=Math.floor(125+br*65);}
                    else if(p.grass){r=Math.floor(30+br*90);g=Math.floor(130+br*110);b=Math.floor(20+br*50);}
                    else{r=Math.floor((15+br*195)*(1-t*0.3));g=Math.floor((60+br*170)*(1-t*0.1));b=255;}
                    ctx.fillStyle=`rgb(${r},${g},${b})`;
                    ctx.fillRect(-s,-s,s*2,s*2);
                }else{
                    ctx.globalAlpha=(1-t)*(p.smoke?0.55:0.85);
                    if(p.smoke){const v=Math.floor(60+t*60);ctx.fillStyle=`rgb(${v},${v},${v})`;}
                    else{const r=255,g=Math.floor(200*(1-t*t)),b=0;ctx.fillStyle=`rgb(${r},${g},${b})`;}
                    const radius=p.size*(1+t*0.6);
                    ctx.beginPath();ctx.arc(sx,sy,radius,0,Math.PI*2);ctx.fill();
                }
                ctx.restore();
            }}
            // Other players
            {const sOff=5,pivY=10,visH=CAR_HEIGHT;
            const _opRenderNow=performance.now();
            for(const[uid,op]of Object.entries(otherPlayers)){
                const sx=op.x-player.xPos;
                const sy=op.y-player.yPos;
                const dir=(op.dir||270)*Math.PI/180;
                const opSk=SKINS[Math.min(op.skin||0,SKINS.length-1)];
                const opW=opSk.sw*SKIN_SCALE,opH=CAR_HEIGHT;
                const bsX=op.bsx||1,bsY=op.bsy||1;
                // Ghost trail for other player
                {const _opSpd=op.drift?.spd||0;
                const _opSpdFade=Math.max(0,Math.min(1,(_opSpd-18)/6));
                for(const g of(op.ghostTrail||[])){
                    if((g.wx-op.x)*(g.wx-op.x)+(g.wy-op.y)*(g.wy-op.y)<28*28) continue;
                    const _gtt=(_opRenderNow-g.born)/g.life;
                    if(_gtt>=1) continue;
                    const _gfi=Math.min(1,(_opRenderNow-g.born)/100);
                    ctx.save();
                    ctx.globalAlpha=Math.max(0,_gfi*(1-_gtt)*0.5*_opSpdFade);
                    ctx.imageSmoothingEnabled=false;
                    ctx.translate(g.wx-player.xPos,g.wy-player.yPos-pivY);
                    ctx.rotate(g.dir*Math.PI/180);
                    ctx.drawImage(carImg,opSk.sx,0,opSk.sw,SKIN_H,-opW/2,-opH/2,opW,opH);
                    ctx.restore();
                }}
                // Second chance glow for other player
                {const _opScRem2=op.sc_rem>0?Math.max(0,op.sc_rem-(_opRenderNow-op.sc_ts)):0;
                if(_opScRem2>0){
                    const _opScEl=op.sc_total-_opScRem2;
                    const _opScF=Math.min(1,_opScEl/400)*Math.min(1,_opScRem2/400);
                    ctx.save();
                    const _opGrd=ctx.createRadialGradient(sx,sy-10,10,sx,sy-10,150);
                    _opGrd.addColorStop(0,`rgba(255,230,0,${(0.38*_opScF).toFixed(2)})`);
                    _opGrd.addColorStop(0.3,`rgba(255,200,0,${(0.22*_opScF).toFixed(2)})`);
                    _opGrd.addColorStop(0.65,`rgba(255,140,0,${(0.12*_opScF).toFixed(2)})`);
                    _opGrd.addColorStop(1,'rgba(255,80,0,0)');
                    ctx.fillStyle=_opGrd;ctx.fillRect(sx-155,sy-165,310,330);
                    ctx.restore();
                }}
                // Speed glow for other player
                {const _opSpdRem2=op.spd_rem>0?Math.max(0,op.spd_rem-(_opRenderNow-op.spd_ts)):0;
                if(_opSpdRem2>0){
                    const _opSel=(op.spd_el||0)+(_opRenderNow-op.spd_ts);
                    const _opSfa=Math.min(1,_opSel/300)*Math.min(1,_opSpdRem2/300);
                    ctx.save();
                    const _opSgrd=ctx.createRadialGradient(sx,sy-10,10,sx,sy-10,150);
                    _opSgrd.addColorStop(0,`rgba(0,255,120,${(0.38*_opSfa).toFixed(2)})`);
                    _opSgrd.addColorStop(0.3,`rgba(0,220,80,${(0.22*_opSfa).toFixed(2)})`);
                    _opSgrd.addColorStop(0.65,`rgba(0,180,60,${(0.12*_opSfa).toFixed(2)})`);
                    _opSgrd.addColorStop(1,'rgba(0,150,40,0)');
                    ctx.fillStyle=_opSgrd;ctx.fillRect(sx-155,sy-165,310,330);
                    ctx.restore();
                }}
                // Shadow
                ctx.save();ctx.globalAlpha=50/255;ctx.filter='brightness(0)';ctx.imageSmoothingEnabled=false;
                ctx.translate(sx-sOff,sy+sOff-pivY);ctx.rotate(dir);ctx.scale(bsX,bsY);
                ctx.drawImage(carImg,opSk.sx,0,opSk.sw,SKIN_H,-opW/2,-opH/2,opW,opH);
                ctx.restore();
                // Car texture
                ctx.save();ctx.imageSmoothingEnabled=false;
                ctx.translate(sx,sy-pivY);ctx.rotate(dir);ctx.scale(bsX,bsY);
                ctx.drawImage(carImg,opSk.sx,0,opSk.sw,SKIN_H,-opW/2,-opH/2,opW,opH);
                ctx.restore();
                // Name label
                if(op.username){
                    const nm=op.username;
                    const nw=nm.length*(4*3+3),padX=8,padY=5;
                    const lx=Math.floor(sx-nw/2-padX),ly=Math.floor(sy-visH/2-pivY-7*3-padY*2-6);
                    ctx.save();ctx.globalAlpha=0.8;ctx.fillStyle='rgb(0,0,0)';
                    ctx.beginPath();ctx.roundRect(lx,ly,nw+padX*2,7*3+padY*2,4);ctx.fill();ctx.restore();
                    renderText(ctx,textSheet,nm,lx+padX,ly+padY,1,255,255,255);
                }
                // Chat bubble above head
                {const nt=Date.now();
                const recent=chatMessages.filter(m=>m.uid===uid&&nt-m.ts<3000);
                if(recent.length>0){
                    const m=recent[recent.length-1];
                    const age=(nt-m.ts)/1000;
                    const alpha=age>2?Math.max(0,1-(age-2)):1;
                    const bText=m.text.slice(0,28);
                    const bw=bText.length*(4*3+3)+16,bh=7*3+10;
                    const bx=Math.floor(sx-bw/2);
                    const nameLy=Math.floor(sy-visH/2-pivY-7*3-5*2-6);
                    const by=nameLy-bh-4;
                    ctx.save();ctx.globalAlpha=alpha*0.92;ctx.fillStyle='#fff';
                    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,5);ctx.fill();ctx.restore();
                    ctx.save();ctx.globalAlpha=alpha;
                    renderText(ctx,textSheet,bText,bx+8,by+5,1,20,20,20);
                    ctx.restore();
                }}
            }}
            // Ghost trail (lobby, world-space)
            {const _lsk=SKINS[Math.min(selectedSkin,SKINS.length-1)];
            const _lrW=_lsk.sw*SKIN_SCALE,_lrH=CAR_HEIGHT,_lpivY=10;
            const _lnow2=performance.now();
            for(const g of ghostTrail){
                const _dx=g.wx-player.xPos,_dy=g.wy-player.yPos;
                if(_dx*_dx+_dy*_dy<28*28) continue;
                const _gt=(_lnow2-g.born)/g.life;
                if(_gt>=1) continue;
                const _fi=Math.min(1,(_lnow2-g.born)/100);
                const _lgsf=Math.max(0,Math.min(1,((g.spd||24)-18)/6));
                ctx.save();
                ctx.globalAlpha=Math.max(0,_fi*(1-_gt)*0.5*_lgsf);
                ctx.imageSmoothingEnabled=false;
                ctx.translate(SCREEN_WM+(g.wx-player.xPos),SCREEN_HM+(g.wy-player.yPos)-_lpivY);
                ctx.rotate(g.dir*Math.PI/180);
                ctx.drawImage(carImg,_lsk.sx,0,_lsk.sw,SKIN_H,-_lrW/2,-_lrH/2,_lrW,_lrH);
                ctx.restore();
            }}
            // Second chance golden aura (lobby local player)
            if(secondChanceImmune&&performance.now()<secondChanceImmunityEnd){
                const _lsNow=performance.now();
                const _lscEl=_lsNow-(secondChanceImmunityEnd-secondChanceImmunityTotal);
                const _lscRem=secondChanceImmunityEnd-_lsNow;
                const _lscF=Math.min(1,_lscEl/400)*Math.min(1,_lscRem/400);
                ctx.save();
                const _lgrd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM-10,10,SCREEN_WM,SCREEN_HM-10,150);
                _lgrd.addColorStop(0,`rgba(255,230,0,${(0.38*_lscF).toFixed(2)})`);
                _lgrd.addColorStop(0.3,`rgba(255,200,0,${(0.22*_lscF).toFixed(2)})`);
                _lgrd.addColorStop(0.65,`rgba(255,140,0,${(0.12*_lscF).toFixed(2)})`);
                _lgrd.addColorStop(1,'rgba(255,80,0,0)');
                ctx.fillStyle=_lgrd;ctx.fillRect(SCREEN_WM-155,SCREEN_HM-165,310,330);
                ctx.restore();
            }
            // Speed tile aura (lobby local player)
            if(performance.now()<speedTileEnd){
                const _lsn=performance.now(),_lsel=_lsn-speedGlowStart,_lsrem=speedTileEnd-_lsn;
                const _lsfa=Math.min(1,_lsel/300)*Math.min(1,_lsrem/300);
                ctx.save();
                const _lsgrd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM-10,10,SCREEN_WM,SCREEN_HM-10,150);
                _lsgrd.addColorStop(0,`rgba(0,255,120,${(0.38*_lsfa).toFixed(2)})`);
                _lsgrd.addColorStop(0.3,`rgba(0,220,80,${(0.22*_lsfa).toFixed(2)})`);
                _lsgrd.addColorStop(0.65,`rgba(0,180,60,${(0.12*_lsfa).toFixed(2)})`);
                _lsgrd.addColorStop(1,'rgba(0,150,40,0)');
                ctx.fillStyle=_lsgrd;ctx.fillRect(SCREEN_WM-155,SCREEN_HM-165,310,330);
                ctx.restore();
            }
            player.render(ctx,carImg,false);
            ctx.restore();
            if(showEdgeGlow&&levelHasKillBlocks){
                const _akNow=performance.now(),_akP=0.18+Math.sin(_akNow*0.003)*0.05;
                const _akGrd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,0,SCREEN_WM,SCREEN_HM,Math.max(SCREEN_WIDTH,SCREEN_HEIGHT)*0.75);
                _akGrd.addColorStop(0,'rgba(255,0,0,0)');
                _akGrd.addColorStop(0.5,`rgba(255,0,0,${(_akP*0.4).toFixed(3)})`);
                _akGrd.addColorStop(1,`rgba(255,0,0,${_akP.toFixed(3)})`);
                ctx.fillStyle=_akGrd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            }

            if(mobileControls&&boostUnlocked){
                const mb=getMobBoostRect();
                const active=boostTouchId!==null;
                ctx.save();ctx.globalAlpha=active?0.7:0.35;
                ctx.fillStyle=active?'rgb(255,180,40)':'rgb(255,255,255)';
                ctx.beginPath();ctx.roundRect(mb.x,mb.y,mb.w,mb.h,20);ctx.fill();ctx.restore();
                const bl='BOOST',blw=bl.length*(4*3+3);
                ctx.save();ctx.globalAlpha=active?1:0.6;
                renderText(ctx,textSheet,bl,Math.floor(mb.x+mb.w/2-blw/2),Math.floor(mb.y+mb.h/2-10),1,0,0,0);
                ctx.restore();
            }

            // Self username label
            if(currentUsername){
                const nm=currentUsername.toUpperCase();
                const nw=nm.length*(4*3+3),padX=8,padY=5;
                const lx=Math.floor(SCREEN_WM-nw/2-padX),ly=Math.floor(SCREEN_HM-CAR_HEIGHT/2-10-7*3-padY*2-6);
                ctx.save();ctx.globalAlpha=0.75;ctx.fillStyle='rgb(0,30,80)';
                ctx.beginPath();ctx.roundRect(lx,ly,nw+padX*2,7*3+padY*2,4);ctx.fill();ctx.restore();
                renderText(ctx,textSheet,nm,lx+padX,ly+padY,1,180,220,255);
                // Own chat bubble above self label
                {const nt=Date.now();
                const recent=chatMessages.filter(m=>m.uid===currentUser?.id&&nt-m.ts<3000);
                if(recent.length>0){
                    const m=recent[recent.length-1];
                    const age=(nt-m.ts)/1000;
                    const alpha=age>2?Math.max(0,1-(age-2)):1;
                    const bText=m.text.slice(0,28);
                    const bw=bText.length*(4*3+3)+16,bh=7*3+10;
                    const bx=Math.floor(SCREEN_WM-bw/2);
                    const by=ly-bh-4;
                    ctx.save();ctx.globalAlpha=alpha*0.92;ctx.fillStyle='#fff';
                    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,5);ctx.fill();ctx.restore();
                    ctx.save();ctx.globalAlpha=alpha;
                    renderText(ctx,textSheet,bText,bx+8,by+5,1,20,20,20);
                    ctx.restore();
                }}
            }
            // HUD cooldown indicators
            {const hn=performance.now();
            const HX=20,HSTEP=68,SC=5;
            const IW=17,IH=12,SW=12,SH=12,GAP=1;
            function cdStateL(endT,total){if(hn>=endT)return 0;return Math.min(20,Math.floor(((endT-hn)/total)*20));}
            function hudSpriteL(y,iconRow,state,stateSheet=cdSheet){
                ctx.drawImage(cdSheet,0,iconRow*IH,IW,IH,HX,y,IW*SC,IH*SC);
                ctx.drawImage(stateSheet,IW+GAP,state*SH,SW,SH,HX+IW*SC,y,SW*SC,SH*SC);
            }
            let ny=20;
            if(boostUnlocked){
                hudSpriteL(ny,0,cdStateL(boostCooldownEnd,boostCooldownTotal));ny+=HSTEP;
                if(doubleChargeUnlocked){for(let s=0;s<boost2CooldownEnds.length;s++){hudSpriteL(ny,1,cdStateL(boost2CooldownEnds[s],boost2CooldownTotals[s]));ny+=HSTEP;}}
            }
            if(turboBrakeUnlocked){hudSpriteL(ny,2,cdStateL(turboBrakeCooldownEnd,turboBrakeCooldownTotal));ny+=HSTEP;}
            if(secondChanceUnlocked){
                if(secondChanceImmune)hudSpriteL(ny,3,cdStateL(secondChanceImmunityEnd,secondChanceImmunityTotal),cdImmuneSheet);
                else hudSpriteL(ny,3,cdStateL(secondChanceCooldownEnd,secondChanceTotalDuration));
            }}
            // Speed tile glow
            if(showEdgeGlow){const _now=performance.now();if(_now<speedTileEnd){
                const _el=_now-speedGlowStart,_rem=speedTileEnd-_now;
                const _fa=Math.min(1,Math.min(_el/300,_rem/300));
                const grd=ctx.createRadialGradient(SCREEN_WM,SCREEN_HM,Math.min(SCREEN_WIDTH,SCREEN_HEIGHT)*0.15,SCREEN_WM,SCREEN_HM,Math.max(SCREEN_WIDTH,SCREEN_HEIGHT)*0.75);
                grd.addColorStop(0,'rgba(0,255,80,0)');
                grd.addColorStop(0.5,`rgba(0,255,80,${(_fa*0.5).toFixed(2)})`);
                grd.addColorStop(1,`rgba(0,255,80,${(_fa*0.9).toFixed(2)})`);
                ctx.fillStyle=grd;ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            }}
            // LOBBY label
            {const lbl='LOBBY',lw=lbl.length*(4*3*2+3);
            ctx.save();ctx.globalAlpha=0.7;
            renderText(ctx,textSheet,lbl,Math.floor(SCREEN_WM-lw/2),10,2,255,255,255);
            ctx.restore();}
            renderButton(ctx,btnSheet,textSheet,4,lobbyBb.bx,lobbyBb.by,lobbyBb.bw,lobbyBb.bh,'');
        } else if(page==='RACE_RESULT'){
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const won=raceResult?.won;
            const outcome=won?'YOU WIN!':'YOU LOSE';
            const outR=won?0:200,outG=won?160:0,outB=0;
            {const ow=outcome.length*(4*3*2+3);
            renderText(ctx,textSheet,outcome,Math.floor(SCREEN_WM-ow/2),SCREEN_HM-160,2,outR,outG,outB);}
            if(raceOpponent){
                const oppLbl='VS '+((raceOpponent.username||'OPPONENT').toUpperCase()),oppW=oppLbl.length*(4*3+3);
                renderText(ctx,textSheet,oppLbl,Math.floor(SCREEN_WM-oppW/2),SCREEN_HM-90,1,60,60,80);
            }
            if(raceMode==='random'&&raceResult){
                const dcDelta=raceResult.dcDelta,tpDelta=raceResult.tpDelta;
                const dcSign=dcDelta>=0?'+':'',tpSign=tpDelta>=0?'+':'';
                const dcStr=dcSign+dcDelta+' DC',tpStr=tpSign+tpDelta+' TP';
                const dcR=dcDelta>=0?0:200,dcG=dcDelta>=0?150:0,dcB=0;
                const tpR=tpDelta>=0?0:200,tpG=tpDelta>=0?150:0,tpB=tpDelta>=0?200:0;
                const dcW=dcStr.length*(4*3*2+3),tpW=tpStr.length*(4*3*2+3);
                renderText(ctx,textSheet,dcStr,Math.floor(SCREEN_WM-dcW/2),SCREEN_HM-20,2,dcR,dcG,dcB);
                renderText(ctx,textSheet,tpStr,Math.floor(SCREEN_WM-tpW/2),SCREEN_HM+40,2,tpR,tpG,tpB);
            } else if(raceMode==='challenge'||raceMode==='duel'){
                const friendMsg=raceMode==='duel'?'DUEL - NO COINS WAGERED':'NO COINS WAGERED IN FRIEND CHALLENGE',fmW=friendMsg.length*(4*3+3);
                renderText(ctx,textSheet,friendMsg,Math.floor(SCREEN_WM-fmW/2),SCREEN_HM-10,1,80,80,100);
            }
            const backW=200,backY=SCREEN_HM+140,backX=Math.floor(SCREEN_WM-backW/2);
            renderTextButton(ctx,btnSheet,textSheet,0,backX,backY,backW,'BACK',0,0,0);
            if(mjp&&inRect(mouseX,mouseY,backX,backY,backW,80)){leaveRaceAll();page='RACE';}

        } else if(page==='LEVEL_NAME'){
            // ── INPUT ──
            const _lnBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,_lnBb.bx,_lnBb.by,_lnBb.bw,_lnBb.bh)){setActiveInput(null);page='CUSTOM_LEVELS';customLevelsTab='my';}
            const _lnFX=Math.floor(SCREEN_WM-280),_lnFY=Math.floor(SCREEN_HM-24),_lnFW=560,_lnFH=56;
            if(mjp&&inRect(mouseX,mouseY,_lnFX,_lnFY,_lnFW,_lnFH))setActiveInput('levelName');
            const _lnCW=200,_lnCY=_lnFY+_lnFH+30,_lnCX=Math.floor(SCREEN_WM-_lnCW/2);
            const _lnCanCreate=inputValues.levelName.trim().length>0;
            if(mjp&&_lnCanCreate&&inRect(mouseX,mouseY,_lnCX,_lnCY,_lnCW,80)){
                editorLevelName=inputValues.levelName.trim();
                inputValues.levelName='';setActiveInput(null);
                if(editorLevelId){
                    const _ri=myLevels.findIndex(l=>l.id===editorLevelId);
                    if(_ri>=0)myLevels[_ri]={...myLevels[_ri],name:editorLevelName};
                    dbRenameCustomLevel(editorLevelId,editorLevelName);
                    page='CUSTOM_LEVELS';customLevelsTab='my';
                } else {
                    editorLevelId=null;initEditor();page='LEVEL_EDITOR';
                }
            }
            // ── RENDER ──
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            renderButton(ctx,btnSheet,textSheet,4,_lnBb.bx,_lnBb.by,_lnBb.bw,_lnBb.bh,'');
            {const _ttl=editorLevelId?'RENAME LEVEL':'NAME YOUR LEVEL',_tw=_ttl.length*(4*3+3);
            renderText(ctx,textSheet,_ttl,Math.floor(SCREEN_WM-_tw/2),_lnFY-60,1,25,25,65);}
            // Input field
            {const _foc=activeInput==='levelName';
            ctx.fillStyle=_foc?'rgb(222,228,248)':'rgb(210,210,216)';
            ctx.strokeStyle=_foc?'rgb(75,108,220)':'rgb(148,148,158)';ctx.lineWidth=2;
            ctx.beginPath();ctx.roundRect(_lnFX,_lnFY,_lnFW,_lnFH,6);ctx.fill();
            ctx.beginPath();ctx.roundRect(_lnFX,_lnFY,_lnFW,_lnFH,6);ctx.stroke();
            if(inputValues.levelName)renderText(ctx,textSheet,inputValues.levelName,_lnFX+14,_lnFY+Math.floor((_lnFH-21)/2),1,18,18,48);
            if(_foc&&Math.floor(performance.now()/530)%2===0){
                const _cpx=_lnFX+14+(inputValues.levelName?inputValues.levelName.length*(4*3+3):0);
                ctx.fillStyle='rgb(55,85,200)';ctx.fillRect(_cpx,_lnFY+Math.floor((_lnFH-21)/2),2,21);}}
            // Create button
            if(!_lnCanCreate){ctx.save();ctx.globalAlpha=0.4;}
            renderTextButton(ctx,btnSheet,textSheet,0,_lnCX,_lnCY,_lnCW,editorLevelId?'RENAME':'CREATE',0,0,0);
            if(!_lnCanCreate)ctx.restore();

        } else if(page==='CUSTOM_LEVELS'){
            // ── INPUT ──
            const _clBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,_clBb.bx,_clBb.by,_clBb.bw,_clBb.bh)){
                contextMenu=null;
                if(customLevelsTab==='my'){customLevelsTab='community';}
                else{page='LEVELS';}
            }
            const _clBarH=64;
            // MY LEVELS button (only shown on community tab)
            const _clMyX=SCREEN_WIDTH-210,_clMyY=Math.floor((_clBarH-44)/2),_clMyW=180,_clMyH=44;
            if(customLevelsTab==='community'&&mjp&&inRect(mouseX,mouseY,_clMyX,_clMyY,_clMyW,_clMyH)){
                contextMenu=null;
                customLevelsTab='my';
                if(!myLevelsLoaded){myLevelsLoaded=true;dbLoadMyLevels();}
            }
            if(customLevelsTab==='my'&&!myLevelsLoaded){myLevelsLoaded=true;dbLoadMyLevels();}
            if(customLevelsTab==='community'&&!communityLevelsLoaded){communityLevelsLoaded=true;dbLoadCommunityLevels();}
            // Card layout constants (shared by both tabs)
            const _clCardW=200,_clCardH=250,_clGap=20;
            const _clCols=Math.floor((SCREEN_WIDTH-40)/(_clCardW+_clGap));
            const _clStartX=Math.floor((SCREEN_WIDTH-_clCols*(_clCardW+_clGap)+_clGap)/2);
            const _clStartY=_clBarH+20;
            const _clContentH=SCREEN_HEIGHT-_clStartY;
            // Scroll clamp
            {const _tc=customLevelsTab==='my'?myLevels.length+1:communityLevels.length;
            const _ms=Math.max(0,Math.ceil(Math.max(1,_tc)/_clCols)*(_clCardH+_clGap)+20-_clContentH);
            if(customLevelsTab==='my')myLevelsScroll=Math.min(myLevelsScroll,_ms);
            else communityLevelsScroll=Math.min(communityLevelsScroll,_ms);}
            const _clScroll=customLevelsTab==='my'?myLevelsScroll:communityLevelsScroll;
            // Plus button (MY LEVELS only)
            const _plusIdx=customLevelsTab==='my'?myLevels.length:-1;
            const _plusRow=_plusIdx>=0?Math.floor(_plusIdx/_clCols):0;
            const _plusCol=_plusIdx>=0?_plusIdx%_clCols:0;
            const _plusX=_clStartX+_plusCol*(_clCardW+_clGap);
            const _plusY=_clStartY+_plusRow*(_clCardH+_clGap)-myLevelsScroll;
            const _overPlus=customLevelsTab==='my'&&inRect(mouseX,mouseY,_plusX,_plusY,_clCardW,_clCardH);
            if(mjp&&_overPlus){inputValues.levelName='';editorLevelId=null;editorLevelName='';setActiveInput('levelName');page='LEVEL_NAME';}
            // Context menu action handling (runs before card clicks)
            const _cmW=180,_cmItemH=40,_cmPad=4;
            let _ctxHandled=false;
            if(contextMenu){
                const _cm=contextMenu;
                const _cmItems=_cm.lv.published?3:2;
                const _cmX=Math.min(_cm.x,SCREEN_WIDTH-_cmW-_cmPad);
                const _cmY=Math.min(_cm.y,SCREEN_HEIGHT-(_cmItemH*_cmItems+_cmPad*2)-_cmPad);
                if(mjp){
                    _ctxHandled=true;
                    if(inRect(mouseX,mouseY,_cmX,_cmY+_cmPad,_cmW,_cmItemH)){
                        // Rename
                        editorLevelId=_cm.lv.id;inputValues.levelName=_cm.lv.name||'';setActiveInput('levelName');contextMenu=null;page='LEVEL_NAME';
                    } else if(_cm.lv.published&&inRect(mouseX,mouseY,_cmX,_cmY+_cmPad+_cmItemH,_cmW,_cmItemH)){
                        // Unpublish
                        dbUnpublishCustomLevel(_cm.lv.id);contextMenu=null;
                    } else if(inRect(mouseX,mouseY,_cmX,_cmY+_cmPad+(_cm.lv.published?2:1)*_cmItemH,_cmW,_cmItemH)){
                        // Delete
                        if(_cm.confirm){dbDeleteCustomLevel(_cm.lv.id);contextMenu=null;}
                        else{contextMenu={..._cm,confirm:true};}
                    } else {contextMenu=null;}
                }
            }
            // MY LEVELS card left-click → open editor
            if(mjp&&!_ctxHandled&&!_overPlus&&customLevelsTab==='my'&&myLevelsLoaded){
                for(let _ci=0;_ci<myLevels.length;_ci++){
                    const _col=_ci%_clCols,_row=Math.floor(_ci/_clCols);
                    const _cx=_clStartX+_col*(_clCardW+_clGap),_cy=_clStartY+_row*(_clCardH+_clGap)-myLevelsScroll;
                    if(inRect(mouseX,mouseY,_cx,_cy,_clCardW,_clCardH)){loadLevelIntoEditor(myLevels[_ci]);contextMenu=null;page='LEVEL_EDITOR';break;}
                }
            }
            // MY LEVELS card right-click → context menu
            if(rmp&&customLevelsTab==='my'&&myLevelsLoaded){
                contextMenu=null;
                for(let _ci=0;_ci<myLevels.length;_ci++){
                    const _col=_ci%_clCols,_row=Math.floor(_ci/_clCols);
                    const _cx=_clStartX+_col*(_clCardW+_clGap),_cy=_clStartY+_row*(_clCardH+_clGap)-myLevelsScroll;
                    if(inRect(mouseX,mouseY,_cx,_cy,_clCardW,_clCardH)){contextMenu={x:mouseX,y:mouseY,lv:myLevels[_ci],confirm:false};break;}
                }
            }
            // COMMUNITY LEVELS card clicks
            if(mjp&&customLevelsTab==='community'&&communityLevelsLoaded){
                for(let _ci=0;_ci<communityLevels.length;_ci++){
                    const _col=_ci%_clCols,_row=Math.floor(_ci/_clCols);
                    const _cx=_clStartX+_col*(_clCardW+_clGap),_cy=_clStartY+_row*(_clCardH+_clGap)-communityLevelsScroll;
                    if(inRect(mouseX,mouseY,_cx,_cy,_clCardW,_clCardH)){
                        selectedCustomLevel=communityLevels[_ci];selectedCustomLevelPB=undefined;
                        loadLevelIntoEditor(selectedCustomLevel);
                        dbLoadCustomLevelPB(selectedCustomLevel.id);
                        dbRefreshLevelGlobalBest(selectedCustomLevel.id);
                        page='CUSTOM_LEVEL_DETAIL';break;
                    }
                }
            }
            // ── RENDER ──
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            // Top bar
            ctx.fillStyle='rgb(188,188,188)';ctx.fillRect(0,0,SCREEN_WIDTH,_clBarH);
            ctx.strokeStyle='rgb(158,158,158)';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(0,_clBarH);ctx.lineTo(SCREEN_WIDTH,_clBarH);ctx.stroke();
            {const _ttl=customLevelsTab==='community'?'Community levels':'My levels',_tw=_ttl.length*(4*3+3);
            renderText(ctx,textSheet,_ttl,Math.floor(SCREEN_WM-_tw/2),Math.floor((_clBarH-21)/2),1,18,18,18);}
            // MY LEVELS button (only on community tab)
            if(customLevelsTab==='community'){
                const _mlHov=inRect(mouseX,mouseY,_clMyX,_clMyY,_clMyW,_clMyH);
                ctx.fillStyle=_mlHov?'rgb(192,208,240)':'rgb(200,210,228)';
                ctx.strokeStyle=_mlHov?'rgb(95,138,210)':'rgb(148,163,200)';ctx.lineWidth=_mlHov?2:1;
                ctx.beginPath();ctx.roundRect(_clMyX,_clMyY,_clMyW,_clMyH,6);ctx.fill();
                ctx.beginPath();ctx.roundRect(_clMyX,_clMyY,_clMyW,_clMyH,6);ctx.stroke();
                const _ml='My levels',_mw=_ml.length*(4*3+3);
                renderText(ctx,textSheet,_ml,_clMyX+Math.floor((_clMyW-_mw)/2),_clMyY+Math.floor((_clMyH-21)/2),1,_mlHov?15:35,_mlHov?45:50,_mlHov?170:138);
            }
            // Main content (clipped)
            ctx.save();ctx.beginPath();ctx.rect(0,_clBarH,SCREEN_WIDTH,SCREEN_HEIGHT-_clBarH);ctx.clip();
            const _mmColors=['','#505060','#96dcff','rgb(95,160,38)','#ff6450','#3c3c46','#dc3232','#0f0520','#ffdc32','#ffb432','#ffa032','#ffc832','rgb(95,160,38)','#32dcdc'];
            if(customLevelsTab==='community'){
                if(!communityLevelsLoaded){
                    const _ll='Loading...',_lw=_ll.length*(4*3+3);
                    renderText(ctx,textSheet,_ll,Math.floor(SCREEN_WM-_lw/2),Math.floor(SCREEN_HM),1,80,80,80);
                } else if(communityLevels.length===0){
                    const _cl='No published levels yet',_cw=_cl.length*(4*3+3);
                    renderText(ctx,textSheet,_cl,Math.floor(SCREEN_WM-_cw/2),Math.floor(SCREEN_HM),1,90,90,90);
                } else {
                    for(let _ci=0;_ci<communityLevels.length;_ci++){
                        const _lv=communityLevels[_ci];
                        const _col=_ci%_clCols,_row=Math.floor(_ci/_clCols);
                        const _cx=_clStartX+_col*(_clCardW+_clGap),_cy=_clStartY+_row*(_clCardH+_clGap)-communityLevelsScroll;
                        if(_cy+_clCardH<_clBarH||_cy>SCREEN_HEIGHT)continue;
                        const _hover=inRect(mouseX,mouseY,_cx,_cy,_clCardW,_clCardH);
                        ctx.fillStyle=_hover?'rgb(235,235,238)':'rgb(220,220,224)';ctx.strokeStyle=_hover?'rgb(115,128,182)':'rgb(175,175,180)';ctx.lineWidth=1;
                        ctx.beginPath();ctx.roundRect(_cx,_cy,_clCardW,_clCardH,8);ctx.fill();
                        ctx.beginPath();ctx.roundRect(_cx,_cy,_clCardW,_clCardH,8);ctx.stroke();
                        const _mmPad=10,_mmW=_clCardW-_mmPad*2,_mmH=_mmW,_mmX=_cx+_mmPad,_mmY=_cy+_mmPad;
                        ctx.fillStyle=_lv.background===2?'rgb(10,5,20)':'rgb(95,160,38)';ctx.fillRect(_mmX,_mmY,_mmW,_mmH);
                        const _tSz=_mmW/100,_tSzR=Math.max(1,Math.round(_tSz));
                        if(_lv.grid&&_lv.grid.length)for(const [_tr,_tc,_tv] of _lv.grid){
                            if(_tv>=1&&_tv<=13){ctx.fillStyle=_mmColors[_tv];ctx.fillRect(Math.round(_mmX+_tc*_tSz),Math.round(_mmY+_tr*_tSz),_tSzR,_tSzR);}}
                        if(_lv.spawn_row!=null){ctx.fillStyle='#64ff64';ctx.fillRect(_mmX+_lv.spawn_col*_tSz,_mmY+_lv.spawn_row*_tSz,Math.max(2,_tSz*2),Math.max(2,_tSz*2));}
                        const _nm=_lv.name||'Unnamed';
                        ctx.save();ctx.beginPath();ctx.rect(_cx+8,_mmY+_mmH+6,_clCardW-16,24);ctx.clip();
                        renderText(ctx,textSheet,_nm,_cx+8,_mmY+_mmH+6,1,18,18,40);ctx.restore();
                        if(_lv.creator_name){const _maxCr=_clCardW-16,_pw=s=>s.split('').reduce((a,c)=>a+(c==='M'||c==='W'||c==='m'||c==='w'||c==='V'||c==='v'?18:15),0);
                            let _un=_lv.creator_name||'';if(_pw('by '+_un)>_maxCr){while(_un.length>0&&_pw('by '+_un+'...')>_maxCr)_un=_un.slice(0,-1);_un+='...';}
                            ctx.save();ctx.beginPath();ctx.rect(_cx+8,_mmY+_mmH+28,_maxCr,30);ctx.clip();
                            renderText(ctx,textSheet,'by '+_un,_cx+8,_mmY+_mmH+28,1,48,68,105);ctx.restore();}
                    }
                }
            } else if(!myLevelsLoaded){
                const _ll='LOADING...',_lw=_ll.length*(4*3+3);
                renderText(ctx,textSheet,_ll,Math.floor(SCREEN_WM-_lw/2),Math.floor(SCREEN_HM),1,80,80,80);
            } else {
                // MY LEVELS cards
                for(let _ci=0;_ci<myLevels.length;_ci++){
                    const _lv=myLevels[_ci];
                    const _col=_ci%_clCols,_row=Math.floor(_ci/_clCols);
                    const _cx=_clStartX+_col*(_clCardW+_clGap),_cy=_clStartY+_row*(_clCardH+_clGap)-myLevelsScroll;
                    if(_cy+_clCardH<_clBarH||_cy>SCREEN_HEIGHT)continue;
                    const _hover=inRect(mouseX,mouseY,_cx,_cy,_clCardW,_clCardH);
                    const _ctxActive=contextMenu&&contextMenu.lv&&contextMenu.lv.id===_lv.id;
                    ctx.fillStyle=_ctxActive?'rgb(212,218,240)':_hover?'rgb(235,235,238)':'rgb(220,220,224)';
                    ctx.strokeStyle=_ctxActive?'rgb(88,108,205)':_hover?'rgb(115,128,182)':'rgb(175,175,180)';ctx.lineWidth=_ctxActive||_hover?2:1;
                    ctx.beginPath();ctx.roundRect(_cx,_cy,_clCardW,_clCardH,8);ctx.fill();
                    ctx.beginPath();ctx.roundRect(_cx,_cy,_clCardW,_clCardH,8);ctx.stroke();
                    // Minimap
                    const _mmPad=10,_mmW=_clCardW-_mmPad*2,_mmH=_mmW,_mmX=_cx+_mmPad,_mmY=_cy+_mmPad;
                    ctx.fillStyle=_lv.background===2?'rgb(10,5,20)':'rgb(95,160,38)';ctx.fillRect(_mmX,_mmY,_mmW,_mmH);
                    const _tSz=_mmW/100,_tSzR=Math.max(1,Math.round(_tSz));
                    if(_lv.grid&&_lv.grid.length)for(const [_tr,_tc,_tv] of _lv.grid){
                        if(_tv>=1&&_tv<=13){ctx.fillStyle=_mmColors[_tv];ctx.fillRect(Math.round(_mmX+_tc*_tSz),Math.round(_mmY+_tr*_tSz),_tSzR,_tSzR);}}
                    if(_lv.spawn_row!=null){ctx.fillStyle='#64ff64';ctx.fillRect(_mmX+_lv.spawn_col*_tSz,_mmY+_lv.spawn_row*_tSz,Math.max(2,_tSz*2),Math.max(2,_tSz*2));}
                    {const _badgeTxt=_lv.published?'Published':'Draft';
                    const _badgePx=_badgeTxt.length*(4*3+3);
                    ctx.save();ctx.globalAlpha=0.88;
                    ctx.fillStyle=_lv.published?'rgb(20,125,48)':'rgb(148,100,12)';
                    ctx.beginPath();ctx.roundRect(_mmX,_mmY+2,_badgePx+12,27,4);ctx.fill();ctx.restore();
                    renderText(ctx,textSheet,_badgeTxt,_mmX+6,_mmY+5,1,_lv.published?210:255,_lv.published?255:225,_lv.published?220:115);}
                    const _nm=_lv.name||'Unnamed';
                    ctx.save();ctx.beginPath();ctx.rect(_cx+8,_mmY+_mmH+6,_clCardW-16,24);ctx.clip();
                    renderText(ctx,textSheet,_nm,_cx+8,_mmY+_mmH+6,1,18,18,40);ctx.restore();
                    if(_lv.best_time!=null){const _bt=_lv.best_time.toFixed(2)+'s',_bw=_bt.length*(4*3+3);
                        renderText(ctx,textSheet,_bt,_cx+_clCardW-_bw-8,_mmY+_mmH+28,1,15,92,192);}
                }
                // Plus button card
                ctx.fillStyle=_overPlus?'rgb(210,218,240)':'rgb(200,200,206)';
                ctx.strokeStyle=_overPlus?'rgb(100,135,208)':'rgb(155,155,165)';ctx.lineWidth=_overPlus?2:1;
                ctx.beginPath();ctx.roundRect(_plusX,_plusY,_clCardW,_clCardH,8);ctx.fill();
                ctx.beginPath();ctx.roundRect(_plusX,_plusY,_clCardW,_clCardH,8);ctx.stroke();
                const _pcx=_plusX+_clCardW/2,_pcy=_plusY+_clCardH/2;
                ctx.strokeStyle=_overPlus?'rgb(68,95,188)':'rgb(115,115,128)';ctx.lineWidth=4;
                ctx.beginPath();ctx.moveTo(_pcx-22,_pcy);ctx.lineTo(_pcx+22,_pcy);ctx.stroke();
                ctx.beginPath();ctx.moveTo(_pcx,_pcy-22);ctx.lineTo(_pcx,_pcy+22);ctx.stroke();
                if(_overPlus){const _tl='CREATE NEW LEVEL',_tw=_tl.length*(4*3+3);
                    const _ttAbove=_plusY-34>=_clBarH+4;
                    const _ttBY=_ttAbove?_plusY-34:_plusY+_clCardH+8;
                    const _ttTY=_ttAbove?_plusY-28:_plusY+_clCardH+14;
                    ctx.save();ctx.globalAlpha=0.92;ctx.fillStyle='rgb(208,215,235)';
                    ctx.beginPath();ctx.roundRect(_plusX+Math.floor((_clCardW-_tw-16)/2),_ttBY,_tw+16,28,6);ctx.fill();ctx.restore();
                    renderText(ctx,textSheet,_tl,_plusX+Math.floor((_clCardW-_tw)/2),_ttTY,1,18,42,155);}
            }
            ctx.restore();
            renderButton(ctx,btnSheet,textSheet,4,_clBb.bx,_clBb.by,_clBb.bw,_clBb.bh,'');
            // Context menu overlay
            if(contextMenu&&customLevelsTab==='my'){
                const _cm=contextMenu;
                const _cmItems=_cm.lv.published?3:2;
                const _cmX=Math.min(_cm.x,SCREEN_WIDTH-_cmW-_cmPad);
                const _cmY=Math.min(_cm.y,SCREEN_HEIGHT-(_cmItemH*_cmItems+_cmPad*2)-_cmPad);
                const _cmH=_cmItemH*_cmItems+_cmPad*2;
                // Shadow
                ctx.save();ctx.globalAlpha=0.18;ctx.fillStyle='rgb(0,0,0)';
                ctx.beginPath();ctx.roundRect(_cmX+3,_cmY+3,_cmW,_cmH,8);ctx.fill();ctx.restore();
                // Background
                ctx.fillStyle='rgb(232,232,236)';ctx.strokeStyle='rgb(168,168,178)';ctx.lineWidth=1;
                ctx.beginPath();ctx.roundRect(_cmX,_cmY,_cmW,_cmH,8);ctx.fill();
                ctx.beginPath();ctx.roundRect(_cmX,_cmY,_cmW,_cmH,8);ctx.stroke();
                // RENAME option
                const _renHov=inRect(mouseX,mouseY,_cmX,_cmY+_cmPad,_cmW,_cmItemH);
                if(_renHov){ctx.fillStyle='rgb(205,215,242)';ctx.beginPath();ctx.roundRect(_cmX+3,_cmY+_cmPad,_cmW-6,_cmItemH,5);ctx.fill();}
                const _rt='RENAME',_rw=_rt.length*(4*3+3);
                renderText(ctx,textSheet,_rt,_cmX+Math.floor((_cmW-_rw)/2),_cmY+_cmPad+Math.floor((_cmItemH-21)/2),1,_renHov?12:52,_renHov?42:68,_renHov?172:152);
                // Divider after Rename
                ctx.strokeStyle='rgb(188,188,198)';ctx.lineWidth=1;
                ctx.beginPath();ctx.moveTo(_cmX+8,_cmY+_cmPad+_cmItemH);ctx.lineTo(_cmX+_cmW-8,_cmY+_cmPad+_cmItemH);ctx.stroke();
                if(_cm.lv.published){
                    // UNPUBLISH option
                    const _unpY=_cmY+_cmPad+_cmItemH;
                    const _unpHov=inRect(mouseX,mouseY,_cmX,_unpY,_cmW,_cmItemH);
                    if(_unpHov){ctx.fillStyle='rgb(215,235,205)';ctx.beginPath();ctx.roundRect(_cmX+3,_unpY,_cmW-6,_cmItemH,5);ctx.fill();}
                    const _ut='UNPUBLISH',_uw=_ut.length*(4*3+3);
                    renderText(ctx,textSheet,_ut,_cmX+Math.floor((_cmW-_uw)/2),_unpY+Math.floor((_cmItemH-21)/2),1,_unpHov?28:52,_unpHov?88:68,_unpHov?28:52);
                    // Divider after Unpublish
                    ctx.beginPath();ctx.moveTo(_cmX+8,_unpY+_cmItemH);ctx.lineTo(_cmX+_cmW-8,_unpY+_cmItemH);ctx.stroke();
                }
                // DELETE option
                const _delY2=_cmY+_cmPad+(_cm.lv.published?2:1)*_cmItemH;
                const _delHov=inRect(mouseX,mouseY,_cmX,_delY2,_cmW,_cmItemH);
                const _conf=_cm.confirm;
                if(_delHov||_conf){ctx.fillStyle=_conf?'rgb(228,195,195)':'rgb(238,212,212)';ctx.beginPath();ctx.roundRect(_cmX+3,_delY2,_cmW-6,_cmItemH,5);ctx.fill();}
                const _dt=_conf?'CONFIRM?':'DELETE',_dw=_dt.length*(4*3+3);
                renderText(ctx,textSheet,_dt,_cmX+Math.floor((_cmW-_dw)/2),_delY2+Math.floor((_cmItemH-21)/2),1,_conf?148:168,_conf?18:28,_conf?18:28);
            }

        } else if(page==='CUSTOM_LEVEL_DETAIL'){
            const _cldBb=getBackBtn();
            const lv=selectedCustomLevel;
            // PLAY button
            const _playW=300,_playH=80,_playX=Math.floor(SCREEN_WM+40+(SCREEN_WIDTH-SCREEN_WM-80)/2-_playW/2);
            const _playY=Math.floor(SCREEN_HM+80);
            if(mjp&&inRect(mouseX,mouseY,_cldBb.bx,_cldBb.by,_cldBb.bw,_cldBb.bh)){page='CUSTOM_LEVELS';}
            if(mjp&&lv&&inRect(mouseX,mouseY,_playX,_playY,_playW,_playH)){playCommunityLevel();}
            // EDIT button (own level only)
            const _isOwn=lv&&currentUser&&lv.user_id===currentUser.id;
            const _editW=200,_editH=60,_editX=Math.floor(SCREEN_WM+40+(SCREEN_WIDTH-SCREEN_WM-80)/2-_editW/2);
            const _editY=_playY+_playH+20;
            if(mjp&&_isOwn&&inRect(mouseX,mouseY,_editX,_editY,_editW,_editH)){loadLevelIntoEditor(lv);page='LEVEL_EDITOR';}
            // ── RENDER ──
            ctx.fillStyle='#d0d0d0';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            if(lv){
                // Left: minimap
                const _mmSz=Math.min(SCREEN_WM-80,SCREEN_HEIGHT-120);
                const _mmX=Math.floor(SCREEN_WM/2-_mmSz/2),_mmY=Math.floor(SCREEN_HM-_mmSz/2);
                const _mmColors2=['','#505060','#96dcff','rgb(95,160,38)','#ff6450','#3c3c46','#dc3232','#0f0520','#ffdc32','#ffb432','#ffa032','#ffc832','rgb(95,160,38)','#32dcdc'];
                ctx.fillStyle=lv.background===2?'rgb(10,5,20)':'rgb(95,160,38)';ctx.fillRect(_mmX,_mmY,_mmSz,_mmSz);
                ctx.strokeStyle='rgb(145,145,152)';ctx.lineWidth=2;ctx.strokeRect(_mmX,_mmY,_mmSz,_mmSz);
                const _tSz2=_mmSz/100,_tSz2R=Math.max(1,Math.round(_tSz2));
                if(lv.grid&&lv.grid.length)for(const [_tr,_tc,_tv] of lv.grid){
                    if(_tv>=1&&_tv<=13){ctx.fillStyle=_mmColors2[_tv];ctx.fillRect(Math.round(_mmX+_tc*_tSz2),Math.round(_mmY+_tr*_tSz2),_tSz2R,_tSz2R);}}
                if(lv.spawn_row!=null){ctx.fillStyle='#64ff64';ctx.fillRect(_mmX+lv.spawn_col*_tSz2,_mmY+lv.spawn_row*_tSz2,Math.max(3,_tSz2*2),Math.max(3,_tSz2*2));}
                // Right: info panel
                const _rpX=SCREEN_WM+40;
                // Level name
                const _lnTxt=lv.name||'Unnamed';
                const _lnSz=2,_lnW=_lnTxt.length*(4*_lnSz*3+3);
                renderText(ctx,textSheet,_lnTxt,_rpX,SCREEN_HM-220,_lnSz,12,12,48);
                // By creator
                if(lv.creator_name){renderText(ctx,textSheet,'by '+lv.creator_name,_rpX,SCREEN_HM-170,1,45,65,95);}
                // Divider
                ctx.strokeStyle='rgb(152,152,162)';ctx.lineWidth=1;
                ctx.beginPath();ctx.moveTo(_rpX,SCREEN_HM-140);ctx.lineTo(SCREEN_WIDTH-40,SCREEN_HM-140);ctx.stroke();
                // Personal best
                renderText(ctx,textSheet,'Personal best',_rpX,SCREEN_HM-120,1,55,55,78);
                const _pbTxt=selectedCustomLevelPB===undefined?'Loading...':(selectedCustomLevelPB==null?'n/a':(selectedCustomLevelPB.toFixed(2)+'s'));
                const _pbCol=selectedCustomLevelPB!=null&&selectedCustomLevelPB!==undefined;
                renderText(ctx,textSheet,_pbTxt,_rpX,SCREEN_HM-90,2,_pbCol?12:95,_pbCol?88:95,_pbCol?192:105);
                // Global best
                renderText(ctx,textSheet,'Global best',_rpX,SCREEN_HM-30,1,55,55,78);
                const _gbTxt=lv.global_best_time!=null?(lv.global_best_time.toFixed(2)+'s'):'n/a';
                const _gbCol=lv.global_best_time!=null;
                renderText(ctx,textSheet,_gbTxt,_rpX,SCREEN_HM,2,_gbCol?148:95,_gbCol?88:95,_gbCol?8:105);
                // Play button
                renderTextButton(ctx,redBtnSheet,textSheet,16,_playX,_playY,_playW,'Play',0,0,0);
                // Edit button (own level)
                if(_isOwn){
                    ctx.fillStyle='rgb(198,210,234)';ctx.strokeStyle='rgb(122,150,208)';ctx.lineWidth=1;
                    ctx.beginPath();ctx.roundRect(_editX,_editY,_editW,_editH,6);ctx.fill();ctx.stroke();
                    const _etxt='Edit',_ew=_etxt.length*(4*3+3);
                    renderText(ctx,textSheet,_etxt,_editX+Math.floor((_editW-_ew)/2),_editY+Math.floor((_editH-21)/2),1,32,62,178);}
            }
            renderButton(ctx,btnSheet,textSheet,4,_cldBb.bx,_cldBb.by,_cldBb.bw,_cldBb.bh,'');

        } else if(page==='LEVEL_EDITOR'){
            const _edAreaW=SCREEN_WIDTH-EDITOR_SIDEBAR_W;
            const _edSideX=_edAreaW;
            const EDITOR_PALETTE=[
                {v:0,name:'ERASE',sx:-1,sy:-1,col:'rgb(55,55,60)'},{v:99,name:'SPAWN',sx:-1,sy:-1,col:'rgb(100,255,100)'},
                {v:2,name:'ICE',sx:102,sy:0},{v:1,name:'WALL',sx:0,sy:0},
                {v:4,name:'END',sx:136,sy:17},
                {v:5,name:'START WALL',sx:0,sy:0},{v:6,name:'KILL BLOCK',sx:153,sy:0},
                {v:7,name:'VOID',sx:153,sy:17},{v:12,name:'GRASS',sx:119,sy:0},
                {v:8,name:'SPEED UP',sx:170,sy:0},{v:9,name:'SPEED LEFT',sx:170,sy:17},
                {v:10,name:'SPEED DOWN',sx:170,sy:34},{v:11,name:'SPEED RIGHT',sx:170,sy:51},
                {v:13,name:'CHECKPOINT',sx:187,sy:0}
            ];
            // Arrow key panning
            const _panSpeed=Math.max(editorZoom*0.3,6)*dt;
            if(editorKeyLeft)editorCamX=Math.round(editorCamX+_panSpeed);
            if(editorKeyRight)editorCamX=Math.round(editorCamX-_panSpeed);
            if(editorKeyUp)editorCamY=Math.round(editorCamY+_panSpeed);
            if(editorKeyDown)editorCamY=Math.round(editorCamY-_panSpeed);
            // Try/Publish button positions (defined early to block accidental grid paints)
            const _edTryW=260,_edTryH=80,_edTryX=Math.floor(_edAreaW/2-270),_edTryY=SCREEN_HEIGHT-_edTryH-20;
            const _edPubW=240,_edPubH=80,_edPubX=_edTryX+_edTryW+20,_edPubY=_edTryY;
            // Grid cell under mouse
            const _edInGrid=mouseX>=0&&mouseX<_edAreaW&&mouseY>=0&&mouseY<SCREEN_HEIGHT;
            const _edOverTry=inRect(mouseX,mouseY,_edTryX,_edTryY,_edTryW,_edTryH);
            const _edOverPub=inRect(mouseX,mouseY,_edPubX,_edPubY,_edPubW,_edPubH);
            const _gc=_edInGrid?Math.floor((mouseX-editorCamX)/editorZoom):-1;
            const _gr=_edInGrid?Math.floor((mouseY-editorCamY)/editorZoom):-1;
            const _validCell=_gc>=0&&_gc<TILE_GRID_WIDTH&&_gr>=0&&_gr<TILE_GRID_HEIGHT;
            // Input: DRAW mode
            if(editorDrawMode==='draw'){
                if(mouseDown&&_edInGrid&&!_edOverTry&&!_edOverPub){
                    if(mjp){editorSnapshot();editorPaintValue=editorSelectedTile;editorLastPaintRow=null;editorLastPaintCol=null;}
                    if(_validCell){
                        // Bresenham from last painted cell to fill gaps when mouse moves fast
                        const _pts=[];
                        if(editorLastPaintRow!==null){
                            let _lr=editorLastPaintRow,_lc=editorLastPaintCol;
                            const _dr=Math.abs(_gr-_lr),_dc=Math.abs(_gc-_lc);
                            const _sr=_lr<_gr?1:-1,_sc=_lc<_gc?1:-1;
                            let _le=_dr-_dc;
                            while(true){_pts.push([_lr,_lc]);if(_lr===_gr&&_lc===_gc)break;const _e2=2*_le;if(_e2>-_dc){_le-=_dc;_lr+=_sr;}if(_e2<_dr){_le+=_dr;_lc+=_sc;}}
                        } else _pts.push([_gr,_gc]);
                        editorLastPaintRow=_gr;editorLastPaintCol=_gc;
                        for(const [_pr,_pc] of _pts){
                            if(editorPaintValue===99){editorSpawnRow=_pr;editorSpawnCol=_pc;}
                            else{editorGrid[_pr][_pc]=editorPaintValue;
                                if(editorPaintValue===0&&editorSpawnRow===_pr&&editorSpawnCol===_pc){editorSpawnRow=null;editorSpawnCol=null;}}
                        }
                    }
                } else {editorLastPaintRow=null;editorLastPaintCol=null;}
            }
            // Input: FILL mode
            if(editorDrawMode==='fill'){
                if(mjp&&_validCell&&!_edOverTry&&!_edOverPub){
                    editorSnapshot();
                    if(editorSelectedTile===99){editorSpawnRow=_gr;editorSpawnCol=_gc;}
                    else{
                        const _fv=editorSelectedTile,_tv=editorGrid[_gr][_gc];
                        if(_fv!==_tv){
                            const _fq=[[_gr,_gc]],_fvis=new Set([_gr+','+_gc]);
                            while(_fq.length){
                                const [_fr,_fc]=_fq.shift();
                                editorGrid[_fr][_fc]=_fv;
                                if(_fv===0&&editorSpawnRow===_fr&&editorSpawnCol===_fc){editorSpawnRow=null;editorSpawnCol=null;}
                                for(const[_nr,_nc] of [[_fr-1,_fc],[_fr+1,_fc],[_fr,_fc-1],[_fr,_fc+1]]){
                                    if(_nr<0||_nr>=TILE_GRID_HEIGHT||_nc<0||_nc>=TILE_GRID_WIDTH)continue;
                                    const _k=_nr+','+_nc;
                                    if(_fvis.has(_k)||editorGrid[_nr][_nc]!==_tv)continue;
                                    _fvis.add(_k);_fq.push([_nr,_nc]);
                                }
                            }
                        }
                    }
                }
            }
            // Input: LINE mode
            if(editorDrawMode==='line'){
                if(mjp&&_validCell&&!_edOverTry&&!_edOverPub){editorSnapshot();editorLineStartRow=_gr;editorLineStartCol=_gc;}
                if(mjr&&editorLineStartRow!==null){
                    if(_validCell){
                        let _lr=editorLineStartRow,_lc=editorLineStartCol;
                        const _dr=Math.abs(_gr-_lr),_dc=Math.abs(_gc-_lc);
                        const _sr=_lr<_gr?1:-1,_sc=_lc<_gc?1:-1;
                        let _le=_dr-_dc;
                        while(true){
                            if(editorSelectedTile===99){editorSpawnRow=_lr;editorSpawnCol=_lc;}
                            else{editorGrid[_lr][_lc]=editorSelectedTile;
                                if(editorSelectedTile===0&&editorSpawnRow===_lr&&editorSpawnCol===_lc){editorSpawnRow=null;editorSpawnCol=null;}}
                            if(_lr===_gr&&_lc===_gc)break;
                            const _e2=2*_le;
                            if(_e2>-_dc){_le-=_dc;_lr+=_sr;}
                            if(_e2<_dr){_le+=_dr;_lc+=_sc;}
                        }
                    }
                    editorLineStartRow=null;editorLineStartCol=null;
                }
            }
            // Sidebar layout constants
            const _palPad=6,_palAreaY=94,_palItemH=80,_palAreaH=SCREEN_HEIGHT-_palAreaY-100;
            const _maxPalScroll=Math.max(0,EDITOR_PALETTE.length*_palItemH-_palAreaH);
            editorPalScroll=Math.min(editorPalScroll,_maxPalScroll);
            // Background toggle (very top of sidebar)
            const _edBgBtnY=4,_edBgBtnH=52;
            if(mjp&&mouseX>=_edSideX+_palPad&&mouseX<SCREEN_WIDTH-_palPad&&mouseY>=_edBgBtnY&&mouseY<_edBgBtnY+_edBgBtnH)
                editorBackground=editorBackground===1?2:1;
            // Tile selection (scrollable)
            for(let _pi=0;_pi<EDITOR_PALETTE.length;_pi++){
                const _iy=_palAreaY+_pi*_palItemH-editorPalScroll;
                if(_iy+_palItemH-2<_palAreaY||_iy>_palAreaY+_palAreaH)continue;
                const _cy1=Math.max(_iy,_palAreaY),_cy2=Math.min(_iy+_palItemH-2,_palAreaY+_palAreaH);
                if(mjp&&mouseX>=_edSideX+_palPad&&mouseX<SCREEN_WIDTH-_palPad&&mouseY>=_cy1&&mouseY<_cy2)
                    editorSelectedTile=EDITOR_PALETTE[_pi].v;
            }
            // Draw mode section (bottom of sidebar - always visible, not scrollable)
            const _dmSectionY=SCREEN_HEIGHT-100,_dmLabelY=_dmSectionY+6,_edModeBtnY=_dmLabelY+28,_edModeBtnH=40;
            const _edModeBtnW=Math.floor((EDITOR_SIDEBAR_W-_palPad*2-4)/3);
            const _edModes=['draw','fill','line'];
            for(let _mi=0;_mi<3;_mi++){
                const _mbx=_edSideX+_palPad+_mi*(_edModeBtnW+2);
                if(mjp&&mouseX>=_mbx&&mouseX<_mbx+_edModeBtnW&&mouseY>=_edModeBtnY&&mouseY<_edModeBtnY+_edModeBtnH){
                    editorDrawMode=_edModes[_mi];
                    if(editorDrawMode!=='line')editorLineStartRow=null;
                }
            }
            // Back button + Try Level + Publish buttons
            const _edBb=getBackBtn();
            if(mjp&&inRect(mouseX,mouseY,_edBb.bx,_edBb.by,_edBb.bw,_edBb.bh)){
                editorLineStartRow=null;
                if(currentUser){
                    dbSaveCustomLevel(editorLevelPublished,null).then(()=>{myLevelsLoaded=false;});
                }
                page='CUSTOM_LEVELS';customLevelsTab='my';
            }
            const _canTry=editorSpawnRow!==null;
            const _hasEnd=editorGrid?editorGrid.some(row=>row.includes(4)):false;
            const _canPublish=_canTry&&_hasEnd&&!!currentUser;
            if(mjp&&_canTry&&inRect(mouseX,mouseY,_edTryX,_edTryY,_edTryW,_edTryH))tryEditorLevel();
            if(mjp&&_canPublish&&_edOverPub){editorPublishing=true;tryEditorLevel();}

            // ── RENDER ──
            ctx.fillStyle=editorBackground===1?'rgb(55,90,25)':'rgb(10,5,20)';
            ctx.fillRect(0,0,_edAreaW,SCREEN_HEIGHT);
            // Tile spritesheet coords indexed by v-1 (v=1..13)
            const _TSX=[0,102,136,136,0,153,153,170,170,170,170,119,187];
            const _TSY=[0,0,0,17,0,0,17,0,17,34,51,0,0];
            // Wall connection sprite: same logic as Tile.computeWallSprite, reading editorGrid directly
            const _edWallSprite=(r,c)=>{
                const W=(r2,c2)=>r2>=0&&r2<TILE_GRID_HEIGHT&&c2>=0&&c2<TILE_GRID_WIDTH&&(editorGrid[r2][c2]===1||editorGrid[r2][c2]===5);
                const u=W(r-1,c),d=W(r+1,c),l=W(r,c-1),rr=W(r,c+1);
                const UL=W(r-1,c-1),UR=W(r-1,c+1),DL=W(r+1,c-1),DR=W(r+1,c+1);
                let tn=1,tt=1,rot=0;
                if(!u&&!d&&!l&&!rr){tn=1;tt=1;rot=0;}
                else if(!u&&!d&&!l&& rr){tn=2;tt=1;rot=0;}
                else if(!u&&!d&& l&&!rr){tn=2;tt=1;rot=2;}
                else if(!u&& d&&!l&&!rr){tn=2;tt=1;rot=1;}
                else if( u&&!d&&!l&&!rr){tn=2;tt=1;rot=3;}
                else if( u&&!d&&!l&& rr&& UR){tn=3;tt=1;rot=0;}
                else if(!u&& d&&!l&& rr&& DR){tn=3;tt=1;rot=1;}
                else if(!u&& d&& l&&!rr&& DL){tn=3;tt=1;rot=2;}
                else if( u&&!d&& l&&!rr&& UL){tn=3;tt=1;rot=3;}
                else if( u&&!d&&!l&& rr&&!UR){tn=3;tt=2;rot=0;}
                else if(!u&& d&&!l&& rr&&!DR){tn=3;tt=2;rot=1;}
                else if(!u&& d&& l&&!rr&&!DL){tn=3;tt=2;rot=2;}
                else if( u&&!d&& l&&!rr&&!UL){tn=3;tt=2;rot=3;}
                else if(!u&&!d&& l&& rr){tn=4;tt=1;rot=0;}
                else if( u&& d&&!l&&!rr){tn=4;tt=1;rot=1;}
                else if( u&&!d&& l&& rr&& UR&& UL){tn=5;tt=1;rot=0;}
                else if( u&& d&&!l&& rr&& UR&& DR){tn=5;tt=1;rot=1;}
                else if(!u&& d&& l&& rr&& DR&& DL){tn=5;tt=1;rot=2;}
                else if( u&& d&& l&&!rr&& DL&& UL){tn=5;tt=1;rot=3;}
                else if( u&&!d&& l&& rr&& UR&&!UL){tn=5;tt=2;rot=0;}
                else if( u&& d&&!l&& rr&&!UR&& DR){tn=5;tt=2;rot=1;}
                else if(!u&& d&& l&& rr&&!DR&& DL){tn=5;tt=2;rot=2;}
                else if( u&& d&& l&&!rr&&!DL&& UL){tn=5;tt=2;rot=3;}
                else if( u&&!d&& l&& rr&&!UR&& UL){tn=5;tt=3;rot=0;}
                else if( u&& d&&!l&& rr&& UR&&!DR){tn=5;tt=3;rot=1;}
                else if(!u&& d&& l&& rr&& DR&&!DL){tn=5;tt=3;rot=2;}
                else if( u&& d&& l&&!rr&& DL&&!UL){tn=5;tt=3;rot=3;}
                else if( u&&!d&& l&& rr&&!UR&&!UL){tn=5;tt=4;rot=0;}
                else if( u&& d&&!l&& rr&&!UR&&!DR){tn=5;tt=4;rot=1;}
                else if(!u&& d&& l&& rr&&!DR&&!DL){tn=5;tt=4;rot=2;}
                else if( u&& d&& l&&!rr&&!DL&&!UL){tn=5;tt=4;rot=3;}
                else if(u&&d&&l&&rr&& UL&& UR&& DL&& DR){tn=6;tt=1;rot=0;}
                else if(u&&d&&l&&rr&&!UL&& UR&& DL&& DR){tn=6;tt=2;rot=0;}
                else if(u&&d&&l&&rr&& UL&&!UR&& DL&& DR){tn=6;tt=2;rot=1;}
                else if(u&&d&&l&&rr&& UL&& UR&& DL&&!DR){tn=6;tt=2;rot=2;}
                else if(u&&d&&l&&rr&& UL&& UR&&!DL&& DR){tn=6;tt=2;rot=3;}
                else if(u&&d&&l&&rr&&!UL&&!UR&& DL&& DR){tn=6;tt=3;rot=0;}
                else if(u&&d&&l&&rr&& UL&&!UR&& DL&&!DR){tn=6;tt=3;rot=1;}
                else if(u&&d&&l&&rr&& UL&& UR&&!DL&&!DR){tn=6;tt=3;rot=2;}
                else if(u&&d&&l&&rr&&!UL&& UR&&!DL&& DR){tn=6;tt=3;rot=3;}
                else if(u&&d&&l&&rr&&!UL&&!UR&& DL&&!DR){tn=6;tt=4;rot=0;}
                else if(u&&d&&l&&rr&& UL&&!UR&&!DL&&!DR){tn=6;tt=4;rot=1;}
                else if(u&&d&&l&&rr&&!UL&& UR&&!DL&&!DR){tn=6;tt=4;rot=2;}
                else if(u&&d&&l&&rr&&!UL&&!UR&&!DL&& DR){tn=6;tt=4;rot=3;}
                else if(u&&d&&l&&rr&&!UL&&!UR&&!DL&&!DR){tn=6;tt=5;rot=0;}
                else if(u&&d&&l&&rr&& UL&&!UR&&!DL&& DR){tn=6;tt=6;rot=0;}
                else if(u&&d&&l&&rr&&!UL&& UR&& DL&&!DR){tn=6;tt=6;rot=1;}
                return {sx:(tn-1)*17,sy:(tt-1)*17,rot};
            };
            // Draw visible grid cells
            const _v0c=Math.max(0,Math.floor(-editorCamX/editorZoom));
            const _v1c=Math.min(TILE_GRID_WIDTH,Math.ceil((_edAreaW-editorCamX)/editorZoom));
            const _v0r=Math.max(0,Math.floor(-editorCamY/editorZoom));
            const _v1r=Math.min(TILE_GRID_HEIGHT,Math.ceil((SCREEN_HEIGHT-editorCamY)/editorZoom));
            for(let _r=_v0r;_r<_v1r;_r++){
                for(let _c=_v0c;_c<_v1c;_c++){
                    const _cx=Math.round(_c*editorZoom+editorCamX),_cy=Math.round(_r*editorZoom+editorCamY);
                    const _cw=Math.max(1,Math.round((_c+1)*editorZoom+editorCamX)-_cx);
                    const _ch=Math.max(1,Math.round((_r+1)*editorZoom+editorCamY)-_cy);
                    if(editorSpawnRow===_r&&editorSpawnCol===_c){ctx.fillStyle='rgb(100,255,100)';ctx.fillRect(_cx,_cy,_cw,_ch);}
                    else{const _v=editorGrid[_r][_c];
                        if(_v===1||_v===5){
                            const _ws=_edWallSprite(_r,_c);
                            if(_ws.rot===0){ctx.drawImage(sheet,_ws.sx,_ws.sy,17,17,_cx,_cy,_cw,_ch);}
                            else{ctx.save();ctx.translate(_cx+_cw/2,_cy+_ch/2);ctx.rotate(_ws.rot*Math.PI/2);ctx.drawImage(sheet,_ws.sx,_ws.sy,17,17,-_cw/2,-_ch/2,_cw,_ch);ctx.restore();}
                        }else if(_v>=2&&_v<=13){ctx.drawImage(sheet,_TSX[_v-1],_TSY[_v-1],17,17,_cx,_cy,_cw,_ch);}
                    }
                }
            }
            // Line mode preview
            if(editorDrawMode==='line'&&editorLineStartRow!==null&&mouseDown&&_validCell){
                let _lr=editorLineStartRow,_lc=editorLineStartCol;
                const _dr=Math.abs(_gr-_lr),_dc=Math.abs(_gc-_lc);
                const _sr=_lr<_gr?1:-1,_sc=_lc<_gc?1:-1;
                let _le=_dr-_dc;
                ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle='rgb(255,255,255)';
                while(true){
                    const _px=Math.round(_lc*editorZoom+editorCamX),_py=Math.round(_lr*editorZoom+editorCamY);
                    const _pw=Math.max(1,Math.round((_lc+1)*editorZoom+editorCamX)-_px);
                    const _ph=Math.max(1,Math.round((_lr+1)*editorZoom+editorCamY)-_py);
                    ctx.fillRect(_px,_py,_pw,_ph);
                    if(_lr===_gr&&_lc===_gc)break;
                    const _e2=2*_le;
                    if(_e2>-_dc){_le-=_dc;_lr+=_sr;}
                    if(_e2<_dr){_le+=_dr;_lc+=_sc;}
                }
                ctx.restore();
            }
            // Grid lines — clipped to the 100×100 placeable area only
            {const _glx0=Math.max(0,Math.round(editorCamX)),_glx1=Math.min(_edAreaW,Math.round(editorCamX+TILE_GRID_WIDTH*editorZoom));
            const _gly0=Math.max(0,Math.round(editorCamY)),_gly1=Math.min(SCREEN_HEIGHT,Math.round(editorCamY+TILE_GRID_HEIGHT*editorZoom));
            if(editorZoom>=8){
                // Fine lines (every tile)
                ctx.beginPath();ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=1;
                for(let _c=_v0c;_c<=_v1c;_c++){const _lx=Math.round(_c*editorZoom+editorCamX);if(_lx<_glx0||_lx>_glx1)continue;ctx.moveTo(_lx,_gly0);ctx.lineTo(_lx,_gly1);}
                for(let _r=_v0r;_r<=_v1r;_r++){const _ly=Math.round(_r*editorZoom+editorCamY);if(_ly<_gly0||_ly>_gly1)continue;ctx.moveTo(_glx0,_ly);ctx.lineTo(_glx1,_ly);}
                ctx.stroke();
                // Major lines (every 10 tiles)
                ctx.beginPath();ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=1;
                for(let _c=0;_c<=TILE_GRID_WIDTH;_c+=10){const _lx=Math.round(_c*editorZoom+editorCamX);if(_lx<_glx0||_lx>_glx1)continue;ctx.moveTo(_lx,_gly0);ctx.lineTo(_lx,_gly1);}
                for(let _r=0;_r<=TILE_GRID_HEIGHT;_r+=10){const _ly=Math.round(_r*editorZoom+editorCamY);if(_ly<_gly0||_ly>_gly1)continue;ctx.moveTo(_glx0,_ly);ctx.lineTo(_glx1,_ly);}
                ctx.stroke();
            } else {
                // Zoomed out: only major lines
                ctx.beginPath();ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=1;
                for(let _c=0;_c<=TILE_GRID_WIDTH;_c+=10){const _lx=Math.round(_c*editorZoom+editorCamX);if(_lx<_glx0||_lx>_glx1)continue;ctx.moveTo(_lx,_gly0);ctx.lineTo(_lx,_gly1);}
                for(let _r=0;_r<=TILE_GRID_HEIGHT;_r+=10){const _ly=Math.round(_r*editorZoom+editorCamY);if(_ly<_gly0||_ly>_gly1)continue;ctx.moveTo(_glx0,_ly);ctx.lineTo(_glx1,_ly);}
                ctx.stroke();
            }}
            // Grid boundary
            {const _bx=Math.round(editorCamX),_by=Math.round(editorCamY);
            const _bw=Math.round(TILE_GRID_WIDTH*editorZoom),_bh=Math.round(TILE_GRID_HEIGHT*editorZoom);
            ctx.strokeStyle='rgba(180,200,255,0.6)';ctx.lineWidth=2;ctx.strokeRect(_bx,_by,_bw,_bh);}
            // Hover cell highlight
            if(_edInGrid&&_validCell){
                const _hx=Math.round(_gc*editorZoom+editorCamX),_hy=Math.round(_gr*editorZoom+editorCamY);
                const _hw=Math.max(1,Math.round((_gc+1)*editorZoom+editorCamX)-_hx);
                const _hh=Math.max(1,Math.round((_gr+1)*editorZoom+editorCamY)-_hy);
                ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=2;ctx.strokeRect(_hx,_hy,_hw,_hh);
            }
            // Sidebar background
            ctx.fillStyle='rgb(192,192,198)';ctx.fillRect(_edSideX,0,EDITOR_SIDEBAR_W,SCREEN_HEIGHT);
            ctx.fillStyle='rgb(152,152,160)';ctx.fillRect(_edSideX,0,2,SCREEN_HEIGHT);
            // BG toggle (very top of sidebar)
            {const _bgX=_edSideX+_palPad,_bgW=EDITOR_SIDEBAR_W-_palPad*2;
            ctx.fillStyle='rgb(172,185,198)';ctx.fillRect(_bgX,_edBgBtnY,_bgW,_edBgBtnH);
            ctx.strokeStyle='rgb(118,148,165)';ctx.lineWidth=1;ctx.strokeRect(_bgX,_edBgBtnY,_bgW,_edBgBtnH);
            {const _bgl=editorBackground===1?'BG: GRASS':'BG: VOID',_bglw=_bgl.length*(4*3+3);
            renderText(ctx,textSheet,_bgl,_bgX+Math.floor(_bgW/2-_bglw/2),_edBgBtnY+Math.floor((_edBgBtnH-21)/2),1,12,62,95);}}
            // Divider + TILES header below BG toggle
            ctx.strokeStyle='rgb(152,152,160)';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(_edSideX+2,_edBgBtnY+_edBgBtnH+2);ctx.lineTo(_edSideX+EDITOR_SIDEBAR_W,_edBgBtnY+_edBgBtnH+2);ctx.stroke();
            {const _thY=_edBgBtnY+_edBgBtnH+4,_thH=_palAreaY-_thY-2;
            const _stl='TILES',_stw=_stl.length*(4*3+3);
            renderText(ctx,textSheet,_stl,_edSideX+Math.floor(EDITOR_SIDEBAR_W/2-_stw/2),_thY+Math.floor((_thH-21)/2),1,35,35,65);}
            // Divider above palette
            ctx.strokeStyle='rgb(152,152,160)';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(_edSideX+2,_palAreaY-2);ctx.lineTo(_edSideX+EDITOR_SIDEBAR_W,_palAreaY-2);ctx.stroke();
            // Palette items (clipped + scrollable)
            ctx.save();
            ctx.beginPath();ctx.rect(_edSideX,_palAreaY,EDITOR_SIDEBAR_W,_palAreaH);ctx.clip();
            for(let _pi=0;_pi<EDITOR_PALETTE.length;_pi++){
                const _ep=EDITOR_PALETTE[_pi];
                const _iy=_palAreaY+_pi*_palItemH-editorPalScroll;
                if(_iy+_palItemH<_palAreaY||_iy>_palAreaY+_palAreaH)continue;
                const _ix=_edSideX+_palPad,_iw=EDITOR_SIDEBAR_W-_palPad*2,_ih=_palItemH-2;
                const _isSel=_ep.v===editorSelectedTile;
                ctx.fillStyle=_isSel?'rgb(182,194,230)':'rgb(208,208,214)';ctx.fillRect(_ix,_iy,_iw,_ih);
                ctx.strokeStyle=_isSel?'rgb(72,98,210)':'rgb(162,162,170)';ctx.lineWidth=_isSel?2:1;ctx.strokeRect(_ix,_iy,_iw,_ih);
                const _swS=_ih-8,_swX=_ix+6,_swY=_iy+Math.floor((_ih-_swS)/2);
                if(_ep.sx>=0){ctx.drawImage(sheet,_ep.sx,_ep.sy,17,17,_swX,_swY,_swS,_swS);}
                else{ctx.fillStyle=_ep.col;ctx.fillRect(_swX,_swY,_swS,_swS);}
                ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;ctx.strokeRect(_swX,_swY,_swS,_swS);
                {const _nm=_ep.name,_nlX=_swX+_swS+10,_nlY=_iy+Math.floor((_ih-21)/2);
                renderText(ctx,textSheet,_nm,_nlX,_nlY,1,_isSel?12:52,_isSel?20:52,_isSel?108:66);}
            }
            ctx.restore();
            // Scroll indicator
            if(_maxPalScroll>0){
                const _siH=Math.max(24,_palAreaH*_palAreaH/(EDITOR_PALETTE.length*_palItemH));
                const _siY=_palAreaY+(editorPalScroll/_maxPalScroll)*(_palAreaH-_siH);
                ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(_edSideX+EDITOR_SIDEBAR_W-5,_siY,4,_siH);
            }
            // Draw mode section (always visible at bottom, not scrollable)
            ctx.fillStyle='rgb(180,180,188)';ctx.fillRect(_edSideX+2,_dmSectionY,EDITOR_SIDEBAR_W-2,100);
            ctx.strokeStyle='rgb(145,145,155)';ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(_edSideX+2,_dmSectionY);ctx.lineTo(_edSideX+EDITOR_SIDEBAR_W,_dmSectionY);ctx.stroke();
            {const _dml='DRAW MODE',_dmw=_dml.length*(4*3+3);
            renderText(ctx,textSheet,_dml,_edSideX+Math.floor(EDITOR_SIDEBAR_W/2-_dmw/2),_dmLabelY,1,48,48,72);}
            const _modeLbls=['DRAW','FILL','LINE'];
            for(let _mi=0;_mi<3;_mi++){
                const _mbx=_edSideX+_palPad+_mi*(_edModeBtnW+2);
                const _msel=editorDrawMode===_edModes[_mi];
                ctx.fillStyle=_msel?'rgb(165,188,228)':'rgb(205,205,210)';ctx.fillRect(_mbx,_edModeBtnY,_edModeBtnW,_edModeBtnH);
                ctx.strokeStyle=_msel?'rgb(72,118,210)':'rgb(158,158,168)';ctx.lineWidth=_msel?2:1;ctx.strokeRect(_mbx,_edModeBtnY,_edModeBtnW,_edModeBtnH);
                const _mlt=_modeLbls[_mi],_mlw=_mlt.length*(4*3+3);
                renderText(ctx,textSheet,_mlt,_mbx+Math.floor(_edModeBtnW/2-_mlw/2),_edModeBtnY+Math.floor((_edModeBtnH-21)/2),1,_msel?12:58,_msel?52:58,_msel?175:72);
            }
            // Level name display (top of game area)
            if(editorLevelName){const _lnw=editorLevelName.length*(4*3+3);
                renderText(ctx,textSheet,editorLevelName,Math.floor(_edAreaW/2-_lnw/2),10,1,25,25,65);}
            // Try Level button
            if(!_canTry){ctx.save();ctx.globalAlpha=0.4;}
            renderTextButton(ctx,btnSheet,textSheet,16,_edTryX,_edTryY,_edTryW,'TRY LEVEL',0,0,0);
            if(!_canTry){ctx.restore();
                {const _hn='NO SPAWN PLACED',_hw=_hn.length*(4*3+3);
                renderText(ctx,textSheet,_hn,Math.floor(_edTryX+_edTryW/2-_hw/2),_edTryY-50,1,200,80,80);}}
            // Publish button
            if(!_canPublish){ctx.save();ctx.globalAlpha=0.4;}
            renderTextButton(ctx,redBtnSheet,textSheet,16,_edPubX,_edPubY,_edPubW,'PUBLISH',0,0,0);
            if(!_canPublish){ctx.restore();}
            if(!_canPublish&&_edOverPub){
                const _nl=!currentUser?'LOG IN TO PUBLISH':!_canTry?'NEED A SPAWN':'NEED AN END BLOCK';
                const _nw=_nl.length*(4*3+3);
                renderText(ctx,textSheet,_nl,_edPubX+Math.floor((_edPubW-_nw)/2),_edPubY-50,1,200,80,80);}
            // Back button + title
            renderButton(ctx,btnSheet,textSheet,4,_edBb.bx,_edBb.by,_edBb.bw,_edBb.bh,'');
        }

        // ── Cheat detected screen ──
        if(page==='CHEAT_DETECTED'){
            ctx.fillStyle='rgb(120,0,0)';ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
            const lines=[
                {t:'CHEAT DETECTED',s:2,y:SCREEN_HM-220},
                {t:'You have been flagged for pressing Shift at an',s:1,y:SCREEN_HM-120},
                {t:'inhuman speed using 3rd party software or a real',s:1,y:SCREEN_HM-90},
                {t:'life tool such as a massage gun.',s:1,y:SCREEN_HM-60},
                {t:'This run has NOT been saved to the leaderboard',s:1,y:SCREEN_HM+10},
                {t:'and you have NOT been awarded any Drift Coins.',s:1,y:SCREEN_HM+40},
                {t:'Please never do this again.',s:1,y:SCREEN_HM+100},
            ];
            for(const l of lines){
                const w=l.t.length*(4*3*l.s+3);
                renderText(ctx,textSheet,l.t,Math.floor(SCREEN_WM-w/2),l.y,l.s,255,255,255);
            }
            const bb=getBackBtn();
            renderButton(ctx,btnSheet,textSheet,4,bb.bx,bb.by,bb.bw,bb.bh,'');
            if(mjp&&inRect(mouseX,mouseY,bb.bx,bb.by,bb.bw,bb.bh)){
                antiCheatFlagged=false;shiftPressLog=[];page='LEVEL_SELECT';
            }
        }

        // ── Global chat (visible on all pages when logged in) ──
        if(currentUser&&_startPage!=='LEVEL_EDITOR'&&_startPage!=='LEVEL_NAME'&&_startPage!=='CUSTOM_LEVELS'&&_startPage!=='CUSTOM_LEVEL_DETAIL'){
            const CBX=145,CBW=SCREEN_WIDTH-CBX-10,msgLineH=36,INH=40,INY=SCREEN_HEIGHT-INH-30;
            const bgH=7*3+10,_cp=4*3+3,_maxBgW=CBW;
            function renderChatMsg(m,rowY,alpha){
                if(m.system){
                    const sText=('> '+m.text).slice(0,60);
                    const sW=Math.min(_maxBgW,sText.length*_cp+20);
                    ctx.save();ctx.globalAlpha=alpha*0.6;ctx.fillStyle='#1a1200';
                    ctx.beginPath();ctx.roundRect(CBX,rowY-5,sW,bgH,4);ctx.fill();ctx.restore();
                    ctx.save();ctx.globalAlpha=alpha;
                    renderText(ctx,textSheet,sText,CBX+10,rowY,1,255,200,60);
                    ctx.restore();
                }else{
                    const isOwn=m.uid===currentUser?.id;
                    const unStr=(m.username||'anonymous').toUpperCase()+': ';
                    const unW=unStr.length*_cp;
                    const msgText=m.text.slice(0,60);
                    const msgW=msgText.length*_cp;
                    const bgW=Math.min(_maxBgW,unW+msgW+20);
                    ctx.save();ctx.globalAlpha=alpha*0.55;ctx.fillStyle='#000';
                    ctx.beginPath();ctx.roundRect(CBX,rowY-5,bgW,bgH,4);ctx.fill();ctx.restore();
                    ctx.save();ctx.globalAlpha=alpha;
                    const ur=isOwn?255:180,ug=isOwn?160:180,ub=isOwn?40:180;
                    const tr=isOwn?255:160,tg=isOwn?160:160,tb=isOwn?40:160;
                    renderText(ctx,textSheet,unStr,CBX+10,rowY,1,ur,ug,ub);
                    renderText(ctx,textSheet,msgText,CBX+10+unW,rowY,1,tr,tg,tb);
                    ctx.restore();
                }
            }

            if(chatActive){
                // Scrollable history panel
                const HIST_H=280,histTop=INY-6-HIST_H;
                const totalHistH=chatHistory.length*msgLineH+12;
                chatHistoryScroll=Math.max(0,Math.min(chatHistoryScroll,Math.max(0,totalHistH-HIST_H)));
                ctx.save();ctx.globalAlpha=0.88;ctx.fillStyle='#0a1628';
                ctx.beginPath();ctx.roundRect(CBX,histTop,CBW,HIST_H,8);ctx.fill();
                ctx.strokeStyle='rgb(60,100,200)';ctx.lineWidth=1.5;
                ctx.beginPath();ctx.roundRect(CBX,histTop,CBW,HIST_H,8);ctx.stroke();
                ctx.restore();
                ctx.save();ctx.rect(CBX,histTop,CBW,HIST_H);ctx.clip();
                // render from bottom: most recent last, scrolled
                const visibleMsgs=chatHistory;
                const bottomAnchor=histTop+HIST_H-10+chatHistoryScroll;
                for(let i=visibleMsgs.length-1;i>=0;i--){
                    const rowY=bottomAnchor-(visibleMsgs.length-1-i)*msgLineH-msgLineH;
                    if(rowY+msgLineH<histTop||rowY>histTop+HIST_H) continue;
                    renderChatMsg(visibleMsgs[i],rowY,1);
                }
                ctx.restore();
                if(chatHistory.length===0){
                    ctx.save();ctx.globalAlpha=0.5;
                    const ph='NO MESSAGES YET',phW=ph.length*(4*3+3);
                    renderText(ctx,textSheet,ph,Math.floor(CBX+CBW/2-phW/2),Math.floor(histTop+HIST_H/2-10),1,120,130,160);
                    ctx.restore();
                }
            } else {
                // Fading recent messages overlay
                const visMsgs=chatMessages.filter(m=>(Date.now()-m.ts)<10000).slice(-8);
                const CBH=visMsgs.length>0?visMsgs.length*msgLineH+12:0;
                const CBY=INY-CBH-(CBH>0?6:0);
                if(CBH>0){
                    for(let i=0;i<visMsgs.length;i++){
                        const m=visMsgs[i];
                        const age=(Date.now()-m.ts)/1000;
                        const alpha=age>8?Math.max(0,1-(age-8)/2):1;
                        renderChatMsg(m,CBY+10+i*msgLineH,alpha);
                    }
                }
            }

            // Admin command autocomplete
            if(chatActive&&isPrivileged(currentUsername)&&chatInput.startsWith('/')){
                const typed=chatInput.toLowerCase();
                const sugg=ADMIN_COMMANDS.filter(c=>typed==='/'||c.cmd.startsWith(typed));
                if(sugg.length){
                    const acRowH=32,acPad=8,acW=CBW;
                    const acH=sugg.length*acRowH+acPad*2;
                    const histTopAC=INY-6-280;
                    const acY=histTopAC-acH-4;
                    ctx.save();ctx.globalAlpha=0.95;ctx.fillStyle='#0d1f3c';
                    ctx.beginPath();ctx.roundRect(CBX,acY,acW,acH,6);ctx.fill();
                    ctx.strokeStyle='rgb(80,120,220)';ctx.lineWidth=1.5;
                    ctx.beginPath();ctx.roundRect(CBX,acY,acW,acH,6);ctx.stroke();
                    ctx.restore();
                    for(let i=0;i<sugg.length;i++){
                        const c=sugg[i];const ry=acY+acPad+i*acRowH;
                        const cmdStr=c.cmd.toUpperCase();const argsStr=' '+c.args;
                        const cmdW=cmdStr.length*(4*3+3);
                        renderText(ctx,textSheet,cmdStr,CBX+10,ry+6,1,100,190,255);
                        renderText(ctx,textSheet,argsStr,CBX+10+cmdW,ry+6,1,140,150,180);
                    }
                }
            }

            // Input box
            ctx.save();ctx.globalAlpha=chatActive?0.82:0.42;ctx.fillStyle=chatActive?'#1a2a4a':'#111';
            ctx.beginPath();ctx.roundRect(CBX,INY,CBW,INH,6);ctx.fill();
            if(chatActive){ctx.strokeStyle='rgb(100,140,255)';ctx.lineWidth=2;
                ctx.beginPath();ctx.roundRect(CBX,INY,CBW,INH,6);ctx.stroke();}
            ctx.restore();

            if(chatActive){
                const disp=chatInput;
                if(disp) renderText(ctx,textSheet,disp,CBX+12,INY+INH/2-10,1,220,220,240);
                if(Math.floor(performance.now()/530)%2===0){
                    const cx=CBX+12+getCaretXOffset(disp,Math.min(chatCaretPos,disp.length),1);
                    ctx.fillStyle='rgb(160,190,255)';ctx.fillRect(cx,INY+9,2,21);
                }
            }else{
                renderText(ctx,textSheet,'CLICK OR PRESS ENTER TO CHAT',CBX+12,INY+INH/2-10,1,70,70,95);
            }

            // Click to activate / deactivate
            if(inRect(mouseX,mouseY,CBX,INY-12,CBW,INH+24)) _wantText=true;
            if(mjp){
                const HIST_H=280,histTop=INY-6-HIST_H;
                if(inRect(mouseX,mouseY,CBX,INY,CBW,INH)){if(chatActive)chatCaretPos=getCaretPosFromX(chatInput,mouseX-(CBX+12),1);setChatActive(true);}
                else if(chatActive&&!inRect(mouseX,mouseY,CBX,histTop,CBW,INY+INH-histTop)) setChatActive(false);
            }
        }

        if(duelIncoming&&currentUser){
            ctx.save();
            ctx.setTransform(gameScale,0,0,gameScale,gameOffX,gameOffY);
            ctx.imageSmoothingEnabled=false;
            const _dnW=380,_dnH=290,_dnX=20,_dnY=20;
            ctx.globalAlpha=0.93;ctx.fillStyle='rgb(18,18,42)';
            ctx.beginPath();ctx.roundRect(_dnX,_dnY,_dnW,_dnH,10);ctx.fill();
            ctx.globalAlpha=1;ctx.strokeStyle='rgb(120,160,255)';ctx.lineWidth=2;
            ctx.beginPath();ctx.roundRect(_dnX,_dnY,_dnW,_dnH,10);ctx.stroke();
            ctx.globalAlpha=1;
            renderText(ctx,textSheet,'DUEL INVITE',_dnX+14,_dnY+16,1,140,175,255);
            renderText(ctx,textSheet,duelIncoming.fromUsername||'?',_dnX+14,_dnY+46,1,255,215,70);
            renderText(ctx,textSheet,'INVITED YOU TO A DUEL',_dnX+14,_dnY+72,1,190,190,220);
            const _dBtnW=350,_dBtnX=_dnX+15,_daY=_dnY+104,_ddY=_dnY+196;
            renderTextButton(ctx,btnSheet,textSheet,0,_dBtnX,_daY,_dBtnW,'ACCEPT',0,160,80);
            renderTextButton(ctx,btnSheet,textSheet,0,_dBtnX,_ddY,_dBtnW,'DECLINE',180,0,0);
            ctx.restore();
            if(mjp){
                if(inRect(mouseX,mouseY,_dBtnX,_daY,_dBtnW,80)){if(page!=='RACE')page='RACE';acceptDuelInvite();}
                if(inRect(mouseX,mouseY,_dBtnX,_ddY,_dBtnW,80))declineDuelInvite();
            }
        }
        {const _chatOver=(page==='GAME'||page==='LOBBY'||page==='RACE_GAME')&&currentUser&&mouseX>=145&&mouseX<=SCREEN_WIDTH-10&&mouseY>=SCREEN_HEIGHT-90&&mouseY<=SCREEN_HEIGHT-20;
        const nc=(_wantText||_chatOver)?'text':'default';
        if(nc!==_prevCursor){canvas.style.cursor=nc;_prevCursor=nc;}}
        requestAnimationFrame(loop);
    }
    loop();

}).catch(err=>{
    console.error(err);
    ctx.fillStyle='#222'; ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
    ctx.fillStyle='#f66'; ctx.font='24px monospace';
    const lines=(err.stack||err.toString()).split('\n');
    lines.forEach((l,i)=>ctx.fillText(l.slice(0,90),40,80+i*30));
});
