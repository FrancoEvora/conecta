import Link from "next/link";
import { Header } from "@/components/UI";
export default function NotFound(){return <><Header minimal/><main className="not-found"><span>404</span><h1>Este convite não está disponível.</h1><p>O link pode ter expirado, sido desativado ou não corresponder a uma campanha ativa.</p><Link className="button button--orange" href="/">Voltar ao início</Link></main></>}
