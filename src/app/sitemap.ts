import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/site';
export default function sitemap():MetadataRoute.Sitemap {
 return ['','/about','/program','/workshops','/gallery','/testimonials','/faq','/contact','/feedback'].map(path=>({url:siteUrl+path}));
}
