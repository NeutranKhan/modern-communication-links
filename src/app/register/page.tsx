import {Heading} from '@/components/public';
import {RegistrationForm} from '@/components/registration-form';
import {publicData} from '@/lib/public-data';
import {socialMetadata} from '@/lib/site';
export const dynamic='force-dynamic';
type Props={searchParams:Promise<{workshop?:string}>};
export async function generateMetadata({searchParams}:Props){
 const params=await searchParams;
 const data=await publicData();
 const workshop=data.workshops.find(w=>w.id===params.workshop);
 const path=workshop?'/register?workshop='+encodeURIComponent(workshop.id):'/register';
 const title=workshop?workshop.title+' — Register':'Register for a workshop';
 return {title,description:workshop?.summary,alternates:{canonical:path},robots:{index:false,follow:true},openGraph:socialMetadata(title,path,workshop?.summary)};
}
export default async function Register({searchParams}:Props){const [data,params]=await Promise.all([publicData(),searchParams]);const open=data.workshops.filter(w=>Date.parse(w.registrationDeadline)>=Date.now()&&w.reserved<w.capacity);const unavailable=!!params.workshop&&!open.some(w=>w.id===params.workshop);return <><Heading eyebrow="NO ACCOUNT NEEDED" title="Make room for something new."><p>Register online. Save your reference. Pay at our office.</p></Heading><section className="wrap page-content">{data.state==='error'?<p className="alert error" role="alert">Workshop details are temporarily unavailable. Please try again shortly.</p>:<>{unavailable&&<p className="alert" role="status">The workshop in this link is no longer available for registration. You can choose another available workshop below, or contact us for upcoming dates.</p>}<RegistrationForm workshops={open} selected={open.some(w=>w.id===params.workshop)?params.workshop!:''}/></>}</section></>}
