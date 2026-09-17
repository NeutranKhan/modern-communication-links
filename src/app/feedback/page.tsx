import {Heading} from '@/components/public';
import {FeedbackForm} from '@/components/feedback-form';
import {socialMetadata} from '@/lib/site';
export const metadata={title:'Visitor feedback',description:'Tell Modern Communication Links about your website or workshop experience.',alternates:{canonical:'/feedback'},openGraph:socialMetadata('Visitor feedback','/feedback')};
export default function FeedbackPage(){return <><Heading eyebrow="WE’RE LISTENING" title="Help us make learning better."><p>Share your experience, suggestions, or ideas about our website and workshops.</p></Heading><section className="wrap page-content"><FeedbackForm/></section></>;}
