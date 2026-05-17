export type AgentStatus = 'idle'|'thinking'|'running_tool'|'waiting_approval'|'done'|'error'
export type AgentInfo = {id:string;name:string;description:string}
export type StreamEvent = {type:string;agent?:string;message?:string;pending_action?:string;name?:string;kind?:string;content?:any}
