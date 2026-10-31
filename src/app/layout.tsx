import type {Metadata} from 'next';import './site.css';
export const metadata:Metadata={title:'Beresin Rumah',description:'Home cleaning panggilan yang terpercaya di Ciamis dan sekitarnya.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
