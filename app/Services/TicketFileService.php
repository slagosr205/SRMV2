<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TicketFileService
{
    /**
     * Estructura de directorios para archivos de tickets:
     * storage/app/public/tickets/{ticket_id}/
     * ├── imagenes/
     * ├── pdfs/
     * ├── documentos/
     * ├── hojas_calculo/
     * ├── textos/
     * └── otros/
     */

    /**
     * Guardar un archivo en el repositorio del ticket según su tipo
     */
    public static function guardarArchivoTicket(int $ticketId, UploadedFile $archivo): string
    {
        $directorioBase = 'tickets/' . $ticketId;
        $extension = strtolower($archivo->getClientOriginalExtension());
        
        // Determinar el subdirectorio según el tipo de archivo
        $subdirectorio = self::determinarSubdirectorio($extension);
        
        // Generar nombre único para evitar conflictos
        $nombreUnico = self::generarNombreUnico($archivo->getClientOriginalName());
        
        // Ruta completa donde se guardará el archivo
        $rutaCompleta = $directorioBase . '/' . $subdirectorio . '/' . $nombreUnico;
        
        // Guardar el archivo en el directorio apropiado
        return $archivo->storeAs($directorioBase . '/' . $subdirectorio, $nombreUnico, 'public');
    }

    /**
     * Determinar el subdirectorio según el tipo de archivo
     */
    private static function determinarSubdirectorio(string $extension): string
    {
        $tiposImagen = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'];
        $tiposPDF = ['pdf'];
        $tiposDocumento = ['doc', 'docx', 'odt', 'rtf'];
        $tiposHojaCalculo = ['xls', 'xlsx', 'csv', 'ods'];
        $tiposTexto = ['txt', 'md'];
        
        if (in_array($extension, $tiposImagen)) {
            return 'imagenes';
        } elseif (in_array($extension, $tiposPDF)) {
            return 'pdfs';
        } elseif (in_array($extension, $tiposDocumento)) {
            return 'documentos';
        } elseif (in_array($extension, $tiposHojaCalculo)) {
            return 'hojas_calculo';
        } elseif (in_array($extension, $tiposTexto)) {
            return 'textos';
        } else {
            return 'otros';
        }
    }

    /**
     * Generar nombre único para el archivo
     */
    private static function generarNombreUnico(string $nombreOriginal): string
    {
        $extension = pathinfo($nombreOriginal, PATHINFO_EXTENSION);
        $nombreSinExtension = pathinfo($nombreOriginal, PATHINFO_FILENAME);
        
        // Limpiar el nombre para caracteres especiales
        $nombreLimpio = preg_replace('/[^A-Za-z0-9_-]/', '_', $nombreSinExtension);
        
        // Agregar timestamp y unique id para garantizar unicidad
        return $nombreLimpio . '_' . time() . '_' . uniqid() . '.' . $extension;
    }

    /**
     * Obtener la URL pública de un archivo
     */
    public static function obtenerUrlArchivo(string $ruta): string
    {
        return Storage::url($ruta);
    }

    /**
     * Eliminar un archivo del repositorio
     */
    public static function eliminarArchivo(string $ruta): bool
    {
        return Storage::disk('public')->delete($ruta);
    }

    /**
     * Obtener información del repositorio de un ticket
     */
    public static function obtenerRepositorioTicket(int $ticketId): array
    {
        $directorioBase = 'tickets/' . $ticketId;
        $repositorio = [];

        if (!Storage::disk('public')->exists($directorioBase)) {
            return $repositorio;
        }

        $subdirectorios = ['imagenes', 'pdfs', 'documentos', 'hojas_calculo', 'textos', 'otros'];

        foreach ($subdirectorios as $subdirectorio) {
            $rutaCompleta = $directorioBase . '/' . $subdirectorio;
            
            if (Storage::disk('public')->exists($rutaCompleta)) {
                $archivos = Storage::disk('public')->files($rutaCompleta);
                $repositorio[$subdirectorio] = [];
                
                foreach ($archivos as $archivo) {
                    $repositorio[$subdirectorio][] = [
                        'nombre' => basename($archivo),
                        'ruta' => $archivo,
                        'url' => self::obtenerUrlArchivo($archivo),
                        'tamano' => Storage::disk('public')->size($archivo),
                        'tipo' => self::obtenerMimeType($archivo),
                        'fecha_modificacion' => Storage::disk('public')->lastModified($archivo),
                    ];
                }
            }
        }

        return $repositorio;
    }

    /**
     * Obtener MIME type de un archivo
     */
    private static function obtenerMimeType(string $ruta): string
    {
        $extension = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));
        
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv' => 'text/csv',
            'txt' => 'text/plain',
            'md' => 'text/markdown',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }

    /**
     * Crear estructura de directorios para un ticket nuevo
     */
    public static function crearEstructuraTicket(int $ticketId): void
    {
        $directorioBase = 'tickets/' . $ticketId;
        $subdirectorios = ['imagenes', 'pdfs', 'documentos', 'hojas_calculo', 'textos', 'otros'];

        foreach ($subdirectorios as $subdirectorio) {
            Storage::disk('public')->makeDirectory($directorioBase . '/' . $subdirectorio);
        }
    }

    /**
     * Obtener estadísticas del repositorio de un ticket
     */
    public static function obtenerEstadisticasTicket(int $ticketId): array
    {
        $repositorio = self::obtenerRepositorioTicket($ticketId);
        $estadisticas = [
            'total_archivos' => 0,
            'tamano_total' => 0,
            'por_tipo' => []
        ];

        foreach ($repositorio as $tipo => $archivos) {
            $cantidad = count($archivos);
            $tamano = array_sum(array_column($archivos, 'tamano'));
            
            $estadisticas['total_archivos'] += $cantidad;
            $estadisticas['tamano_total'] += $tamano;
            $estadisticas['por_tipo'][$tipo] = [
                'cantidad' => $cantidad,
                'tamano' => $tamano
            ];
        }

        return $estadisticas;
    }
}