import {redact} from "./redaction.js";
const injection = /(?:ignore (?:all|previous)|system prompt|developer message|execute command|exfiltrat|reveal secret)/iu;
export type ChatReply = {status:"HECHO"|"AHORA"|"PENDIENTE";message:string;nextAction:string};
export function localChat(message:string):ChatReply{
  const clean=redact(message.normalize("NFC")).trim().slice(0,1000);
  if(!clean)return {status:"AHORA",message:"Escribe una tarea breve.",nextAction:"Indicar objetivo"};
  if(injection.test(clean))return {status:"PENDIENTE",message:"La entrada contiene instrucciones no confiables. No se ejecutó nada.",nextAction:"Reformular como objetivo defensivo"};
  if(/\b(?:sí|si|continuar)\b/iu.test(clean))return {status:"AHORA",message:"Checkpoint recuperado. Continuamos con una sola acción.",nextAction:"Revisar la tarea recomendada"};
  if(/\b(?:pausar|detener)\b/iu.test(clean))return {status:"HECHO",message:"Tarea pausada y checkpoint conservado.",nextAction:"Reanudar cuando estés listo"};
  if(/\bemergencia\b/iu.test(clean))return {status:"AHORA",message:"Desconecta la red si existe riesgo activo. No borres evidencia.",nextAction:"Abrir checklist de emergencia"};
  return {status:"PENDIENTE",message:"Modo sin modelo: organicé la solicitud, pero no ejecutaré acciones externas.",nextAction:"Crear una tarea de 5–20 minutos"};
}
