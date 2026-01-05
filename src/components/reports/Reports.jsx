import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { reportsAPI } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [reports, setReports] = useState({
    lastWeek: null,
    pending: null,
    closedTasks: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [lastWeekData, pendingData, closedTasksData] = await Promise.all([
        reportsAPI.getLastWeek(),
        reportsAPI.getPending(),
        reportsAPI.getClosedTasks()
      ]);

      setReports({
        lastWeek: lastWeekData,
        pending: pendingData,
        closedTasks: closedTasksData
      });
    } catch (error) {
      setError('Failed to load reports');
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLastWeekChartData = () => {
    if (!reports.lastWeek) return null;

    // group tasks by day for the last week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const tasksForDay = reports.lastWeek.tasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate.toDateString() === date.toDateString();
      }).length;

      weekData.push({ day: dayName, count: tasksForDay });
    }

    return {
      labels: weekData.map(d => d.day),
      datasets: [
        {
          label: 'Tasks Completed',
          data: weekData.map(d => d.count),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getPendingWorkChartData = () => {
    if (!reports.pending) return null;

    const statusData = [
      { status: 'To Do', count: 0, time: 0 },
      { status: 'In Progress', count: 0, time: 0 },
      { status: 'Blocked', count: 0, time: 0 }
    ];

    reports.pending.tasks.forEach(task => {
      const statusItem = statusData.find(s => s.status === task.status);
      if (statusItem) {
        statusItem.count++;
        statusItem.time += task.timeToComplete;
      }
    });

    return {
      labels: statusData.map(s => s.status),
      datasets: [
        {
          label: 'Pending Work Days',
          data: statusData.map(s => s.time),
          backgroundColor: [
            'rgba(108, 117, 125, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(220, 53, 69, 0.8)'
          ],
          borderColor: [
            'rgba(108, 117, 125, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(220, 53, 69, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getClosedTasksChartData = () => {
    if (!reports.closedTasks) return null;

    const teamData = Object.entries(reports.closedTasks.byTeam);
    const projectData = Object.entries(reports.closedTasks.byProject);
    const ownerData = Object.entries(reports.closedTasks.byOwner);

    return {
      team: {
        labels: teamData.map(([name]) => name),
        datasets: [
          {
            label: 'Completed Tasks',
            data: teamData.map(([, count]) => count),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
        ],
      },
      project: {
        labels: projectData.map(([name]) => name),
        datasets: [
          {
            label: 'Completed Tasks',
            data: projectData.map(([, count]) => count),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      },
      owner: {
        labels: ownerData.map(([name]) => name),
        datasets: [
          {
            data: ownerData.map(([, count]) => count),
            backgroundColor: [
              'rgba(99, 102, 241, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
            ],
            borderWidth: 1,
          },
        ],
      },
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  const lastWeekChartData = getLastWeekChartData();
  const pendingWorkChartData = getPendingWorkChartData();
  const closedTasksChartData = getClosedTasksChartData();

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col">
          <h2 className="mb-1">Reports</h2>
          <p className="text-muted">Analytics and insights for your projects</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-check-circle text-success fs-2"></i>
              </div>
              <h3 className="mb-1">{reports.lastWeek?.count || 0}</h3>
              <p className="text-muted mb-0">Tasks Completed Last Week</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-clock text-warning fs-2"></i>
              </div>
              <h3 className="mb-1">{reports.pending?.totalDays || 0}</h3>
              <p className="text-muted mb-0">Total Pending Work Days</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-list-task text-primary fs-2"></i>
              </div>
              <h3 className="mb-1">{reports.closedTasks?.totalCompleted || 0}</h3>
              <p className="text-muted mb-0">Total Completed Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row">
        {/* Last Week Activity */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Last Week Activity
              </h5>
            </div>
            <div className="card-body">
              {lastWeekChartData ? (
                <Bar data={lastWeekChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Work Distribution */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Pending Work Distribution
              </h5>
            </div>
            <div className="card-body">
              {pendingWorkChartData ? (
                <Bar data={pendingWorkChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No pending tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completed Tasks by Team */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Completed Tasks by Team
              </h5>
            </div>
            <div className="card-body">
              {closedTasksChartData?.team ? (
                <Bar data={closedTasksChartData.team} options={chartOptions} />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No completed tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completed Tasks by Owner */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Completed Tasks by Owner
              </h5>
            </div>
            <div className="card-body">
              {closedTasksChartData?.owner ? (
                <Pie data={closedTasksChartData.owner} options={pieOptions} />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No completed tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">
                <i className="bi bi-table me-2"></i>
                Detailed Statistics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <h6 className="text-muted">By Team</h6>
                  {reports.closedTasks?.byTeam && Object.keys(reports.closedTasks.byTeam).length > 0 ? (
                    <ul className="list-unstyled">
                      {Object.entries(reports.closedTasks.byTeam).map(([team, count]) => (
                        <li key={team} className="d-flex justify-content-between py-1">
                          <span>{team}</span>
                          <span className="badge bg-primary">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">No data available</p>
                  )}
                </div>

                <div className="col-md-4">
                  <h6 className="text-muted">By Project</h6>
                  {reports.closedTasks?.byProject && Object.keys(reports.closedTasks.byProject).length > 0 ? (
                    <ul className="list-unstyled">
                      {Object.entries(reports.closedTasks.byProject).map(([project, count]) => (
                        <li key={project} className="d-flex justify-content-between py-1">
                          <span>{project}</span>
                          <span className="badge bg-success">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">No data available</p>
                  )}
                </div>

                <div className="col-md-4">
                  <h6 className="text-muted">By Owner</h6>
                  {reports.closedTasks?.byOwner && Object.keys(reports.closedTasks.byOwner).length > 0 ? (
                    <ul className="list-unstyled">
                      {Object.entries(reports.closedTasks.byOwner).map(([owner, count]) => (
                        <li key={owner} className="d-flex justify-content-between py-1">
                          <span>{owner}</span>
                          <span className="badge bg-info">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;