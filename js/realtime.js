function joinLobbyChannel(){
    if(lobbyChannel)return;
    const key=currentUser?.id||'anon-'+Math.random().toString(36).slice(2);
    lobbyChannel=db.channel('ice-drift-lobby',{config:{presence:{key}}});
    lobbyChannel
        .on('broadcast',{event:'pos'},({payload})=>{
            if(payload.uid===currentUser?.id)return;
            const prev=otherPlayers[payload.uid]||{};
            const _rcvNow=performance.now();
            otherPlayers[payload.uid]={x:payload.x,y:payload.y,dir:payload.dir||270,username:payload.username||'',skin:payload.skin||0,bsx:payload.bsx||1,bsy:payload.bsy||1,ts:_rcvNow,drift:payload.drift||null,pfxPending:[...(prev.pfxPending||[]),...(payload.pfx||[])],iceAccum:prev.iceAccum||0,sc_rem:payload.sc_rem||0,sc_total:payload.sc_total||1,sc_ts:_rcvNow,spd_rem:payload.spd_rem||0,spd_el:payload.spd_el||0,spd_ts:_rcvNow,_sc2Pfx:prev._sc2Pfx||0,_spdPfx:prev._spdPfx||0,_devPfx:prev._devPfx||0,ghostTrail:(()=>{let _gt=(prev.ghostTrail||[]).filter(g=>_rcvNow-g.born<g.life);const _last=_gt.length>0?_gt[_gt.length-1]:null;const _dx=_last?payload.x-_last.wx:999,_dy=_last?payload.y-_last.wy:999;if((payload.drift?.spd||0)>20&&_dx*_dx+_dy*_dy>22*22)_gt.push({wx:payload.x,wy:payload.y,dir:payload.dir||270,born:_rcvNow,life:380});return _gt;})()};
        })
        .on('presence',{event:'leave'},({leftPresences})=>{
            for(const p of leftPresences)delete otherPlayers[p.key];
        })
        .subscribe(async(status)=>{
            if(status==='SUBSCRIBED')await lobbyChannel.track({uid:currentUser?.id||key});
        });
}
function leaveLobbyChannel(){
    if(!lobbyChannel)return;
    lobbyChannel.unsubscribe();
    lobbyChannel=null;
    otherPlayers={};
}
function raceGenId(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}

function joinRaceQueueChannel(){
    if(raceQueueChannel||!currentUser)return;
    _raceProposed=null;
    raceQueueChannel=db.channel('ice-drift-race-queue',{config:{presence:{key:currentUser.id}}});
    raceQueueChannel
        .on('broadcast',{event:'match_propose'},({payload})=>{
            if(payload.toUid!==currentUser.id||_raceProposed)return;
            raceOpponent={uid:payload.fromUid,username:payload.fromUsername,dc:payload.fromDc,tp:payload.fromTp,skin:payload.fromSkin||0};
            raceSessionId=payload.sessionId;raceMap=payload.map;
            raceQueueChannel.send({type:'broadcast',event:'match_accept',payload:{toUid:payload.fromUid,fromUid:currentUser.id,fromUsername:currentUsername,fromDc:driftCoins,fromTp:totalTalentPoints,fromSkin:selectedSkin}});
            leaveRaceQueueChannel();startRaceSession();
        })
        .on('broadcast',{event:'match_accept'},({payload})=>{
            if(payload.toUid!==currentUser.id)return;
            raceOpponent={uid:payload.fromUid,username:payload.fromUsername,dc:payload.fromDc,tp:payload.fromTp,skin:payload.fromSkin||0};
            leaveRaceQueueChannel();startRaceSession();
        })
        .on('presence',{event:'sync'},()=>{
            if(_raceProposed||raceState!=='queue')return;
            const st=raceQueueChannel.presenceState();
            const allUids=Object.keys(st).sort();
            // Only the lowest-uid player proposes to avoid both proposing simultaneously
            if(allUids.length>=2&&allUids[0]===currentUser.id){
                const targetUid=allUids[1];
                _raceProposed=targetUid;
                raceSessionId=raceGenId();raceMap=Math.floor(Math.random()*5);
                raceQueueChannel.send({type:'broadcast',event:'match_propose',payload:{fromUid:currentUser.id,fromUsername:currentUsername,fromDc:driftCoins,fromTp:totalTalentPoints,fromSkin:selectedSkin,toUid:targetUid,sessionId:raceSessionId,map:raceMap}});
            }
        })
        .subscribe(async(s)=>{if(s==='SUBSCRIBED')await raceQueueChannel.track({uid:currentUser.id});});
}
function leaveRaceQueueChannel(){
    if(!raceQueueChannel)return;
    raceQueueChannel.unsubscribe();raceQueueChannel=null;_raceProposed=null;
}

function joinRaceChallengeChannel(){
    if(raceChallengeChannel||!currentUser)return;
    raceChallengeChannel=db.channel('ice-drift-race-challenges');
    raceChallengeChannel
        .on('broadcast',{event:'challenge'},({payload})=>{
            if((payload.toUsername||'').toLowerCase()!==currentUsername.toLowerCase())return;
            raceIncoming={fromUid:payload.fromUid,fromUsername:payload.fromUsername,sessionId:payload.sessionId,map:payload.map,fromDc:payload.fromDc,fromTp:payload.fromTp};
        })
        .on('broadcast',{event:'challenge_accept'},({payload})=>{
            if(payload.sessionId!==raceSessionId||raceState!=='challenge_wait')return;
            raceOpponent={uid:payload.fromUid,username:payload.fromUsername,dc:payload.fromDc,tp:payload.fromTp};
            startRaceSession();
        })
        .on('broadcast',{event:'challenge_decline'},({payload})=>{
            if(payload.sessionId!==raceSessionId||raceState!=='challenge_wait')return;
            raceChallengeError=(payload.fromUsername||'player')+' DECLINED';
            raceState='challenge_send';raceSessionId=null;
        })
        .on('broadcast',{event:'duel_invite'},({payload})=>{
            if((payload.toUsername||'').toLowerCase()!==currentUsername.toLowerCase())return;
            duelIncoming={fromUid:payload.fromUid,fromUsername:payload.fromUsername,sessionId:payload.sessionId,map:payload.map};
        })
        .on('broadcast',{event:'duel_accept'},({payload})=>{
            if(payload.sessionId!==raceSessionId||raceState!=='duel_wait')return;
            raceOpponent={uid:payload.fromUid,username:payload.fromUsername,dc:0,tp:0};
            clearTimeout(duelWaitTimeout);startRaceSession();
        })
        .on('broadcast',{event:'duel_decline'},({payload})=>{
            if(payload.sessionId!==raceSessionId||raceState!=='duel_wait')return;
            clearTimeout(duelWaitTimeout);
            duelError=(payload.fromUsername||'player')+' DECLINED';
            raceState='duel_send';raceSessionId=null;
        })
        .subscribe();
}
function leaveRaceChallengeChannel(){
    if(!raceChallengeChannel)return;
    raceChallengeChannel.unsubscribe();raceChallengeChannel=null;
}

function sendRaceChallenge(){
    if(!raceChallengeChannel||!raceChallengeInput.trim()){return;}
    if(raceChallengeInput.trim().toLowerCase()===currentUsername.toLowerCase()){raceChallengeError='CANNOT CHALLENGE YOURSELF';return;}
    raceSessionId=raceGenId();raceMap=Math.floor(Math.random()*5);
    raceChallengeChannel.send({type:'broadcast',event:'challenge',payload:{fromUid:currentUser.id,fromUsername:currentUsername,toUsername:raceChallengeInput.trim().toLowerCase(),sessionId:raceSessionId,map:raceMap,fromDc:driftCoins,fromTp:totalTalentPoints}});
    raceChallengeError='';raceState='challenge_wait';
}
function acceptRaceChallenge(){
    if(!raceIncoming||!raceChallengeChannel)return;
    raceOpponent={uid:raceIncoming.fromUid,username:raceIncoming.fromUsername,dc:raceIncoming.fromDc,tp:raceIncoming.fromTp};
    raceSessionId=raceIncoming.sessionId;raceMap=raceIncoming.map;
    raceChallengeChannel.send({type:'broadcast',event:'challenge_accept',payload:{fromUid:currentUser.id,fromUsername:currentUsername,fromDc:driftCoins,fromTp:totalTalentPoints,sessionId:raceSessionId}});
    raceIncoming=null;startRaceSession();
}
function declineRaceChallenge(){
    if(!raceIncoming||!raceChallengeChannel)return;
    raceChallengeChannel.send({type:'broadcast',event:'challenge_decline',payload:{fromUid:currentUser.id,fromUsername:currentUsername,sessionId:raceIncoming.sessionId}});
    raceIncoming=null;
}

async function sendDuelInvite(){
    if(!raceChallengeChannel||!duelInput.trim())return;
    if(duelInput.trim().toLowerCase()===currentUsername.toLowerCase()){duelError='CANNOT DUEL YOURSELF';return;}
    duelError='';raceState='duel_wait';
    const{data:_prof}=await db.from('profiles').select('id').ilike('username',duelInput.trim()).maybeSingle();
    if(!_prof){duelError='PLAYER NOT FOUND';raceState='duel_send';return;}
    raceSessionId=raceGenId();raceMap=Math.floor(Math.random()*5);
    raceChallengeChannel.send({type:'broadcast',event:'duel_invite',payload:{fromUid:currentUser.id,fromUsername:currentUsername,toUsername:duelInput.trim().toLowerCase(),sessionId:raceSessionId,map:raceMap}});
    clearTimeout(duelWaitTimeout);
    // Pre-join the race channel so presence detects when opponent accepts, rather than
    // depending solely on the duel_accept broadcast which may not be reliable
    if(raceChannel){raceChannel.unsubscribe();raceChannel=null;}
    const _sid=raceSessionId,_dIn=duelInput;
    raceChannel=db.channel('ice-drift-race-'+_sid,{config:{presence:{key:currentUser.id}}});
    raceChannel.on('presence',{event:'sync'},()=>{
        if(raceState!=='duel_wait'||raceSessionId!==_sid)return;
        const _ps=raceChannel.presenceState(),_pu=Object.keys(_ps);
        if(_pu.length<2)return;
        const _ou=_pu.find(u=>u!==currentUser.id);if(!_ou)return;
        const _op=(Object.values(_ps[_ou])||[])[0]||{};
        raceOpponent={uid:_ou,username:_op.username||_dIn,dc:0,tp:0,skin:_op.skin||0};
        clearTimeout(duelWaitTimeout);
        setTimeout(()=>{if(raceState==='duel_wait'&&raceSessionId===_sid)startRaceSession();},0);
    }).subscribe(async s=>{if(s==='SUBSCRIBED')await raceChannel.track({uid:currentUser.id,username:currentUsername});});
    duelWaitTimeout=setTimeout(()=>{
        if(raceState==='duel_wait'){duelError='PLAYER NOT FOUND OR NOT ONLINE';raceState='duel_send';raceSessionId=null;if(raceChannel){raceChannel.unsubscribe();raceChannel=null;}}
    },10000);
}
function acceptDuelInvite(){
    if(!duelIncoming||!raceChallengeChannel)return;
    raceMode='duel';
    raceOpponent={uid:duelIncoming.fromUid,username:duelIncoming.fromUsername,dc:0,tp:0};
    raceSessionId=duelIncoming.sessionId;raceMap=duelIncoming.map;
    raceChallengeChannel.send({type:'broadcast',event:'duel_accept',payload:{fromUid:currentUser.id,fromUsername:currentUsername,sessionId:raceSessionId}});
    duelIncoming=null;startRaceSession();
}
function declineDuelInvite(){
    if(!duelIncoming||!raceChallengeChannel)return;
    raceChallengeChannel.send({type:'broadcast',event:'duel_decline',payload:{fromUid:currentUser.id,fromUsername:currentUsername,sessionId:duelIncoming.sessionId}});
    duelIncoming=null;
}
function startRaceSession(){
    raceState='ready';
    raceMyDcAtStart=driftCoins;raceMyTpAtStart=totalTalentPoints;
    raceOppFin=false;raceOppForfeit=false;raceLocalFin=false;raceResult=null;
    raceOppX=SCREEN_WM;raceOppY=SCREEN_HM;raceOppDir=270;raceOppSpd=0;raceOppGhostTrail=[];
    raceOppDrift=null;raceOppIceAccum=0;raceOppDevPfx=0;
    if(raceChannel){raceChannel.unsubscribe();raceChannel=null;}
    raceChannel=db.channel('ice-drift-race-'+raceSessionId,{config:{presence:{key:currentUser.id}}});
    raceChannel
        .on('broadcast',{event:'pos'},({payload})=>{
            if(payload.uid!==raceOpponent?.uid)return;
            const _rNow=performance.now();
            raceOppX=payload.x;raceOppY=payload.y;raceOppDir=payload.dir||270;
            raceOppSpd=payload.spd||0;raceOppDrift=payload.drift||null;
            // ghost trail
            raceOppGhostTrail=raceOppGhostTrail.filter(g=>_rNow-g.born<g.life);
            const _gl=raceOppGhostTrail.length>0?raceOppGhostTrail[raceOppGhostTrail.length-1]:null;
            const _dx=_gl?raceOppX-_gl.wx:999,_dy=_gl?raceOppY-_gl.wy:999;
            if(raceOppSpd>20&&_dx*_dx+_dy*_dy>22*22)
                raceOppGhostTrail.push({wx:raceOppX,wy:raceOppY,dir:raceOppDir,born:_rNow,life:380});
        })
        .on('broadcast',{event:'finish'},({payload})=>{
            if(payload.uid!==raceOpponent?.uid)return;
            raceOppFin=true;raceOppFinTime=payload.time;checkRaceEnd();
        })
        .on('broadcast',{event:'forfeit'},({payload})=>{
            if(payload.uid!==raceOpponent?.uid)return;
            raceOppForfeit=true;checkRaceEnd();
        })
        .on('broadcast',{event:'race_start'},({payload})=>{
            if(raceState!=='ready')return;
            raceStartAt=payload.startAt;
            raceState='map_anim';raceMapAnimStart=performance.now();
            currentLevel=raceMap;levelLoaded=false;
        })
        .on('presence',{event:'sync'},()=>{
            if(raceState!=='ready')return;
            const st=raceChannel.presenceState();
            const uids=Object.keys(st).sort();
            if(uids.length>=2&&uids[0]===currentUser.id){
                // lowest uid initiates the start
                raceStartAt=Date.now()+4500;
                raceChannel.send({type:'broadcast',event:'race_start',payload:{startAt:raceStartAt}});
                raceState='map_anim';raceMapAnimStart=performance.now();
                currentLevel=raceMap;levelLoaded=false;
            }
        })
        .subscribe(async(s)=>{
            if(s==='SUBSCRIBED')await raceChannel.track({uid:currentUser.id,username:currentUsername});
        });
}
function checkRaceEnd(){
    if(raceResult)return;
    if(raceOppForfeit){applyRaceResult(true);return;}
    if(raceLocalFin){applyRaceResult(!raceOppFin||raceLocalFinTime<raceOppFinTime);return;}
    if(raceOppFin){applyRaceResult(false);}
}
function applyRaceResult(won){
    if(raceResult)return;
    const isRandom=raceMode==='random';
    const _gainDc=isRandom?Math.max(0,Math.ceil((raceOpponent?.dc||0)*0.1)):0;
    const _gainTp=isRandom?Math.max(0,Math.ceil((raceOpponent?.tp||0)*0.1)):0;
    const _lossDc=isRandom?Math.ceil(raceMyDcAtStart*0.1):0;
    const _lossTp=isRandom?Math.ceil(raceMyTpAtStart*0.1):0;
    if(won){driftCoins+=_gainDc;totalTalentPoints+=_gainTp;}
    else{driftCoins=Math.max(0,driftCoins-_lossDc);totalTalentPoints=Math.max(spentTalentPoints,totalTalentPoints-_lossTp);}
    dbSaveProfileNow();
    raceResult={won,dcDelta:won?_gainDc:-_lossDc,tpDelta:won?_gainTp:-_lossTp};
    finish=false;levelLoaded=false;page='RACE_RESULT';
}
function leaveRaceAll(){
    leaveRaceQueueChannel();leaveRaceChallengeChannel();
    if(raceChannel){raceChannel.unsubscribe();raceChannel=null;}
    raceState='menu';raceOpponent=null;raceSessionId=null;raceResult=null;raceIncoming=null;
    raceChallengeInput='';raceChallengeError='';raceStartAt=0;finish=false;levelLoaded=false;
    duelIncoming=null;duelInput='';duelError='';clearTimeout(duelWaitTimeout);
}
function joinChatChannel(){
    if(chatChannel)return;
    chatChannel=db.channel('ice-drift-chat');
    chatChannel
        .on('broadcast',{event:'chat'},({payload})=>{
            const m={uid:payload.uid||'',username:payload.username||'',text:(payload.text||'').slice(0,80),ts:Date.now()};
            chatMessages.push(m);chatHistory.push(m);
            if(chatMessages.length>CHAT_MAX)chatMessages.shift();
        })
        .subscribe();
}
function leaveChatChannel(){
    if(!chatChannel)return;
    chatChannel.unsubscribe();
    chatChannel=null;
}
function subscribeToProfile(){
    if(profileChannel||!currentUser)return;
    profileChannel=db.channel('profile-'+currentUser.id)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:'id=eq.'+currentUser.id},payload=>{
            const d=payload.new;
            if(typeof d.drift_coins==='number'&&!_saveProfileTimer) driftCoins=d.drift_coins;
            if(typeof d.total_talent_points==='number'&&!_saveProfileTimer){totalTalentPoints=Math.max(0,d.total_talent_points);talentRecomputeEffects();}
            if(d.muted_until!==undefined) mutedUntil=d.muted_until?new Date(d.muted_until).getTime():0;
        })
        .subscribe();
}
function unsubscribeFromProfile(){
    if(!profileChannel)return;
    profileChannel.unsubscribe();
    profileChannel=null;
}
async function subscribeToVersion(){
    const{data}=await db.from('game_version').select('version').eq('id',1).single();
    if(data&&data.version!==UPDATE_LOG[0].date){
        await db.from('game_version').update({version:UPDATE_LOG[0].date,updated_at:new Date().toISOString()}).eq('id',1);
    }
    db.channel('game-version-watch')
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_version'},()=>{location.reload();})
        .subscribe();
}
