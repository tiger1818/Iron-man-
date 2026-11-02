// One semantic command channel for every input device.
export const COMMANDS=Object.freeze(['NEXT_SCENE','PREVIOUS_SCENE','GO_TO_SCENE','SELECT','DESELECT','FOCUS','ZOOM','ROTATE','RESET_CAMERA','TOGGLE_DETAILS','ENTER_PRESENT','EXIT_PRESENT']);
const INPUTS=new Set(['keyboard','mouse','touch','gesture','system']);
export function validateCommand(command){
 if(!command||!COMMANDS.includes(command.type))return {ok:false,reason:'Unknown command'};
 if(!INPUTS.has(command.inputSource))return {ok:false,reason:'Invalid input source'};
 if(command.type==='GO_TO_SCENE'&&(!Number.isInteger(command.index)||command.index<0))return {ok:false,reason:'Invalid scene index'};
 if(command.type==='ZOOM'&&(!Number.isFinite(command.delta)||Math.abs(command.delta)>10))return {ok:false,reason:'Invalid zoom delta'};
 if(command.type==='ROTATE'&&(!Number.isFinite(command.dx)||!Number.isFinite(command.dy)))return {ok:false,reason:'Invalid rotation'};
 return {ok:true};
}
export function reducePresenter(state,command){
 const valid=validateCommand(command);if(!valid.ok)return {ok:false,state,reason:valid.reason};
 const count=Math.max(0,Number(state.sceneCount)||0),selected=Math.max(0,Math.min(count-1,Number(state.sceneIndex)||0));
 const next={...state,sceneIndex:selected};
 switch(command.type){
 case 'NEXT_SCENE':if(count)next.sceneIndex=Math.min(count-1,selected+1);break;
 case 'PREVIOUS_SCENE':if(count)next.sceneIndex=Math.max(0,selected-1);break;
 case 'GO_TO_SCENE':if(command.index>=count)return {ok:false,state,reason:'Scene does not exist'};next.sceneIndex=command.index;break;
 case 'ENTER_PRESENT':next.mode='present';break;
 case 'EXIT_PRESENT':next.mode='edit';next.selectedNodeId=null;break;
 case 'SELECT':next.selectedNodeId=command.targetId||null;break;
 case 'DESELECT':next.selectedNodeId=null;break;
 case 'TOGGLE_DETAILS':next.showDetails=!Boolean(state.showDetails);break;
 case 'ZOOM':next.zoom=Math.max(2,Math.min(40,(Number(state.zoom)||13)+command.delta));break;
 case 'ROTATE':next.yaw=(Number(state.yaw)||0)+command.dx;next.pitch=Math.max(-1.3,Math.min(1.3,(Number(state.pitch)||0)+command.dy));break;
 case 'RESET_CAMERA':next.yaw=0;next.pitch=0;next.zoom=13;break;
 case 'FOCUS':next.focusId=command.targetId||null;break;
 }
 return {ok:true,state:next};
}
export function createCommandBus(initialState,onChange=()=>{}){
 let state={...initialState};
 return {dispatch(command){const result=reducePresenter(state,command);if(result.ok){state=result.state;onChange(state,command)}return result},getState(){return {...state}}};
}
