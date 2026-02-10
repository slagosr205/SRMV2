import getSemaforoColor, { formatFecha } from '@/lib/ticket';
import { Ticket } from '@/types';

interface Props {
  ticket: Ticket;
  onOpen: (ticketId: number) => void;
  isLoading?: boolean;
}

export default function TicketCard({ ticket, onOpen, isLoading }: Props) {
  const semaforo = getSemaforoColor(
    ticket.ticket_fecha_final_estimada,
    ticket.ticket_fecha_final
  );

  return (
    <div
      onClick={() => !isLoading && onOpen(ticket.ticket_id)}
      className={`bg-white border border-[#d4e8d4] rounded-lg shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden ${
        isLoading ? 'pointer-events-none' : ''
      }`}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin text-[#2b8838]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium text-[#2b8838]">Cargando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-3 py-2 border-b border-[#d4e8d4] flex items-center justify-between">
        <span className="font-semibold text-sm text-[#002c28]">
          #{ticket.ticket_id}
        </span>

        <span
          className={`text-xs px-2 py-1 rounded-full text-white ${semaforo}`}
        >
          {ticket.ticket_prioridad}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-xs text-[#4a6b4a] space-y-1">
        <div className="line-clamp-2 text-[#002c28]/80">
          {ticket.ticket_descripcion}
        </div>

        <div>
          <span className="font-medium text-[#002c28]">Creado:</span>{' '}
          {formatFecha(ticket.ticket_fecha_creacion)}
        </div>

        {ticket.ticket_fecha_final && (
          <div>
            <span className="font-medium text-[#002c28]">Finalizado:</span>{' '}
            {formatFecha(ticket.ticket_fecha_final)}
          </div>
        )}
      </div>
    </div>
  );
}
