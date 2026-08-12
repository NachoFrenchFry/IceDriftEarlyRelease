function adminLocalMsg(text){
    const m={uid:'__system__',username:'',text:text.slice(0,60),ts:Date.now(),system:true};
    chatMessages.push(m);chatHistory.push(m);chatHistoryScroll=0;
    if(chatMessages.length>CHAT_MAX)chatMessages.shift();
}
function sendChatMessage(text){
    const t=text.trim().slice(0,80);
    if(!t||!chatChannel)return;
    if(Date.now()<mutedUntil){adminLocalMsg('YOU ARE MUTED');return;}
    const msg={uid:currentUser?.id||'',username:currentUsername,text:t,ts:Date.now()};
    chatMessages.push(msg);chatHistory.push(msg);chatHistoryScroll=0;
    if(chatMessages.length>CHAT_MAX)chatMessages.shift();
    chatChannel.send({type:'broadcast',event:'chat',payload:msg});
}
async function execAdminCommand(raw){
    const parts=raw.trim().split(/\s+/);
    const cmd=parts[0].toLowerCase();
    if(cmd==='/givedriftcoins'){
        const[,user,amtStr]=parts;const amount=parseInt(amtStr);
        if(!user||isNaN(amount)){adminLocalMsg('Usage: /givedriftcoins [user] [amount]');return;}
        const{data,error}=await db.rpc('admin_give_dc',{p_target:user,p_amount:amount,p_admin:currentUsername,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/givetalentpoints'){
        const[,user,amtStr]=parts;const amount=parseInt(amtStr);
        if(!user||isNaN(amount)){adminLocalMsg('Usage: /givetalentpoints [user] [amount]');return;}
        const{data,error}=await db.rpc('admin_give_tp',{p_target:user,p_amount:amount,p_admin:currentUsername,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/removedriftcoins'){
        const[,user,amtStr]=parts;const amount=parseInt(amtStr);
        if(!user||isNaN(amount)){adminLocalMsg('Usage: /removedriftcoins [user] [amount]');return;}
        const{data,error}=await db.rpc('admin_remove_dc',{p_target:user,p_amount:amount,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/removetalentpoints'){
        const[,user,amtStr]=parts;const amount=parseInt(amtStr);
        if(!user||isNaN(amount)){adminLocalMsg('Usage: /removetalentpoints [user] [amount]');return;}
        const{data,error}=await db.rpc('admin_remove_tp',{p_target:user,p_amount:amount,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/resettalents'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /resettalents [user]');return;}
        const{data,error}=await db.rpc('admin_reset_talents',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/resetdriftcoins'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /resetdriftcoins [user]');return;}
        const{data,error}=await db.rpc('admin_reset_dc',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/resettalentpoints'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /resettalentpoints [user]');return;}
        const{data,error}=await db.rpc('admin_reset_tp',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/mute'){
        const[,user,secsStr]=parts;const secs=parseInt(secsStr);
        if(!user||isNaN(secs)){adminLocalMsg('Usage: /mute [user] [seconds]');return;}
        const{data,error}=await db.rpc('admin_mute_user',{p_target:user,p_seconds:secs,p_admin:currentUsername,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/password'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /password [user]');return;}
        const{data,error}=await db.rpc('admin_user_info',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else if(cmd==='/driftcoins'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /driftcoins [user]');return;}
        const{data,error}=await db.rpc('admin_get_profile',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data?.error?data.error:user+': '+(data?.drift_coins??'?')+' DC');
    }else if(cmd==='/talentpoints'){
        const[,user]=parts;
        if(!user){adminLocalMsg('Usage: /talentpoints [user]');return;}
        const{data,error}=await db.rpc('admin_get_profile',{p_target:user,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data?.error?data.error:user+': '+(data?.total_talent_points??'?')+' TP ('+(data?.spent_talent_points??'?')+' spent)');
    }else if(cmd==='/besttime'){
        const[,user,lvlStr]=parts;const lvl=parseInt(lvlStr);
        if(!user||isNaN(lvl)||lvl<1||lvl>5){adminLocalMsg('Usage: /besttime [user] [1-5]');return;}
        const{data,error}=await db.rpc('admin_get_besttime',{p_target:user,p_level:lvl-1,p_caller_id:currentUser.id});
        adminLocalMsg(error?'ERR: '+error.message:data);
    }else{
        adminLocalMsg('Unknown command: '+cmd);
    }
}

async function dbSignUp(username,password){
    authLoading=true;authError='';
    try{
        if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)){authLoading=false;authError='Username: 3-20 chars, letters, numbers, _';return;}
        const{data:existing}=await db.from('profiles').select('id').ilike('username',username).maybeSingle();
        if(existing){authLoading=false;authError='Username already taken';return;}
        const{data,error}=await db.auth.signUp({email:toAuthEmail(username),password});
        if(error){authLoading=false;authError=error.message;return;}
        if(!data.user){authLoading=false;authError='Disable email confirmation in Supabase auth settings';return;}
        const ins=await db.from('profiles').insert({
            id:data.user.id,username,
            drift_coins:0,total_talent_points:0,spent_talent_points:0,talents_purchased:[],
            owned_skins:[0],selected_skin:0
        });
        if(ins.error){authLoading=false;authError='DB error: '+ins.error.message;return;}
        currentUser=data.user;currentUsername=username;
        ownedSkins=[0];selectedSkin=0;driftCoins=0;totalTalentPoints=0;spentTalentPoints=0;
        talentPurchased=new Array(TALENT_COUNT).fill(false);talentRecomputeEffects();
        localStorage.setItem('icedrift_owned_skins','[0]');localStorage.setItem('icedrift_skin','0');
        authLoading=false;showPassword=false;
        page='LEVELS';dbLoadRecords();joinChatChannel();subscribeToProfile();joinRaceChallengeChannel();
    }catch(e){authLoading=false;authError='Error: '+e.message;}
}
async function dbSignIn(username,password){
    authLoading=true;authError='';
    try{
        const{data,error}=await db.auth.signInWithPassword({email:toAuthEmail(username),password});
        if(error){authLoading=false;authError='Invalid username or password';return;}
        currentUser=data.user;
        await dbLoadProfile(data.user.id);
        authLoading=false;showPassword=false;
        page='LEVELS';dbLoadRecords();joinChatChannel();subscribeToProfile();joinRaceChallengeChannel();
    }catch(e){authLoading=false;authError='Error: '+e.message;}
}

// Restore session on page load (e.g. after a redeployment)
(async()=>{
    const{data:{session}}=await db.auth.getSession();
    if(session?.user){
        currentUser=session.user;
        const result=await dbLoadProfile(session.user.id);
        if(result==='notfound'){
            // Profile row is gone (deleted account) — sign out and clear tokens
            await db.auth.signOut();
            currentUser=null;page='MENU';return;
        }
        if(result==='error'||!currentUsername){
            // Network/server error or profile failed to load — don't sign out,
            // just stay on MENU so the user can try again without losing their session
            currentUser=null;page='MENU';return;
        }
        dbLoadRecords();
        page='LEVELS';joinChatChannel();subscribeToProfile();joinRaceChallengeChannel();
    }
})();

