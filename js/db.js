const db=supabase.createClient(
    'https://wtwcpwglyhciokiarchp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nwd2dseWhjaW9raWFyY2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTk2MDcsImV4cCI6MjA5NDY5NTYwN30.rrPjOyVsjlh4s1uJmPWgj7kX66YD2tK04WoXc_2A2YY'
);
async function dbLoadProfile(uid){
    const{data,error}=await db.from('profiles').select('*').eq('id',uid).single();
    if(!data){
        // PGRST116 = row not found (deleted account). Anything else = network/server error.
        return error?.code==='PGRST116'?'notfound':'error';
    }
    // Check localStorage for a snapshot newer than what's in DB (e.g. save was in-flight on refresh)
    let d=data;
    try{
        const _lsRaw=localStorage.getItem('icedrift_snap_'+uid);
        if(_lsRaw){
            const _ls=JSON.parse(_lsRaw);
            if(_ls.updated_at&&(!data.updated_at||_ls.updated_at>data.updated_at)){
                d=Object.assign({},data,_ls);
                db.from('profiles').update(_ls).eq('id',uid);
            }
        }
    }catch(e){}
    currentUsername=data.username||'';
    driftCoins=d.drift_coins||0;
    totalTalentPoints=Math.max(0,d.total_talent_points||0);
    spentTalentPoints=d.spent_talent_points||0;
    if(Array.isArray(d.talents_purchased)&&d.talents_purchased.length>0){
        const stored=d.talents_purchased.slice(0,TALENT_COUNT);
        while(stored.length<TALENT_COUNT)stored.push(false);
        talentPurchased=stored;
    }else{talentPurchased=new Array(TALENT_COUNT).fill(false);}
    talentRecomputeEffects();
    if(Array.isArray(d.owned_skins)&&d.owned_skins.length>0){
        ownedSkins=d.owned_skins;
        selectedSkin=Math.min(d.selected_skin||0,SKINS.length-1);
        localStorage.setItem('icedrift_owned_skins',JSON.stringify(ownedSkins));
        localStorage.setItem('icedrift_skin',selectedSkin);
    }
    mutedUntil=data.muted_until?new Date(data.muted_until).getTime():0;
    lastUpdateSeen=d.last_update_seen||null;
    hasNewUpdate=currentUser&&(lastUpdateSeen!==UPDATE_LOG[0].date);
    return 'ok';
}
let _saveProfileTimer=null;
function dbSaveProfile(){
    if(_saveProfileTimer)clearTimeout(_saveProfileTimer);
    _saveProfileTimer=setTimeout(_dbSaveProfileNow,400);
}
function dbSaveProfileNow(){
    if(_saveProfileTimer){clearTimeout(_saveProfileTimer);_saveProfileTimer=null;}
    _dbSaveProfileNow();
}
async function _dbSaveProfileNow(){
    _saveProfileTimer=null;
    if(!currentUser)return;
    const _snap={
        drift_coins:driftCoins,
        total_talent_points:Math.max(0,totalTalentPoints),
        spent_talent_points:spentTalentPoints,
        talents_purchased:[...talentPurchased],
        selected_skin:selectedSkin,
        owned_skins:[...ownedSkins],
        last_update_seen:lastUpdateSeen,
        updated_at:new Date().toISOString()
    };
    try{localStorage.setItem('icedrift_snap_'+currentUser.id,JSON.stringify(_snap));}catch(e){}
    const{error}=await db.from('profiles').update(_snap).eq('id',currentUser.id);
    if(error)console.error('[save]',error.message);
}
document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&(_saveProfileTimer||currentUser)){
        if(_saveProfileTimer){clearTimeout(_saveProfileTimer);_saveProfileTimer=null;_dbSaveProfileNow();}
    }
});
async function dbSaveTime(level,time){
    if(!currentUser||isPrivileged(currentUsername))return;
    const{data:existing}=await db.from('times').select('time').eq('user_id',currentUser.id).eq('level',level).maybeSingle();
    if(existing&&existing.time<=time)return;
    await db.from('times').upsert({user_id:currentUser.id,username:currentUsername,level,time},{onConflict:'user_id,level'});
}
async function dbLoadRecords(){
    for(let i=0;i<5;i++){
        const{data}=await db.from('times').select('username,time').eq('level',i)
            .order('time',{ascending:true}).limit(1).maybeSingle();
        levelRecords[i]=data&&!isPrivileged(data.username)?data:null;
    }
}
async function dbDeleteAccount(){
    if(!currentUser)return;
    await db.rpc('delete_account');
    leaveChatChannel();leaveLobbyChannel();leaveRaceChallengeChannel();unsubscribeFromProfile();
    currentUser=null;currentUsername='';driftCoins=0;totalTalentPoints=0;spentTalentPoints=0;
    talentPurchased=new Array(TALENT_COUNT).fill(false);talentRecomputeEffects();
    inputValues.username='';inputValues.password='';deleteConfirm=false;
    page='MENU';
}
async function dbSaveCustomLevel(published,bestTime){
    if(!currentUser)return;
    const _tiles=[];
    for(let _r=0;_r<TILE_GRID_HEIGHT;_r++)
        for(let _c=0;_c<TILE_GRID_WIDTH;_c++)
            if(editorGrid[_r][_c]!==0)_tiles.push([_r,_c,editorGrid[_r][_c]]);
    const _payload={user_id:currentUser.id,name:editorLevelName||'Unnamed Level',
        grid:_tiles,background:editorBackground,
        spawn_row:editorSpawnRow,spawn_col:editorSpawnCol,
        published:!!published,updated_at:new Date().toISOString(),creator_name:currentUsername||null};
    if(bestTime!=null)_payload.best_time=bestTime;
    if(editorLevelId){
        await db.from('custom_levels').update(_payload).eq('id',editorLevelId).eq('user_id',currentUser.id);
    } else {
        const{data}=await db.from('custom_levels').insert(_payload).select('id').single();
        if(data)editorLevelId=data.id;
    }
}
async function dbLoadMyLevels(){
    if(!currentUser){myLevels=[];myLevelsLoaded=true;return;}
    const{data}=await db.from('custom_levels').select('*').eq('user_id',currentUser.id).order('created_at',{ascending:false});
    myLevels=data||[];myLevelsLoaded=true;
}
async function dbDeleteCustomLevel(id){
    if(!currentUser)return;
    myLevels=myLevels.filter(l=>l.id!==id);
    communityLevels=communityLevels.filter(l=>l.id!==id);
    await db.from('custom_levels').delete().eq('id',id).eq('user_id',currentUser.id);
}
async function dbRenameCustomLevel(id,name){
    if(!currentUser)return;
    await db.from('custom_levels').update({name,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',currentUser.id);
}
async function dbUnpublishCustomLevel(id){
    if(!currentUser)return;
    const lv=myLevels.find(l=>l.id===id);
    if(lv)lv.published=false;
    communityLevels=communityLevels.filter(l=>l.id!==id);
    await db.from('custom_levels').update({published:false,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',currentUser.id);
}
async function dbLoadCommunityLevels(){
    const{data}=await db.from('custom_levels').select('*').eq('published',true).order('updated_at',{ascending:false}).limit(100);
    communityLevels=data||[];communityLevelsLoaded=true;
}
async function dbRefreshLevelGlobalBest(levelId){
    const{data}=await db.from('custom_levels').select('global_best_time').eq('id',levelId).single();
    if(data&&selectedCustomLevel&&selectedCustomLevel.id===levelId)selectedCustomLevel.global_best_time=data.global_best_time;
}
async function dbLoadCustomLevelPB(levelId){
    if(!currentUser){selectedCustomLevelPB=null;return;}
    const{data,error}=await db.from('custom_level_records').select('best_time').eq('user_id',currentUser.id).eq('level_id',levelId).maybeSingle();
    if(error)console.error('[PB load]',error.message,error.code);
    selectedCustomLevelPB=data?data.best_time:null;
}
async function dbSaveCustomLevelRecord(levelId,time){
    if(!currentUser)return;
    if(selectedCustomLevelPB!=null&&selectedCustomLevelPB<=time)return;
    selectedCustomLevelPB=time;
    const{error}=await db.from('custom_level_records').upsert({user_id:currentUser.id,level_id:levelId,best_time:time,updated_at:new Date().toISOString()},{onConflict:'user_id,level_id'});
    if(error){console.error('[PB save]',error.message,error.code);return;}
    if(selectedCustomLevel&&selectedCustomLevel.id===levelId){
        if(selectedCustomLevel.global_best_time==null||time<selectedCustomLevel.global_best_time)
            selectedCustomLevel.global_best_time=time;
    }
}
async function dbChangeUsername(newUsername){
    authLoading=true;authError='';
    try{
        if(!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)){authLoading=false;authError='3-20 chars, letters, numbers, _';return;}
        const{data:existing}=await db.from('profiles').select('id').ilike('username',newUsername).maybeSingle();
        if(existing&&existing.id!==currentUser.id){authLoading=false;authError='Username already taken';return;}
        const{error:uErr}=await db.auth.updateUser({email:toAuthEmail(newUsername)});
        if(uErr){authLoading=false;authError=uErr.message;return;}
        const{error:pErr}=await db.from('profiles').update({username:newUsername}).eq('id',currentUser.id);
        if(pErr){authLoading=false;authError=pErr.message;return;}
        await db.from('times').update({username:newUsername}).eq('user_id',currentUser.id);
        currentUsername=newUsername;authLoading=false;authError='';inputValues.username='';setActiveInput(null);page='SETTINGS';
    }catch(e){authLoading=false;authError='Error: '+e.message;}
}
async function dbChangePassword(currentPw,newPassword){
    authLoading=true;authError='';
    try{
        if(newPassword.length<6){authLoading=false;authError='New password must be at least 6 chars';return;}
        const{error:signInErr}=await db.auth.signInWithPassword({email:toAuthEmail(currentUsername),password:currentPw});
        if(signInErr){authLoading=false;authError='Current password is incorrect';return;}
        const{error}=await db.auth.updateUser({password:newPassword});
        if(error){authLoading=false;authError=error.message;return;}
        authLoading=false;authError='';inputValues.username='';inputValues.password='';inputValues.confirmPw='';setActiveInput(null);page='SETTINGS';
    }catch(e){authLoading=false;authError='Error: '+e.message;}
}
async function dbLoadLeaderboard(level){
    lbLoading=true;lbRows=[];
    const{data}=await db.from('times').select('username,time').eq('level',level).order('time',{ascending:true}).limit(100);
    lbRows=(data||[]).filter(r=>!isPrivileged(r.username)&&!BANNED_LB.includes((r.username||'').toLowerCase()));
    lbLoading=false;
}
