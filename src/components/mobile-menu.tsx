'use client';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';

export function MobileMenu({links}:{links:string[][]}){
 const menu=useRef<HTMLDetailsElement>(null);
 const pathname=usePathname();
 useEffect(()=>{if(menu.current)menu.current.open=false;},[pathname]);
 useEffect(()=>{
  function outside(event:PointerEvent|FocusEvent){
   if(event.target instanceof Node&&!menu.current?.contains(event.target)&&menu.current)menu.current.open=false;
  }
  function escape(event:KeyboardEvent){
   if(event.key==='Escape'&&menu.current?.open){
    menu.current.open=false;
    menu.current.querySelector('summary')?.focus();
   }
  }
  document.addEventListener('pointerdown',outside);
  document.addEventListener('focusin',outside);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);document.removeEventListener('keydown',escape);};
 },[]);
 return <details ref={menu} className="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>{if(menu.current)menu.current.open=false;}}>{label}</Link>)}</nav></details>;
}
