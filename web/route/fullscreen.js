// Screen-filling CSS works without a browser permission. Native fullscreen and
// orientation lock are best-effort enhancements, never gameplay requirements.
export class PlayScreen {
  constructor({doc=globalThis.document,screen=globalThis.screen,onChange=()=>{},onMessage=()=>{}}={}){
    this.doc=doc;this.screen=screen;this.onChange=onChange;this.onMessage=onMessage;
    this.active=false;this.connected=false;this.owned=false;this.epoch=0;
    this.changed=()=>{if(this.owned&&this.element()!==this.doc.documentElement){this.owned=false;try{this.screen?.orientation?.unlock?.();}catch{}this.setActive(false);}};
    this.key=e=>{if(e.key==='Escape'&&this.active)this.exit();};
    doc.addEventListener('fullscreenchange',this.changed);doc.addEventListener('webkitfullscreenchange',this.changed);doc.addEventListener('keydown',this.key);
  }
  element(){return this.doc.fullscreenElement||this.doc.webkitFullscreenElement;}
  setActive(value){if(this.active!==value){this.active=value;this.onChange(value,this.connected);}}
  async enter(native=true){
    this.setActive(true);if(!native)return true;
    const root=this.doc.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen,epoch=++this.epoch;
    if(this.element()&&this.element()!==root){this.onMessage('Another fullscreen view is active. Exit it before opening this game.');this.setActive(false);return false;}
    if(!request){this.onMessage('Screen-filling mode. This browser does not expose native fullscreen.');return true;}
    if(this.element()===root){this.onMessage('Fullscreen active · L2 or Exit to leave.');return true;}
    try{
      await request.call(root,{navigationUI:'hide'});
      if(epoch!==this.epoch||!this.active){if(this.element()===root)await this.leaveNative();return false;}
      this.owned=this.element()===root;
      if(this.owned){try{await this.screen?.orientation?.lock?.('landscape');}catch{/* Portrait CSS fallback rotates the entire play area. */}}
      if(epoch!==this.epoch||!this.active){try{this.screen?.orientation?.unlock?.();}catch{}return false;}
      this.onMessage(this.owned?'Fullscreen active · L2 or Exit to leave.':'Screen-filling mode. Tap Hide browser bars to retry native fullscreen.');
    }catch{this.onMessage('Screen-filling mode · browser bars may remain. Tap Hide browser bars to retry.');}
    return this.active;
  }
  async leaveNative(){const exit=this.doc.exitFullscreen||this.doc.webkitExitFullscreen;if(exit){try{await exit.call(this.doc);}catch{}}}
  async exit(){
    ++this.epoch;const owned=this.owned;this.owned=false;this.setActive(false);
    try{this.screen?.orientation?.unlock?.();}catch{}
    if(owned&&this.element()===this.doc.documentElement)await this.leaveNative();
    this.onMessage('Normal view · connect a controller or choose Full screen.');
  }
  toggle(){return this.active?this.exit():this.enter(true);}
  setConnected(connected){
    if(connected===this.connected)return;this.connected=connected;
    if(connected){this.onChange(this.active,true);this.enter(false);this.onMessage('Controller play mode · L2 exits. Tap Hide browser bars for native fullscreen.');}
    else {this.onChange(this.active,false);this.exit();}
  }
  dispose(){this.doc.removeEventListener('fullscreenchange',this.changed);this.doc.removeEventListener('webkitfullscreenchange',this.changed);this.doc.removeEventListener('keydown',this.key);return this.exit();}
}
export const BATTLE_WIDTH=768,BATTLE_HEIGHT=240;
export function battleViewport(width,height){
  const scale=Math.min(width/BATTLE_WIDTH,height/BATTLE_HEIGHT);
  return {scale,x:Math.max(0,(width-BATTLE_WIDTH*scale)/2),y:Math.max(0,(height-BATTLE_HEIGHT*scale)/2)};
}
export function canvasPoint(clientX,clientY,rect,width,height,rotated=false){
  return rotated?{x:(clientY-rect.top)*width/rect.height,y:(rect.right-clientX)*height/rect.width}:
    {x:(clientX-rect.left)*width/rect.width,y:(clientY-rect.top)*height/rect.height};
}
