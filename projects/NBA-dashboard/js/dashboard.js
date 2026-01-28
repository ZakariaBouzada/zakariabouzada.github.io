// ---------------- Player stats ----------------
fetch('data/gold_player_summary.json')
    .then(res => res.json())
    .then(data => {
        const labels = data.map(p => p.player);
        const pts = data.map(p => p.avg_season_pts);
        const ast = data.map(p => p.avg_season_ast);
        const trb = data.map(p => p.avg_season_trb);

        // Update KPIs
        document.getElementById("totalPlayers").textContent = data.length;
        document.getElementById("avgPoints").textContent = (pts.reduce((a,b)=>a+b,0)/pts.length).toFixed(1);

        const ctx = document.getElementById('pointsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Points', data: pts, backgroundColor: 'rgba(0, 102, 204, 0.7)' },
                    { label: 'Assists', data: ast, backgroundColor: 'rgba(0, 169, 157, 0.7)' },
                    { label: 'Rebounds', data: trb, backgroundColor: 'rgba(255, 159, 64, 0.7)' }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    });

// ---------------- Player advanced stats ----------------
fetch('data/gold_player_adv.json')
    .then(res => res.json())
    .then(data => {
        const labels = data.map(p => p.player);
        const triple = data.map(p => p.total_triple_doubles);
        const doubleD = data.map(p => p.total_double_doubles);

        const ctx = document.getElementById('advStatsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Triple Doubles', data: triple, backgroundColor: 'rgba(102, 0, 204, 0.7)' },
                    { label: 'Double Doubles', data: doubleD, backgroundColor: 'rgba(204, 102, 0, 0.7)' }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // Update KPI
        document.getElementById("tripleDoubles").textContent = triple.reduce((a,b)=>a+b,0);
    });

// ---------------- League-wide average stats ----------------
fetch('data/league_avg_stats.json')
    .then(res => res.json())
    .then(data => {
        const labels = data.map(d => d.season_year);
        const pts = data.map(d => d.avg_pts);
        const ast = data.map(d => d.avg_ast);
        const trb = data.map(d => d.avg_trb);

        const ctx = document.getElementById('leagueStatsChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Avg Points', data: pts, borderColor: 'rgba(0, 102, 204, 0.8)', fill: false },
                    { label: 'Avg Assists', data: ast, borderColor: 'rgba(0, 169, 157, 0.8)', fill: false },
                    { label: 'Avg Rebounds', data: trb, borderColor: 'rgba(255, 159, 64, 0.8)', fill: false }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    });

// ---------------- Selected teams over time ----------------
/*fetch('data/team_stats.json')
    .then(res => res.json())
    .then(data => {
        const selectedTeams = ["LAL", "BOS","GSW","OKC","MIL","HOU","CHI","ATL","PHI","NYK","DET"];

        // Get unique, sorted years for x-axis
        const years = [...new Set(data.map(d => d.season_year))].sort((a, b) => a - b);

        const ctx = document.getElementById('teamStatsChart').getContext('2d');

        const datasets = selectedTeams.map(team => {
            return {
                label: team,
                data: years.map(year => {
                    const entry = data.find(d => d.tm === team && d.season_year === year);
                    return entry ? entry.avg_pts : null; // fill null for missing years
                }),
                borderColor: team === "LAL" ? 'rgba(255, 206, 86, 0.8)' :
                    team === "BOS" ? 'rgba(0, 128, 0, 0.8)' :
                        team === "GSW" ? 'rgba(0, 102, 204, 0.8)' :
                            'rgba(128, 128, 128, 0.7)',
                fill: false,
                tension: 0.2
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: "Average Points" }
                    },
                    x: {
                        title: { display: true, text: "Season Year" }
                    }
                }
            }
        });
    });*/


