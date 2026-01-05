// analytics.js - D3.js charts for crime analytics

// API base URL (fallback option)
const API_BASE = 'https://cmpt370-crimemaps-forked.onrender.com/api';

// Fetch crime data from Supabase or REST API (fallback)
async function fetchCrimeData() {
  // Try Supabase first
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('📊 Fetching data from Supabase...');
      const { data, error, count } = await supabase
        .from('SPS_COMBINED')
        .select('*', { count: 'exact' })
        .order('ReportedDate', { ascending: false })
        .limit(1000);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Crime data loaded from Supabase:', count || data.length, 'records');
      return data;
    }
  } catch (supabaseError) {
    console.warn('⚠️ Supabase fetch failed, trying REST API fallback:', supabaseError);
  }
  
  // Fallback to REST API
  try {
    console.log('📊 Fetching data from REST API...');
    const response = await fetch(`${API_BASE}/analytics/incidents?limit=1000`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Crime data loaded from REST API:', result.count, 'records');
      return result.data;
    } else {
      throw new Error('Failed to fetch crime data');
    }
  } catch (error) {
    console.error('❌ Error fetching crime data:', error);
    throw error;
  }
}

// Create bar chart for crime types
function createCrimeTypeChart(data) {
  const container = d3.select('#crimeTypeChart');
  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.append('p').text('No data available');
    return;
  }

  // Count crimes by type
  const typeCounts = d3.rollup(data, v => v.length, d => d.Type);
  const chartData = Array.from(typeCounts, ([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 crime types

  // Set up dimensions
  const margin = { top: 20, right: 30, bottom: 100, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleBand()
    .domain(chartData.map(d => d.type))
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.count)])
    .nice()
    .range([height, 0]);

  // Add bars
  g.selectAll('.bar')
    .data(chartData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.type))
    .attr('y', d => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.count))
    .attr('fill', '#667eea')
    .attr('rx', 4);

  // Add x-axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .attr('dx', '-0.5em')
    .attr('dy', '0.5em');

  // Add y-axis
  g.append('g')
    .call(d3.axisLeft(yScale));

  // Add axis labels
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Crimes');

  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
    .style('text-anchor', 'middle')
    .text('Crime Type');

  // Add value labels on bars
  g.selectAll('.bar-label')
    .data(chartData)
    .enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.count) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => d.count);
}

// Create line chart for crime trends over time
function createCrimeTrendChart(data) {
  const container = d3.select('#crimeTrendChart');
  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.append('p').text('No data available');
    return;
  }

  // Group crimes by month
  const monthlyData = d3.rollup(data, v => v.length, d => {
    const date = new Date(d.ReportedDate || Date.now());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });

  const chartData = Array.from(monthlyData, ([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Set up dimensions
  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scalePoint()
    .domain(chartData.map(d => d.month))
    .range([0, width])
    .padding(0.5);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.count)])
    .nice()
    .range([height, 0]);

  // Create line generator
  const line = d3.line()
    .x(d => xScale(d.month))
    .y(d => yScale(d.count))
    .curve(d3.curveMonotoneX);

  // Add line
  g.append('path')
    .datum(chartData)
    .attr('fill', 'none')
    .attr('stroke', '#764ba2')
    .attr('stroke-width', 3)
    .attr('d', line);

  // Add circles for data points
  g.selectAll('.dot')
    .data(chartData)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.month))
    .attr('cy', d => yScale(d.count))
    .attr('r', 5)
    .attr('fill', '#764ba2');

  // Add x-axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .attr('dx', '-0.5em')
    .attr('dy', '0.5em');

  // Add y-axis
  g.append('g')
    .call(d3.axisLeft(yScale));

  // Add axis labels
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Crimes');

  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
    .style('text-anchor', 'middle')
    .text('Month');
}

// Add chart section styling
function addChartStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .chart-section {
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
    }
    
    .chart-section h2 {
      margin-bottom: 20px;
      color: #2c3e50;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    #crimeTypeChart, #crimeTrendChart {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bar:hover {
      fill: #764ba2;
      cursor: pointer;
    }
    
    .dot:hover {
      r: 8;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

// Initialize the dashboard
async function initDashboard() {
  try {
    addChartStyles();
    const data = await fetchCrimeData();
    createCrimeTypeChart(data);
    createCrimeTrendChart(data);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    const errorMsg = 'Error loading data. Please check your Supabase connection or ensure the server is running.';
    d3.select('#crimeTypeChart').append('p')
      .style('color', '#e74c3c')
      .style('padding', '20px')
      .text(errorMsg);
    d3.select('#crimeTrendChart').append('p')
      .style('color', '#e74c3c')
      .style('padding', '20px')
      .text(errorMsg);
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

