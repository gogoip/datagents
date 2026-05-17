import React from 'react';
export default function ApprovalCard({pending,onApprove}:{pending?:string;onApprove:()=>void}){if(!pending)return null;return <div className='p-2 border border-amber-500 bg-amber-900/20 rounded m-2'><div className='text-sm'>Approve pipeline generation?</div><button onClick={onApprove} className='mt-2 px-2 py-1 bg-amber-600 rounded text-xs'>Approve</button></div>}
