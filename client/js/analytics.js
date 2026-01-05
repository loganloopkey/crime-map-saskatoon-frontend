// analytics.js - Test Supabase connection and query views

// Get Supabase client from supabaseClient.js
function getSupabase() {
  if (typeof getSupabaseClient === 'function') {
    return getSupabaseClient();
  } else if (typeof window !== 'undefined' && window.supabaseClient) {
    return window.supabaseClient;
  } else {
    console.error('❌ Supabase client not found. Make sure supabaseClient.js is loaded first.');
    return null;
  }
}

// Query crimes_by_type view from Supabase
async function testCrimesByType() {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot test crimes_by_type: Supabase client not available');
    return null;
  }

  try {
    console.log('📊 Querying crimes_by_type view...');
    
    const { data, error, count } = await supabase
      .from('crimes_by_type')
      .select('*')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    console.log('✅ crimes_by_type query successful!');
    console.log(`📈 Total rows available: ${count || data.length}`);
    console.log('📋 First few rows from crimes_by_type:');
    
    if (data && data.length > 0) {
      // Log first 5 rows
      const sampleRows = data.slice(0, 5);
      sampleRows.forEach((row, index) => {
        console.log(`  [${index + 1}]`, row);
      });
      console.log('📊 Sample data structure:', sampleRows[0]);
    } else {
      console.warn('⚠️ No data returned from crimes_by_type view');
    }

    return data;
  } catch (error) {
    console.error('❌ Error querying crimes_by_type:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }
}

// Query crimes_over_time view from Supabase and aggregate by YEAR
// Returns data in format: [{ date: "YYYY-01-01", count: number }]
async function testCrimesOverTime() {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot test crimes_over_time: Supabase client not available');
    return null;
  }

  try {
    console.log('📊 Querying crimes_over_time view for yearly aggregation...');
    
    // First, inspect the view structure to find date column
    const { data: sampleData, error: sampleError } = await supabase
      .from('crimes_over_time')
      .select('*')
      .limit(1);

    if (sampleError) {
      throw sampleError;
    }

    if (!sampleData || sampleData.length === 0) {
      console.warn('⚠️ No data in crimes_over_time view');
      return [];
    }

    const firstRow = sampleData[0];
    const columns = Object.keys(firstRow);
    console.log('📊 Available columns:', columns);

    // Find the date column (likely 'crime_date' based on console logs)
    const possibleDateColumns = ['crime_date', 'date', 'period', 'month', 'time_period', 'year_month', 'period_date'];
    let dateColumn = null;
    for (const col of possibleDateColumns) {
      if (firstRow.hasOwnProperty(col)) {
        dateColumn = col;
        break;
      }
    }

    // If not found, search for columns containing date-related keywords
    if (!dateColumn) {
      dateColumn = columns.find(key => 
        key.toLowerCase().includes('date') || 
        key.toLowerCase().includes('period') ||
        key.toLowerCase().includes('month') ||
        key.toLowerCase().includes('time')
      );
    }

    if (!dateColumn) {
      console.error('❌ Could not find date column in view');
      return null;
    }

    console.log(`📅 Using date column: ${dateColumn}`);

    // Find count column
    const countColumn = columns.find(key => 
      key.toLowerCase() === 'count' || 
      key.toLowerCase().includes('count')
    ) || 'count';

    console.log(`📊 Using count column: ${countColumn}`);

    // Fetch all data with pagination
    let allData = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    // Determine order column for consistent ordering
    const orderColumn = dateColumn;

    while (hasMore) {
      const { data: batchData, error: batchError, count } = await supabase
        .from('crimes_over_time')
        .select('*', { count: 'exact' })
        .order(orderColumn, { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        if (offset === 0) {
          throw batchError;
        }
        console.warn(`⚠️ Error fetching batch at offset ${offset}:`, batchError);
        break;
      }

      if (!batchData || batchData.length === 0) {
        hasMore = false;
        break;
      }

      allData = allData.concat(batchData);
      console.log(`📊 Fetched batch: ${batchData.length} records (total so far: ${allData.length})`);

      // Check if there are more records
      if (batchData.length < batchSize || (count && allData.length >= count)) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    console.log(`✅ Total records fetched: ${allData.length}`);

    if (allData.length === 0) {
      console.warn('⚠️ No data returned from crimes_over_time view');
      return [];
    }

    // Aggregate by YEAR
    const aggregated = {};
    allData.forEach(row => {
      const dateValue = row[dateColumn];
      const countValue = row[countColumn] || 0;

      if (!dateValue) return;

      // Parse the date
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return;

      // Group by year, format as YYYY-01-01
      const year = `${date.getFullYear()}-01-01`;
      aggregated[year] = (aggregated[year] || 0) + (countValue || 1);
    });

    // Convert to array format: [{ date: "YYYY-01-01", count }]
    const result = Object.entries(aggregated).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log('✅ Yearly aggregation successful!', result.length, 'years');
    if (result.length > 0) {
      console.log(`📋 Year range: ${result[0].date.substring(0, 4)} to ${result[result.length - 1].date.substring(0, 4)}`);
      console.log('📋 Sample data:', result.slice(0, 3));
    }

    return result;
  } catch (error) {
    console.error('❌ Error querying crimes_over_time:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }
}

// Create horizontal bar chart for crimes by type
function createCrimesByTypeChart(data) {
  const container = d3.select('#crimeTypeChart');
  container.selectAll('*').remove();

  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    container.append('p')
      .style('color', '#e74c3c')
      .text('Error: D3.js library not loaded. Please include D3.js in your HTML.');
    return;
  }

  // Check if we have data
  if (!data || data.length === 0) {
    container.append('p')
      .style('color', '#7f8c8d')
      .style('padding', '20px')
      .style('text-align', 'center')
      .text('No data available to display.');
    return;
  }

  // Sort data by count (descending) for better visualization
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Set up dimensions and margins
  const margin = { top: 40, right: 100, bottom: 40, left: 200 };
  const width = 800;
  const height = Math.max(400, sortedData.length * 40);
  
  // Create responsive SVG with viewBox
  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('max-width', '100%')
    .style('height', 'auto');

  // Create chart group
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(sortedData, d => d.count)])
    .nice()
    .range([0, chartWidth]);

  const yScale = d3.scaleBand()
    .domain(sortedData.map(d => d.crime_type))
    .range([0, chartHeight])
    .padding(0.2);

  // Add chart title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', '600')
    .style('fill', '#2c3e50')
    .text('Crimes by Type');

  // Add X-axis (number of crimes)
  g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .append('text')
    .attr('x', chartWidth / 2)
    .attr('y', 35)
    .attr('fill', '#2c3e50')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Number of Crimes');

  // Add Y-axis (crime categories)
  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#2c3e50');

  // Add bars
  const bars = g.selectAll('.bar')
    .data(sortedData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.crime_type))
    .attr('width', d => xScale(d.count))
    .attr('height', yScale.bandwidth())
    .attr('fill', '#4A90E2')
    .attr('rx', 3);

  // Add value labels at the end of each bar
  g.selectAll('.bar-label')
    .data(sortedData)
    .enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.count) + 5)
    .attr('y', d => yScale(d.crime_type) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', '#2c3e50')
    .style('font-weight', '500')
    .text(d => d.count.toLocaleString());

  // Add hover effects
  bars.on('mouseover', function(event, d) {
    d3.select(this)
      .attr('fill', '#357ABD')
      .attr('opacity', 0.9);
  })
  .on('mouseout', function() {
    d3.select(this)
      .attr('fill', '#4A90E2')
      .attr('opacity', 1);
  });
}

// Create line chart for crimes over time
function createCrimesOverTimeChart(data) {
  const container = d3.select('#crimeTrendChart');
  container.selectAll('*').remove();

  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    container.append('p')
      .style('color', '#e74c3c')
      .text('Error: D3.js library not loaded. Please include D3.js in your HTML.');
    return;
  }

  // Check if we have data
  if (!data || data.length === 0) {
    container.append('p')
      .style('color', '#7f8c8d')
      .style('padding', '20px')
      .style('text-align', 'center')
      .text('No data available to display.');
    return;
  }

  // Validate data structure - expect format: [{ date: "YYYY-01-01", count: number }]
  if (!data[0].date || typeof data[0].date !== 'string') {
    console.error('❌ Invalid data format. Expected: [{ date: "YYYY-01-01", count: <number> }]');
    container.append('p')
      .style('color', '#e74c3c')
      .style('padding', '20px')
      .text('Error: Invalid data format. Expected date field as string.');
    return;
  }

  // Parse dates using simple format: YYYY-MM-DD (for years: YYYY-01-01)
  const parseDate = d3.timeParse('%Y-%m-%d');
  
  const processedData = data
    .map(d => {
      const parsedDate = parseDate(d.date);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        console.warn('⚠️ Invalid date format:', d.date);
        return null;
      }
      return {
        date: parsedDate,
        count: d.count || 0
      };
    })
    .filter(d => d !== null)
    .sort((a, b) => a.date - b.date);

  if (processedData.length === 0) {
    console.error('❌ No valid dates found in data');
    container.append('p')
      .style('color', '#e74c3c')
      .style('padding', '20px')
      .text('Error: Could not parse dates from data.');
    return;
  }

  console.log('📊 Processed data count:', processedData.length);
  if (processedData.length > 0) {
    console.log(`📊 Year range: ${processedData[0].date.getFullYear()} to ${processedData[processedData.length - 1].date.getFullYear()}`);
  }

  // Set up dimensions and margins
  const margin = { top: 50, right: 50, bottom: 60, left: 80 };
  const width = 800;
  const height = 400;
  
  // Create responsive SVG with viewBox
  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('max-width', '100%')
    .style('height', 'auto');

  // Create chart group
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(processedData, d => d.date))
    .range([0, chartWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.count)])
    .nice()
    .range([chartHeight, 0]);

  // Add chart title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', '600')
    .style('fill', '#2c3e50')
    .text('Crimes Over Time');

  // Create line generator with smooth curve
  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.count))
    .curve(d3.curveMonotoneX); // Smooth curve

  // Add X-axis (dates) - display years
  g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat('%Y')))
    .selectAll('text')
    .style('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('fill', '#2c3e50');

  // Add X-axis label
  g.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 50)
    .attr('fill', '#2c3e50')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Year');

  // Add Y-axis (number of crimes)
  g.append('g')
    .call(d3.axisLeft(yScale).ticks(10))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -chartHeight / 2)
    .attr('fill', '#2c3e50')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Number of Crimes');

  // Add grid lines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(1))
      .tickSize(-chartHeight)
      .tickFormat(''))
    .selectAll('line')
    .style('stroke', '#e0e0e0')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '3,3');

  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale)
      .ticks(10)
      .tickSize(-chartWidth)
      .tickFormat(''))
    .selectAll('line')
    .style('stroke', '#e0e0e0')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '3,3');

  // Add the line path
  g.append('path')
    .datum(processedData)
    .attr('fill', 'none')
    .attr('stroke', '#E24A4A')
    .attr('stroke-width', 3)
    .attr('d', line);

  // Add data points (circles)
  g.selectAll('.dot')
    .data(processedData)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScale(d.count))
    .attr('r', 4)
    .attr('fill', '#E24A4A')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('r', 6)
        .attr('fill', '#C0392B');
      
      // Show tooltip (optional)
      const tooltip = container.append('div')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(`Year: ${d3.timeFormat('%Y')(d.date)}<br/>Count: ${d.count.toLocaleString()}`);
    })
    .on('mousemove', function(event) {
      const tooltip = container.select('div');
      const rect = container.node().getBoundingClientRect();
      tooltip
        .style('left', (event.clientX - rect.left + 10) + 'px')
        .style('top', (event.clientY - rect.top - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('r', 4)
        .attr('fill', '#E24A4A');
      container.selectAll('div').remove();
    });
}

// Fetch min and max dates from database to set date input limits
async function setDateInputLimits() {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot fetch date limits: Supabase client not available');
    return;
  }

  try {
    // Get min and max dates from sps_combined table
    const { data: minData, error: minError } = await supabase
      .from('sps_combined')
      .select('ReportedDate')
      .not('ReportedDate', 'is', null)
      .order('ReportedDate', { ascending: true })
      .limit(1);

    const { data: maxData, error: maxError } = await supabase
      .from('sps_combined')
      .select('ReportedDate')
      .not('ReportedDate', 'is', null)
      .order('ReportedDate', { ascending: false })
      .limit(1);

    if (minError || maxError) {
      console.warn('⚠️ Could not fetch date limits:', minError || maxError);
      return;
    }

    if (!minData || minData.length === 0 || !maxData || maxData.length === 0) {
      console.warn('⚠️ No date data found');
      return;
    }

    const minDate = new Date(minData[0].ReportedDate);
    const maxDate = new Date(maxData[0].ReportedDate);

    if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
      console.warn('⚠️ Invalid date values');
      return;
    }

    // Format dates as YYYY-MM-DD for date inputs
    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Set min and max on date inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) {
      startDateInput.setAttribute('min', minDateStr);
      startDateInput.setAttribute('max', maxDateStr);
    }

    if (endDateInput) {
      endDateInput.setAttribute('min', minDateStr);
      endDateInput.setAttribute('max', maxDateStr);
    }

    console.log(`✅ Date input limits set: ${minDateStr} to ${maxDateStr}`);
  } catch (error) {
    console.error('❌ Error setting date input limits:', error);
  }
}

// Fetch unique neighbourhoods from Supabase
async function fetchNeighbourhoods() {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot fetch neighbourhoods: Supabase client not available');
    return [];
  }

  try {
    // Query only from sps_combined table
    const { data, error } = await supabase
      .from('sps_combined')
      .select('Neighbourhood')
      .not('Neighbourhood', 'is', null);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No neighbourhood data found in sps_combined');
      return [];
    }

    // Extract unique neighbourhoods, trim whitespace, and sort
    const neighbourhoods = [...new Set(
      data
        .map(row => row.Neighbourhood)
        .filter(Boolean)
        .map(neighbourhood => neighbourhood.trim())
    )].sort();
    
    console.log('✅ Fetched neighbourhoods:', neighbourhoods.length);
    return neighbourhoods;
  } catch (error) {
    console.error('❌ Error fetching neighbourhoods:', error);
    return [];
  }
}

// Query crimes by type with filters
async function queryCrimesByTypeFiltered(filters = {}) {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot query crimes: Supabase client not available');
    return null;
  }

  try {
    const { startDate, endDate, neighbourhood } = filters;
    
    // Build query - only use sps_combined table
    let query = supabase
      .from('sps_combined')
      .select('Type, ReportedDate, Neighbourhood');

    // Apply date filters
    if (startDate) {
      query = query.gte('ReportedDate', startDate);
    }
    if (endDate) {
      query = query.lte('ReportedDate', endDate);
    }
    
    // Apply neighbourhood filter with case-insensitive matching
    if (neighbourhood && neighbourhood.trim() !== '') {
      query = query.ilike('Neighbourhood', neighbourhood.trim());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No data found for filters');
      return [];
    }

    // Aggregate by crime type
    const aggregated = {};
    data.forEach(row => {
      const type = row.Type || 'Unknown';
      aggregated[type] = (aggregated[type] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(aggregated).map(([crime_type, count]) => ({
      crime_type,
      count
    })).sort((a, b) => b.count - a.count);

    console.log('✅ Filtered crimes_by_type query successful!', result.length, 'types');
    return result;
  } catch (error) {
    console.error('❌ Error querying filtered crimes_by_type:', error);
    return null;
  }
}

// Query crimes over time with filters
async function queryCrimesOverTimeFiltered(filters = {}) {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Cannot query crimes: Supabase client not available');
    return null;
  }

  try {
    const { startDate, endDate, neighbourhood } = filters;
    
    // Build query - only use sps_combined table
    // Fetch all matching records with pagination
    let allData = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('sps_combined')
        .select('ReportedDate, Neighbourhood', { count: 'exact' });

      // Apply date filters
      if (startDate) {
        query = query.gte('ReportedDate', startDate);
      }
      if (endDate) {
        query = query.lte('ReportedDate', endDate);
      }
      
      // Apply neighbourhood filter with case-insensitive matching
      if (neighbourhood && neighbourhood.trim() !== '') {
        query = query.ilike('Neighbourhood', neighbourhood.trim());
      }

      const { data: batchData, error: batchError, count } = await query
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        if (offset === 0) {
          throw batchError;
        }
        console.warn(`⚠️ Error fetching batch at offset ${offset}:`, batchError);
        break;
      }

      if (!batchData || batchData.length === 0) {
        hasMore = false;
        break;
      }

      allData = allData.concat(batchData);

      // Check if there are more records
      if (batchData.length < batchSize || (count && allData.length >= count)) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    const data = allData;

    if (!data || data.length === 0) {
      console.warn('⚠️ No data found for filters');
      return [];
    }

    // Aggregate by YEAR (even when filtering)
    const aggregated = {};
    data.forEach(row => {
      if (!row.ReportedDate) return;
      
      const date = new Date(row.ReportedDate);
      if (isNaN(date.getTime())) return;
      
      // Group by year, format as YYYY-01-01
      const year = `${date.getFullYear()}-01-01`;
      aggregated[year] = (aggregated[year] || 0) + 1;
    });

    // Convert to array format: [{ date: "YYYY-01-01", count }]
    const result = Object.entries(aggregated).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log('✅ Filtered crimes_over_time query successful!', result.length, 'years');
    return result;
  } catch (error) {
    console.error('❌ Error querying filtered crimes_over_time:', error);
    return null;
  }
}

// Apply filters and update charts
async function applyFilters() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const neighbourhood = document.getElementById('neighbourhood').value;
  
  const loadingMessage = document.getElementById('loadingMessage');
  loadingMessage.style.display = 'block';

  const filters = {
    startDate: startDate || null,
    endDate: endDate || null,
    neighbourhood: neighbourhood || null
  };

  try {
    // Query filtered data
    const [crimesByType, crimesOverTime] = await Promise.all([
      queryCrimesByTypeFiltered(filters),
      queryCrimesOverTimeFiltered(filters)
    ]);

    // Update charts
    if (crimesByType && crimesByType.length > 0) {
      createCrimesByTypeChart(crimesByType);
    } else {
      const container = d3.select('#crimeTypeChart');
      container.selectAll('*').remove();
      container.append('p')
        .style('color', '#7f8c8d')
        .style('padding', '20px')
        .style('text-align', 'center')
        .text('No data available for the selected filters.');
    }

    if (crimesOverTime && crimesOverTime.length > 0) {
      createCrimesOverTimeChart(crimesOverTime);
    } else {
      const container = d3.select('#crimeTrendChart');
      container.selectAll('*').remove();
      container.append('p')
        .style('color', '#7f8c8d')
        .style('padding', '20px')
        .style('text-align', 'center')
        .text('No data available for the selected filters.');
    }
  } catch (error) {
    console.error('❌ Error applying filters:', error);
  } finally {
    loadingMessage.style.display = 'none';
  }
}

// Reset filters
function resetFilters() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('neighbourhood').value = '';
  
  // Reload original data
  testSupabaseConnection();
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('='.repeat(50));
  
  // Check if Supabase client is available
  const supabase = getSupabase();
  if (!supabase) {
    console.error('❌ Supabase client initialization failed!');
    console.error('Make sure:');
    console.error('  1. Supabase CDN is loaded in the HTML');
    console.error('  2. supabaseClient.js is loaded before this script');
    return;
  }

  console.log('✅ Supabase client initialized successfully');
  console.log('='.repeat(50));

  // Set date input limits based on database date range
  await setDateInputLimits();

  // Load neighbourhoods
  const neighbourhoods = await fetchNeighbourhoods();
  const neighbourhoodSelect = document.getElementById('neighbourhood');
  neighbourhoodSelect.innerHTML = '<option value="">All Neighbourhoods</option>';
  neighbourhoods.forEach(neighbourhood => {
    const option = document.createElement('option');
    option.value = neighbourhood;
    option.textContent = neighbourhood;
    neighbourhoodSelect.appendChild(option);
  });

  // Test crimes_by_type view
  console.log('\n📊 Testing crimes_by_type view...');
  const crimesByType = await testCrimesByType();
  
  // Render chart if we have data
  if (crimesByType && crimesByType.length > 0) {
    console.log('📊 Rendering bar chart...');
    createCrimesByTypeChart(crimesByType);
  } else {
    console.warn('⚠️ No data to render chart');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Test crimes_over_time view
  console.log('\n📊 Testing crimes_over_time view...');
  const crimesOverTime = await testCrimesOverTime();
  
  // Render line chart if we have data
  if (crimesOverTime && crimesOverTime.length > 0) {
    console.log('📊 Rendering line chart...');
    createCrimesOverTimeChart(crimesOverTime);
  } else {
    console.warn('⚠️ No data to render line chart');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Connection test complete!');
  
  // Summary
  if (crimesByType && crimesOverTime) {
    console.log('\n📊 Summary:');
    console.log(`  ✅ crimes_by_type: ${crimesByType.length} rows retrieved`);
    console.log(`  ✅ crimes_over_time: ${crimesOverTime.length} rows retrieved`);
  } else {
    console.log('\n⚠️ Some queries failed. Check the error messages above.');
  }
}

// Initialize dashboard
function initializeDashboard() {
  // Run initial data load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      testSupabaseConnection();
      setupEventListeners();
    });
  } else {
    testSupabaseConnection();
    setupEventListeners();
  }
}

// Setup event listeners for filters
function setupEventListeners() {
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');

  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
}

// Run initialization
initializeDashboard();

