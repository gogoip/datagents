import { create } from 'zustand';
import { AgentInfo, AgentStatus } from '../types';

type State = {sessionId:string;agents:AgentInfo[];selected:string[];messages:string[];artifacts:any[];agentStatus:Record<string,AgentStatus>;pendingAction?:string;set:(p:Partial<State>)=>void}
export const useCouncilStore=create<State>((set)=>({sessionId:'',agents:[],selected:[],messages:[],artifacts:[],agentStatus:{},set:(p)=>set(p)}))
