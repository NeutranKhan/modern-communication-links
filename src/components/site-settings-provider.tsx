'use client';
import {createContext,useContext} from 'react';
import {defaultSettings,SiteSettings} from '@/lib/site-settings';
const Context=createContext<SiteSettings>(defaultSettings);
export function SiteSettingsProvider({settings,children}:{settings:SiteSettings;children:React.ReactNode}){return <Context.Provider value={settings}>{children}</Context.Provider>;}
export function useSiteSettings(){return useContext(Context);}
export function WhatsAppLink({children,className}:{children:React.ReactNode;className?:string}){const settings=useSiteSettings();return <a className={className} href={'https://wa.me/'+settings.phone1.replace('+','')}>{children}</a>;}
