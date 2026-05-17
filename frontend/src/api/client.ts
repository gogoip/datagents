const API='http://localhost:8000';
export const fetchAgents=()=>fetch(`${API}/agents`).then(r=>r.json());
export const uploadFiles=async(files:File[],sessionId?:string)=>{const fd=new FormData();files.forEach(f=>fd.append('files',f));const q=sessionId?`?session_id=${sessionId}`:'';return fetch(`${API}/upload${q}`,{method:'POST',body:fd}).then(r=>r.json())}
export const chat=(session_id:string,message:string,selected_agents:string[])=>fetch(`${API}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id,message,selected_agents})}).then(r=>r.json())
export const approve=(session_id:string,pending_action:string)=>fetch(`${API}/approval`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id,approved:true,pending_action})})
export const stream=(sessionId:string)=>new EventSource(`${API}/chat/stream/${sessionId}`)
