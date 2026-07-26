import { SITE_URL } from "@/lib/config";
export default function sitemap(){return ["","/oportunidades","/cadastro","/entrar","/demo","/privacidade","/termos"].map((path)=>({url:`${SITE_URL}${path}`,lastModified:new Date(),changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:.7}));}
