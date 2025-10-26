import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const STORE_KEY = "scheduled.v1.state";

export default function App() {
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
  const [eventsByDay, setEventsByDay] = useState({
    Monday: [{ time: "07:00", text: "Wake Up" }, { time: "09:00", text: "Code" }],
    Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [dates, setDates]   = useState([{ date: "2025-08-01", text: "Trees" }]);
  const [goals, setGoals]   = useState(["Run 3 miles", "Ship Play Store build"]);
  const [tasks, setTasks]   = useState([{ when: "today", text: "Call vendor" }]);
  const [cmd, setCmd]       = useState("");
  const [flash, setFlash]   = useState("");
  const [exportTxt, setExportTxt] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [weekMode, setWeekMode] = useState(false);

  const pad2 = (n)=> (n<10?`0${n}`:`${n}`);
  const fmt  = (s)=> s.trim().replace(/\s+/g," ");
  const to24h = (t)=>{
    const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null; let [,hh,mm,ap] = m; hh=+hh; mm=mm?+mm:0;
    if (ap){ ap=ap.toLowerCase(); if(ap==="am"&&hh===12) hh=0; if(ap==="pm"&&hh<12) hh+=12; }
    if(hh<0||hh>23||mm<0||mm>59) return null; return `${pad2(hh)}:${pad2(mm)}`;
  };
  const toISODate = (s)=>{
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d=new Date(s); return isNaN(d)?null:`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  };
  const normDay = (s)=>{
    const t=s.trim().toLowerCase();
    return DAYS.find(d=>d.toLowerCase().startsWith(t))||null;
  };

  const stateObj = useMemo(()=>({selectedDay,eventsByDay,dates,goals,tasks}),[selectedDay,eventsByDay,dates,goals,tasks]);

  // Load
  useEffect(()=>{(async()=>{
    try{ const raw=await AsyncStorage.getItem(STORE_KEY);
      if(raw){ const s=JSON.parse(raw);
        if(s?.eventsByDay&&s?.dates&&s?.goals&&s?.tasks){
          setSelectedDay(s.selectedDay||DAYS[new Date().getDay()]);
          setEventsByDay(s.eventsByDay); setDates(s.dates); setGoals(s.goals); setTasks(s.tasks);
          ping("Loaded saved state");
        }
      }
    }catch(e){console.warn("Load failed",e);}
  })();},[]);
  // Auto-save
  const saveTimer=useRef(null);
  useEffect(()=>{
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      try{ await AsyncStorage.setItem(STORE_KEY, JSON.stringify(stateObj)); }catch(e){}
    },300);
    return ()=> saveTimer.current && clearTimeout(saveTimer.current);
  },[stateObj]);

  const ping = (m)=>{ setFlash(m); setTimeout(()=>setFlash(""),1200); };

  const doAdd = (t,text,day)=>{
    setEventsByDay(prev=>{
      const copy={...prev}; const d=day||selectedDay; const arr=[...(copy[d]||[])];
      arr.push({time:t,text}); arr.sort((a,b)=>a.time.localeCompare(b.time)); copy[d]=arr; return copy;
    });
  };

  const handleCommand = ()=>{
    const raw = fmt(cmd); if(!raw) return;
    const [op0,...rest0]=raw.split(" "); const op=op0.toLowerCase();
    const done=(m)=>{ ping(m); setCmd(""); };

    // HELP
    if (["help","?"].includes(op)){
      return done("add <time> <text> | date <YYYY-MM-DD|Aug 1> <text> | goal <text> | task [today|tomorrow|<date>] <text> | day <mon..sun> | del <idx|time> | edit <idx> <new text> | move <idx> <day> | week [on|off] | export | import {json} | save | load | clear");
    }

    // WEEK TOGGLE
    if (op==="week"){
      const flag = (rest0[0]||"").toLowerCase();
      setWeekMode(flag==="on" ? true : flag==="off" ? false : !weekMode);
      return done(`Week view ${weekMode?"off":"on"}`);
    }

    // ADD EVENT
    if (op==="add"||op==="event"){
      if(rest0.length<2) return done("Usage: add <time> <text>");
      const t=to24h(rest0[0]); const text=fmt(rest0.slice(1).join(" "));
      if(!t||!text) return done("Time like 7am or 19:00 then text");
      doAdd(t,text); return done(`Added ${t} ${text}`);
    }

    // DATE
    if (op==="date"){
      if(!rest0.length) return done("Usage: date <YYYY-MM-DD|Aug 1> <text>");
      const d=toISODate(rest0[0]); const text=fmt(rest0.slice(1).join(" "));
      if(!d||!text) return done("Try: date 2025-11-15 Launch");
      setDates(prev=>[...prev,{date:d,text}].sort((a,b)=>a.date.localeCompare(b.date)));
      return done(`Added date ${d}`);
    }

    // GOAL
    if (op==="goal"||op==="goals"){
      const text=fmt(rest0.join(" ")); if(!text) return done("Usage: goal <text>");
      setGoals(prev=>[...prev,text]); return done("Goal added");
    }

    // TASK
    if (op==="task"||op==="todo"){
      if(!rest0.length) return done("Usage: task [today|tomorrow|<date>] <text>");
      let when,text; const w=(rest0[0]||"").toLowerCase();
      if(["today","tomorrow"].includes(w)||toISODate(rest0[0])){ when=w==="today"?"today":w==="tomorrow"?"tomorrow":toISODate(rest0[0]); text=fmt(rest0.slice(1).join(" ")); }
      else { when="today"; text=fmt(rest0.join(" ")); }
      if(!text) return done("Add some task text");
      setTasks(prev=>[...prev,{when,text}]); return done("Task added");
    }

    // DAY
    if (op==="day"){
      const d=normDay(rest0.join(" ")); if(!d) return done("Try: day Tue");
      setSelectedDay(d); return done(`Day set to ${d}`);
    }

    // DEL <idx|time>
    if (op==="del"||op==="delete"||op==="rm"){
      const arg=rest0[0]; const d=selectedDay;
      setEventsByDay(prev=>{
        const arr=[...(prev[d]||[])];
        if(!arg) return prev;
        let out=arr;
        if (/^\d+$/.test(arg)) { const idx=+arg; out=arr.filter((_,i)=>i!==idx); }
        else if (to24h(arg)) { out=arr.filter(e=>e.time!==to24h(arg)); }
        const copy={...prev}; copy[d]=out; return copy;
      });
      return done("Deleted");
    }

    // EDIT <idx> <new text>
    if (op==="edit"){
      if(rest0.length<2||!/^\d+$/.test(rest0[0])) return done("Usage: edit <idx> <new text>");
      const idx=+rest0[0]; const text=fmt(rest0.slice(1).join(" "));
      setEventsByDay(prev=>{
        const copy={...prev}; const arr=[...(copy[selectedDay]||[])];
        if(idx>=0&&idx<arr.length){ arr[idx]={...arr[idx],text}; copy[selectedDay]=arr; }
        return copy;
      });
      return done("Edited");
    }

    // MOVE <idx> <day>
    if (op==="move"){
      if(rest0.length<2||!/^\d+$/.test(rest0[0])) return done("Usage: move <idx> <day>");
      const idx=+rest0[0]; const d=normDay(rest0[1]); if(!d) return done("Day must be Mon..Sun");
      setEventsByDay(prev=>{
        const from=[...(prev[selectedDay]||[])];
        if(idx<0||idx>=from.length) return prev;
        const item=from[idx]; const to=[...(prev[d]||[])]; to.push(item); to.sort((a,b)=>a.time.localeCompare(b.time));
        const copy={...prev}; copy[selectedDay]=from.filter((_,i)=>i!==idx); copy[d]=to; return copy;
      });
      return done(`Moved to ${d}`);
    }

    // SAVE / LOAD / BACKUP
    if (op==="save"){ (async()=>{ try{await AsyncStorage.setItem(STORE_KEY, JSON.stringify(stateObj)); done("Saved"); }catch{done("Save failed");} })(); return; }
    if (op==="load"){ (async()=>{ try{ const raw=await AsyncStorage.getItem(STORE_KEY); if(!raw) return done("Nothing saved");
      const s=JSON.parse(raw); setSelectedDay(s.selectedDay||DAYS[new Date().getDay()]); setEventsByDay(s.eventsByDay); setDates(s.dates); setGoals(s.goals); setTasks(s.tasks); done("Loaded");
    }catch{done("Load failed");} })(); return; }

    // EXPORT / IMPORT
    if (op==="export"){ setExportTxt(JSON.stringify(stateObj,null,2)); setShowExport(true); return done("Export ready"); }
    if (op==="import"){
      const json=rest0.join(" "); try{
        const s=JSON.parse(json);
        if(!(s?.eventsByDay&&s?.dates&&s?.goals&&s?.tasks)) throw new Error("shape");
        setSelectedDay(s.selectedDay||DAYS[new Date().getDay()]); setEventsByDay(s.eventsByDay); setDates(s.dates); setGoals(s.goals); setTasks(s.tasks); return done("Imported");
      }catch{ return done("Import failed: bad JSON"); }
    }

    // CLEAR
    if (op==="clear"){
      setSelectedDay(DAYS[new Date().getDay()]);
      setEventsByDay({ Monday:[],Tuesday:[],Wednesday:[],Thursday:[],Friday:[],Saturday:[],Sunday:[] });
      setDates([]); setGoals([]); setTasks([]); return done("Cleared");
    }

    return done('Unknown. Try "help".');
  };

  const dayEvents = useMemo(()=> eventsByDay[selectedDay]||[], [eventsByDay,selectedDay]);

  // Week list for weekMode
  const weekData = useMemo(()=>{
    if(!weekMode) return [];
    return DAYS.map(d=>({day:d, items:(eventsByDay[d]||[])}));
  },[weekMode,eventsByDay]);

  const Section = ({ title, children }) => (
    <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Scheduled — Command Mode {weekMode?"(Week)":"(Day)"} </Text>

      {!weekMode ? (
        <Section title={`1. Day: ${selectedDay}`}>
          {dayEvents.length===0?(
            <Text style={styles.empty}>No events. Example: <Text style={styles.code}>add 7am Yoga</Text></Text>
          ):(
            <FlatList
              data={dayEvents}
              keyExtractor={(item,idx)=>`${item.time}-${idx}`}
              renderItem={({item, index})=>(
                <View style={styles.row}>
                  <Text style={styles.idx}>{index}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                  <Text style={styles.text}>{item.text}</Text>
                </View>
              )}
            />
          )}
        </Section>
      ) : (
        <Section title={`1. Week Overview`}>
          {weekData.map(({day,items})=>(
            <View key={day} style={{marginBottom:8}}>
              <Text style={styles.weekDay}>{day}</Text>
              {items.length===0? <Text style={styles.empty}>—</Text> :
                items.map((it,idx)=>(
                  <View key={`${day}-${idx}`} style={styles.row}>
                    <Text style={styles.time}>{it.time}</Text>
                    <Text style={styles.text}>{it.text}</Text>
                  </View>
                ))
              }
            </View>
          ))}
        </Section>
      )}

      <Section title="2. Dates">
        {dates.length===0?(
          <Text style={styles.empty}>Example: <Text style={styles.code}>date 2025-11-15 Launch</Text></Text>
        ):(
          dates.map((d,i)=>(
            <View key={`${d.date}-${i}`} style={styles.row}>
              <Text style={styles.badge}>{d.date}</Text>
              <Text style={styles.text}>{d.text}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title="3. Goals">
        {goals.length===0?(
          <Text style={styles.empty}>Example: <Text style={styles.code}>goal 2,000y swim under 60m</Text></Text>
        ):(
          goals.map((g,i)=><Text key={i} style={styles.bullet}>• {g}</Text>)
        )}
      </Section>

      <Section title="4. Tasks">
        {tasks.length===0?(
          <Text style={styles.empty}>Example: <Text style={styles.code}>task tomorrow prepare screenshots</Text></Text>
        ):(
          tasks.map((t,i)=>(
            <View key={i} style={styles.row}>
              <Text style={styles.badge}>{t.when}</Text>
              <Text style={styles.text}>{t.text}</Text>
            </View>
          ))
        )}
      </Section>

      <View style={styles.cliBar}>
        <TextInput
          style={styles.input}
          value={cmd}
          onChangeText={setCmd}
          placeholder='> help | week on | day Tue | add 7am Yoga | del 1 | edit 0 "New text" | move 2 Fri | export'
          placeholderTextColor="#8c8c8c"
          autoCapitalize="none"
          onSubmitEditing={handleCommand}
          returnKeyType="go"
        />
        <TouchableOpacity onPress={handleCommand} style={styles.runBtn}><Text style={styles.runTxt}>Run</Text></TouchableOpacity>
      </View>

      {flash? <Text style={styles.flash}>{flash}</Text> : null}

      <Modal visible={showExport} transparent animationType="slide" onRequestClose={()=>setShowExport(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Export JSON</Text>
            <ScrollView style={{maxHeight:280}}>
              <Text style={{color:"#fff", fontFamily:"Courier"}}>{exportTxt}</Text>
            </ScrollView>
            <TouchableOpacity onPress={()=>setShowExport(false)} style={[styles.runBtn,{alignSelf:"flex-end", marginTop:12}]}>
              <Text style={styles.runTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:"#0e0e10", paddingHorizontal:16},
  header:{fontSize:20, fontWeight:"700", color:"#fff", marginVertical:12},
  section:{marginBottom:14, backgroundColor:"#16161a", padding:12, borderRadius:14},
  sectionTitle:{color:"#c2c2c2", fontWeight:"600", marginBottom:6},
  row:{flexDirection:"row", alignItems:"center", gap:10, marginVertical:4},
  idx:{color:"#777", width:20, textAlign:"right"},
  time:{color:"#9ad", width:56, fontVariant:["tabular-nums"]},
  text:{color:"#fff", flexShrink:1},
  bullet:{color:"#fff", marginVertical:2},
  empty:{color:"#9a9a9a"},
  code:{fontFamily:"Courier", color:"#9ad"},
  badge:{color:"#111", backgroundColor:"#9ad", paddingHorizontal:8, paddingVertical:2, borderRadius:8, overflow:"hidden"},
  cliBar:{flexDirection:"row", alignItems:"center", gap:8, marginBottom:18},
  input:{flex:1, backgroundColor:"#1e1e24", color:"#fff", paddingHorizontal:12, paddingVertical:10, borderRadius:12},
  runBtn:{backgroundColor:"#2a7", paddingHorizontal:14, paddingVertical:10, borderRadius:12},
  runTxt:{color:"#041e0f", fontWeight:"700"},
  flash:{textAlign:"center", color:"#8f8", marginBottom:10},
  modalWrap:{flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", padding:18},
  modalCard:{backgroundColor:"#16161a", borderRadius:14, padding:14},
  weekDay:{color:"#bcd", fontWeight:"700", marginBottom:2}
});