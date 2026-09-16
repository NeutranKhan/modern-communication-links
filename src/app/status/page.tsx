import {Heading} from '@/components/public';
import {LookupForm} from '@/components/lookup-form';
export const metadata={title:'Registration status',robots:{index:false,follow:false}};
export default function Status(){return <><Heading eyebrow="YOUR REGISTRATION" title="Know where you stand."><p>Use your reference and phone number to check payment and attendance.</p></Heading><section className="wrap page-content"><LookupForm/></section></>}