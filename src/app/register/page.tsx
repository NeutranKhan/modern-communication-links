import {Heading} from '@/components/public';
import {RegistrationForm} from '@/components/registration-form';
import {publicData} from '@/lib/public-data';
export const dynamic='force-dynamic';
export const metadata={title:'Register for a workshop'};
export default async function Register({searchParams}:{searchParams:Promise<{workshop?:string}>}){const [data,params]=await Promise.all([publicData(),searchParams]);const open=data.workshops.filter(w=>Date.parse(w.registrationDeadline)>=Date.now()&&w.reserved<w.capacity);return <><Heading eyebrow="NO ACCOUNT NEEDED" title="Make room for something new."><p>Register online. Save your reference. Pay at our office.</p></Heading><section className="wrap page-content">{data.state==='error'?<p className="alert error" role="alert">Workshop details are temporarily unavailable. Please try again shortly.</p>:<RegistrationForm workshops={open} selected={open.some(w=>w.id===params.workshop)?params.workshop!:''}/>}</section></>}