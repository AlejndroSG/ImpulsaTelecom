<?php
// Script para configurar el cron job de recordatorios

echo "=== Configuraciu00f3n de recordatorios de fichajes ===\n";

// Verificar que el script de recordatorios existe
$scriptPath = __DIR__ . '/enviar_recordatorios.php';
if (!file_exists($scriptPath)) {
    echo "ERROR: El script de recordatorios no existe en $scriptPath\n";
    exit(1);
}

echo "Script de recordatorios encontrado.\n";

// En sistemas Windows, necesitamos usar el Task Scheduler
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    echo "Sistema detectado: Windows\n";
    echo "En Windows, se recomienda usar el Programador de tareas (Task Scheduler):\n";
    echo "1. Abra el Programador de tareas de Windows\n";
    echo "2. Cree una tarea nueva\n";
    echo "3. Configure la tarea para que se ejecute cada minuto\n";
    echo "4. Establezca la acciu00f3n como: Iniciar un programa\n";
    echo "5. Programa/script: " . PHP_BINARY . "\n";
    echo "6. Argumentos: \"$scriptPath\"\n";
    echo "7. Directorio de inicio: " . dirname($scriptPath) . "\n";
} else {
    // En sistemas Linux/Unix, podemos configurar crontab
    echo "Sistema detectado: Linux/Unix\n";
    $phpPath = PHP_BINARY;
    $command = "* * * * * $phpPath $scriptPath >> /var/log/recordatorios_cron.log 2>&1";
    
    echo "Para configurar el cron job, ejecute:\n";
    echo "crontab -e\n";
    echo "Y agregue la siguiente lu00ednea:\n";
    echo $command . "\n";
}

echo "\nInstrucciones adicionales:\n";
echo "- El script estu00e1 configurado para enviar recordatorios 5 minutos antes de cada evento.\n";
echo "- Se enviaru00e1n recordatorios para: entrada al trabajo, salida del trabajo, inicio de pausa y fin de pausa.\n";
echo "- Los logs se guardaru00e1n en la carpeta logs/ del proyecto.\n";

echo "\nPara probar el script manualmente, ejecute:\n";
echo PHP_BINARY . " $scriptPath\n";

echo "\n=== Fin de la configuraciu00f3n ===\n";
