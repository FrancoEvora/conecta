import { NextResponse } from "next/server";
import { authWithPassword } from "@/lib/supabase";
export async function POST(request){try{const {email,password}=await request.json();if(!email||!password)return NextResponse.json({error:"Informe e-mail e senha."},{status:400});const data=await authWithPassword(email,password);return NextResponse.json({ok:true,session:{accessToken:data.access_token,refreshToken:data.refresh_token,expiresIn:data.expires_in,user:data.user}});}catch(error){return NextResponse.json({error:error.message||"Credenciais inválidas."},{status:401});}}
