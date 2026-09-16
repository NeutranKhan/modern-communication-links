import {Heading} from '@/components/public';
import {LookupForm} from '@/components/lookup-form';
export const metadata={title:'Certificate verification',robots:{index:false,follow:false}};
export default function Verify(){return <><Heading eyebrow="CERTIFICATE VERIFICATION" title="A skill worth verifying."><p>Enter the unique code printed on a Modern Communication Links certificate.</p></Heading><section className="wrap page-content"><LookupForm certificate/></section></>}