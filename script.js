document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // !!! IMPORTANT: Paste your new API key from Twelve Data here
    const apiKey = 'f304d0efc168451fb46ed3704ddd58d5';

    // List of stocks to display on the homepage
    const trackedStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];

    // --- PAGE DETECTION ---
    const isHomePage = document.getElementById('stock-list-container');
    const isDetailsPage = document.getElementById('chart-container');

    if (isHomePage) {
        loadStockListPage();
    }

    if (isDetailsPage) {
        loadStockDetailsPage();
    }

    // --- HOMEPAGE LOGIC (Updated for Twelve Data) ---
    async function loadStockListPage() {
        const container = document.getElementById('stock-list-container');
        const symbols = trackedStocks.join(',');
        const apiUrl = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();

            container.innerHTML = ''; // Clear skeleton loaders

            // Handle both single and multiple symbol responses
            const stocks = Array.isArray(data) ? data : (data.symbol ? [data] : Object.values(data));

            stocks.forEach(stock => {
                const price = parseFloat(stock.close).toFixed(2);
                const change = parseFloat(stock.change).toFixed(2);
                const changePercent = parseFloat(stock.percent_change).toFixed(2);
                const colorClass = change >= 0 ? 'increase' : 'decrease';

                const stockCard = document.createElement('div');
                stockCard.className = 'stock-card';
                stockCard.innerHTML = `
                    <div class="card-header">
                        <h3>${stock.symbol}</h3>
                        <span>${stock.name}</span>
                    </div>
                    <div class="card-price ${colorClass}">$${price}</div>
                    <div class="card-change ${colorClass}">${change} (${changePercent}%)</div>
                `;
                
                stockCard.addEventListener('click', () => {
                    window.location.href = `details.html?symbol=${stock.symbol}`;
                });

                container.appendChild(stockCard);
            });

        } catch (error) {
            console.error("Failed to fetch stock list:", error);
            container.innerHTML = '<p>Error loading stock data. Please try again later.</p>';
        }
    }

    // --- DETAILS PAGE LOGIC (Updated for Twelve Data) ---
    async function loadStockDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const symbol = urlParams.get('symbol');

        if (!symbol) {
            document.body.innerHTML = '<h1>No stock symbol provided.</h1><a href="index.html">Go Back</a>';
            return;
        }

        const quoteUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
        const historyUrl = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=180&apikey=${apiKey}`;

        try {
            const [quoteResponse, historyResponse] = await Promise.all([
                fetch(quoteUrl),
                fetch(historyUrl)
            ]);

            const quoteData = await quoteResponse.json();
            const historyData = await historyResponse.json();

            updateDetailsUI(quoteData);
            renderStockChart(historyData.values, quoteData.name);

        } catch (error) {
            console.error("Failed to fetch stock details:", error);
        }
    }

    function updateDetailsUI(data) {
        const change = parseFloat(data.change).toFixed(2);
        const changePercent = parseFloat(data.percent_change).toFixed(2);
        const colorClass = change >= 0 ? 'increase' : 'decrease';
        const marketCap = data.market_cap ? `$${(data.market_cap / 1e9).toFixed(2)}B` : '--';

        document.getElementById('stock-name-title').textContent = data.name;
        document.getElementById('stock-symbol-title').textContent = data.symbol;
        document.getElementById('current-price').textContent = `$${parseFloat(data.close).toFixed(2)}`;
        document.getElementById('price-change').textContent = `${change} (${changePercent}%)`;
        document.getElementById('price-change').className = `price-change-medium ${colorClass}`;

        document.getElementById('open-price').textContent = `$${parseFloat(data.open).toFixed(2)}`;
        document.getElementById('high-price').textContent = `$${parseFloat(data.high).toFixed(2)}`;
        document.getElementById('low-price').textContent = `$${parseFloat(data.low).toFixed(2)}`;
        document.getElementById('prev-close').textContent = `$${parseFloat(data.previous_close).toFixed(2)}`;
        document.getElementById('volume').textContent = parseInt(data.volume).toLocaleString();
        document.getElementById('market-cap').textContent = marketCap;
    }

    function renderStockChart(historicalData, stockName) {
        const seriesData = historicalData.map(item => ({
            x: new Date(item.datetime).getTime(),
            y: parseFloat(item.close)
        })).reverse();
        
        const options = {
            series: [{ name: stockName, data: seriesData }],
            chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
            xaxis: { type: 'datetime', labels: { style: { colors: '#8b949e' } } },
            yaxis: { labels: { style: { colors: '#8b949e' }, formatter: (val) => `$${val.toFixed(2)}` } },
            tooltip: { x: { format: 'dd MMM yyyy' }, theme: 'dark' },
            grid: { borderColor: '#30363d', strokeDashArray: 4 }
        };

        const chart = new ApexCharts(document.querySelector("#chart-container"), options);
        chart.render();
    }
});