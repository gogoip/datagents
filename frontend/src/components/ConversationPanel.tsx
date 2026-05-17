import React from 'react';
export default function ConversationPanel({messages}:{messages:string[]}){return <div className='p-3 h-full overflow-auto space-y-2'>{messages.map((m,i)=><div key={i} className='text-sm bg-slate-900 p-2 rounded border border-slate-700'>{m}</div>)}</div>}
