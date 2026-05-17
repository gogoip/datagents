import React from 'react';
export default function FileUpload({onUpload}:{onUpload:(files:File[])=>void}){return <input className='text-xs' type='file' multiple onChange={(e)=>onUpload(Array.from(e.target.files||[]))} />}
