import { Header } from "@/components/UI";
import Dashboard from "./Dashboard";
export const metadata = { title:"Demonstração da plataforma" };
export default async function DemoPage({searchParams}){const query=await searchParams;return <><Header minimal/><Dashboard initialRole={query?.perfil||"conector"}/></>;}
