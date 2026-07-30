export const MENU = `MEDOS SENTINEL — MODO TDAH
1. Revisar seguridad
2. Verificar MEDOS
3. Crear backup
4. Restaurar
5. Abrir caso forense
6. Revisar evidencia
7. Consultar conocimiento
8. Preparar informe
9. Estado del teléfono
10. Emergencia
11. Continuar tarea anterior
12. Salir`;

export function tdahStatus(done: string, now: string, pending: string[]): string {
  return [`HECHO: ${done}`, `AHORA: ${now}`, ...pending.slice(0, 3).map((item) => `PENDIENTE: ${item}`)].slice(0, 5).join("\n");
}
