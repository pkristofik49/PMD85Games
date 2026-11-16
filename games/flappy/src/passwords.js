import {sectorPasswords} from '../assets/sector-passwords.js';
export function findSectorPassword(input){
 if(typeof input!=='string')return null;
 const code=input.trim().toUpperCase();
 return sectorPasswords.find(entry=>entry.code===code)??null;
}
export function availableSectors(unlocked,bonus){
 return [...new Set([...Array.from({length:unlocked},(_,i)=>i+1),...bonus])].sort((a,b)=>a-b);
}
