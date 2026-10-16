// Presentation only. Continue still goes through the authoritative transaction;
// it never awards XP or marks an undefeated encounter cleared in the browser.
export function canAutoResume(game,locked=false){
  return !locked&&['victory','escape'].includes(game.result?.type);
}
// A direction sign belongs at the outing entrance, not on every repeated tile.
// Return-home navigation itself stays available from all road sections.
export function showOakwoodMarker(journey){
  return !!journey?.outing&&journey.mode===1&&journey.section===0;
}
