import AdminDashboard from '@/components/admin-dashboard';
export const metadata={title:'Staff dashboard',robots:{index:false,follow:false}};
export default function Admin(){return <section className="wrap page-content"><AdminDashboard/></section>}