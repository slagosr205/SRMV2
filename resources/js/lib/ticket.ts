export default function getSemaforoColor(
  fechaEstimada: string,
  fechaFinal: string
): string {
  if (!fechaFinal) {
    const hoy = new Date();
    const limite = new Date(fechaEstimada);

    if (hoy <= limite) return 'bg-emerald-600';
    if (hoy > limite) return 'bg-red-600';
  }

  return 'bg-gray-500';
}

export  function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleString();
}

function esTareaCritica(nombre: string): boolean {
  return nombre.startsWith('Aprob') || nombre.startsWith('Solic');
}


