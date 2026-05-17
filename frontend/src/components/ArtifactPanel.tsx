import React from 'react';
export default function ArtifactPanel({artifacts}:{artifacts:any[]}){return <div className='p-3 space-y-2'>{artifacts.map((a,i)=><div key={i} className='text-xs border border-slate-700 bg-slate-900 p-2 rounded'>{a.name} ({a.kind})</div>)}</div>}
