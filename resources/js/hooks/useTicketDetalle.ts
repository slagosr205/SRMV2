import { useState } from 'react';
import { Adjunto, Bitacora, Permisos, Resultado, Ticket, ValorCampo } from '@/types';

import ticket2 from '@/routes/ticket';


interface TicketDetalleResponse {
  detalle: {
    ticket: Ticket;
    bitacora: Bitacora[];
    resultados: Resultado[];
    adjuntos: Adjunto[];
    valores_campos: ValorCampo[];
    permisos: Permisos;
  };
}


export function useTicketDetalle() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [bitacora, setBitacora] = useState<Bitacora[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [valoresCampos, setValoresCampos] = useState<ValorCampo[]>([]);
  const [permisos, setPermisos] = useState<Permisos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const abrirTicket = async (ticketId: number) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(ticket2.show(ticketId).url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('No se pudo cargar el ticket');
      }

      const data: TicketDetalleResponse = await res.json();
      setTicket(data.detalle.ticket);
      setBitacora(data.detalle.bitacora);
      setResultados(data.detalle.resultados ?? []);
      setAdjuntos(data.detalle.adjuntos ?? []);
      setValoresCampos(data.detalle.valores_campos ?? []);
      setPermisos(data.detalle.permisos);
      setIsOpen(true);
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const cerrarTicket = () => {
    setIsOpen(false);
    setTicket(null);
    setBitacora([]);
    setResultados([]);
    setAdjuntos([]);
    setValoresCampos([]);
    setPermisos(null);
    setError(null);
  };

  return {
    ticket,
    bitacora,
    resultados,
    adjuntos,
    valoresCampos,
    permisos,
    loading,
    error,
    isOpen,
    abrirTicket,
    cerrarTicket,
  };
}
