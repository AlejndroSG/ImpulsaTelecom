import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminStatsChart = ({ isDarkMode }) => {
    // Datos de ejemplo para el gráfico
    const data = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Usuarios activos',
                data: [12, 19, 14, 17, 22, 15, 10],
                backgroundColor: isDarkMode ? 'rgba(165,255,13,0.7)' : 'rgba(145,227,2,0.7)',
                borderRadius: 8,
                maxBarThickness: 30,
            },
            {
                label: 'Tareas completadas',
                data: [8, 14, 11, 10, 18, 9, 5],
                backgroundColor: isDarkMode ? 'rgba(197,81,95,0.7)' : 'rgba(197,81,95,0.5)',
                borderRadius: 8,
                maxBarThickness: 30,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: isDarkMode ? '#fff' : '#222',
                    font: { size: 14 }
                }
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: isDarkMode ? '#a5ff0d' : '#5a8a01',
                    font: { size: 13 }
                }
            },
            y: {
                grid: {
                    color: isDarkMode ? '#333' : '#e0e0e0',
                },
                ticks: {
                    color: isDarkMode ? '#fff' : '#222',
                    font: { size: 13 }
                }
            }
        }
    };

    return (
        <div className="w-full h-64">
            <Bar data={data} options={options} />
        </div>
    );
};

export default AdminStatsChart;
