// JavaScript for Female Health Tracker

// Check if we're on the tracker page
if (document.getElementById('calendar-grid')) {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Period data storage
    let periodData = JSON.parse(localStorage.getItem('periodData')) || [];

    // Initial calendar load
    loadCalendar(currentMonth, currentYear);

    // Event listener for previous month button
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        loadCalendar(currentMonth, currentYear);
    });

    // Event listener for next month button
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        loadCalendar(currentMonth, currentYear);
    });

    // Event listener for period form submission
    document.getElementById('period-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const startDate = new Date(document.getElementById('start-date').value);
        let endDate = null;
        if (document.getElementById('end-date').value) {
            endDate = new Date(document.getElementById('end-date').value);
        }
        
        const symptoms = [];
        document.querySelectorAll('input[name="symptoms"]:checked').forEach(function(checkbox) {
            symptoms.push(checkbox.value);
        });
        
        const flow = document.getElementById('flow').value;
        const notes = document.getElementById('notes').value;
        
        // Create new period entry
        const newPeriod = {
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : null,
            symptoms: symptoms,
            flow: flow,
            notes: notes
        };
        
        // Add to period data
        periodData.push(newPeriod);
        
        // Save to local storage
        localStorage.setItem('periodData', JSON.stringify(periodData));
        
        // Reset form
        document.getElementById('period-form').reset();
        
        // Reload calendar to show new period
        loadCalendar(currentMonth, currentYear);
        
        // Update statistics
        updateCycleStats();
        
        alert('Period data saved successfully!');
    });

    // Load the calendar with the given month and year
    function loadCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Update the month and year display
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
        
        // Clear the calendar grid
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';
        
        // Create empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            
            // Check if this day is today
            const dateToCheck = new Date(year, month, day);
            if (dateToCheck.toDateString() === new Date().toDateString()) {
                dayCell.classList.add('today');
            }
            
            // Check if this day is part of a period
            const isPeriodDay = isPeriod(dateToCheck);
            if (isPeriodDay) {
                dayCell.classList.add('period');
            }
            
            // Check if this day is in the fertile window (estimated)
            if (isFertile(dateToCheck)) {
                dayCell.classList.add('fertile');
            }
            
            calendarGrid.appendChild(dayCell);
        }
    }

    // Check if a given date is part of a recorded period
    function isPeriod(date) {
        const dateStr = date.toISOString().split('T')[0];
        
        for (const period of periodData) {
            const startDate = new Date(period.startDate);
            const endDate = period.endDate ? new Date(period.endDate) : new Date(startDate);
            
            // Add 1 day to end date for inclusive range
            endDate.setDate(endDate.getDate() + 1);
            
            // Check if date is between start and end dates
            if (date >= startDate && date < endDate) {
                return true;
            }
        }
        
        return false;
    }

    // Estimate fertile window (very simplified)
    function isFertile(date) {
        if (periodData.length < 2) return false;
        
        // Sort periods by start date
        const sortedPeriods = [...periodData].sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });
        
        // Get the most recent period
        const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
        const lastPeriodStart = new Date(lastPeriod.startDate);
        
        // Estimate ovulation day (14 days before next period)
        // This is a simplified calculation and not accurate for all women
        const avgCycleLength = calculateAvgCycleLength();
        const estimatedNextPeriod = new Date(lastPeriodStart);
        estimatedNextPeriod.setDate(estimatedNextPeriod.getDate() + avgCycleLength);
        
        const estimatedOvulation = new Date(estimatedNextPeriod);
        estimatedOvulation.setDate(estimatedOvulation.getDate() - 14);
        
        // Fertile window is ~5 days before ovulation to 1 day after
        const fertileStart = new Date(estimatedOvulation);
        fertileStart.setDate(fertileStart.getDate() - 5);
        
        const fertileEnd = new Date(estimatedOvulation);
        fertileEnd.setDate(fertileEnd.getDate() + 1);
        
        return date >= fertileStart && date <= fertileEnd;
    }

    // Calculate average cycle length
    function calculateAvgCycleLength() {
        if (periodData.length < 2) return 28; // Default to average
        
        // Sort periods by start date
        const sortedPeriods = [...periodData].sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });
        
        let totalDays = 0;
        let cycles = 0;
        
        for (let i = 1; i < sortedPeriods.length; i++) {
            const prevPeriodStart = new Date(sortedPeriods[i-1].startDate);
            const currentPeriodStart = new Date(sortedPeriods[i].startDate);
            
            const daysBetween = Math.round((currentPeriodStart - prevPeriodStart) / (1000 * 60 * 60 * 24));
            
            // Only count reasonable cycle lengths
            if (daysBetween >= 21 && daysBetween <= 35) {
                totalDays += daysBetween;
                cycles++;
            }
        }
        
        return cycles > 0 ? Math.round(totalDays / cycles) : 28;
    }

    // Calculate average period length
    function calculateAvgPeriodLength() {
        if (periodData.length === 0) return 5; // Default to average
        
        let totalDays = 0;
        let periodsWithEndDate = 0;
        
        for (const period of periodData) {
            if (period.endDate) {
                const startDate = new Date(period.startDate);
                const endDate = new Date(period.endDate);
                const periodLength = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day
                
                totalDays += periodLength;
                periodsWithEndDate++;
            }
        }
        
        return periodsWithEndDate > 0 ? Math.round(totalDays / periodsWithEndDate) : 5;
    }

    // Update cycle statistics
    function updateCycleStats() {
        const avgCycle = calculateAvgCycleLength();
        const avgPeriod = calculateAvgPeriodLength();
        
        // Calculate next period date
        let nextPeriodDate = "Not enough data";
        
        if (periodData.length > 0) {
            // Sort periods by start date
            const sortedPeriods = [...periodData].sort((a, b) => {
                return new Date(a.startDate) - new Date(b.startDate);
            });
            
            // Get the most recent period
            const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
            const lastPeriodStart = new Date(lastPeriod.startDate);
            
            // Calculate next period
            const nextPeriod = new Date(lastPeriodStart);
            nextPeriod.setDate(nextPeriod.getDate() + avgCycle);
            
            // Format date
            nextPeriodDate = nextPeriod.toLocaleDateString();
        }
        
        // Update the DOM
        document.getElementById('avg-cycle').textContent = `${avgCycle} days`;
        document.getElementById('avg-period').textContent = `${avgPeriod} days`;
        document.getElementById('next-period').textContent = nextPeriodDate;
    }

    // Initialize stats
    updateCycleStats();
}

// Check if we're on the FAQ page
if (document.querySelector('.faq-container')) {
    // Set initial state for FAQ answers
    document.querySelectorAll('.faq-answer').forEach(answer => {
        answer.style.display = 'none';
    });
} 