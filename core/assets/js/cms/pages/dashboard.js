import { Chart, BarElement, BarController, CategoryScale, LinearScale, Colors } from 'chart.js';
Chart.register(BarElement, BarController, CategoryScale, LinearScale, Colors);

export default async function () {

    const ctx = document.getElementById('myChart');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'Octobre',
                'November',
                'December'
            ],
            datasets: [{
                data: [1, 12, 7, 5, 2, 3, 4, 6, 6, 15, 13, 19],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

}