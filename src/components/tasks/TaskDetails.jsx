import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI, projectsAPI, teamsAPI, usersAPI } from '../../services/api';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTaskDetails();
    loadData();
  }, [id]);

  const loadTaskDetails = async () => {
    try {
      const tasks = await tasksAPI.getAll();
      const foundTask = tasks.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setFormData({
          name: foundTask.name,
          projectId: foundTask.projectId,
          teamId: foundTask.teamId,
          owners: foundTask.owners || [],
          tags: foundTask.tags || [],
          timeToComplete: foundTask.timeToComplete,
          status: foundTask.status
        });
      } else {
        setError('Task not found');
      }
    } catch (error) {
      setError('Failed to load task details');
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [projectsData, teamsData, usersData] = await Promise.all([
        projectsAPI.getAll(),
        teamsAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setProjects(projectsData);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await tasksAPI.update(id, formData);
      setEditing(false);
      loadTaskDetails();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await tasksAPI.update(id, { status: newStatus });
      loadTaskDetails();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(id);
        navigate('/tasks');
      } catch (error) {
        setError('Failed to delete task');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'bg-success';
    if (status === 'In Progress') return 'bg-warning';
    if (status === 'Blocked') return 'bg-danger';
    return 'bg-secondary';
  };

  const getPriorityColor = (timeToComplete) => {
    if (timeToComplete <= 1) return 'text-success';
    if (timeToComplete <= 3) return 'text-warning';
    return 'text-danger';
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

  if (error && !task) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/tasks')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate('/tasks')}
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h2 className="mb-1">Task Details</h2>
                <p className="text-muted mb-0">View and manage task information</p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setEditing(!editing)}
              >
                <i className={`bi bi-${editing ? 'x' : 'pencil'} me-2`}></i>
                {editing ? 'Cancel' : 'Edit'}
              </button>
              <button 
                className="btn btn-outline-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {editing ? (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label">Task Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project</label>
                      <select
                        className="form-select"
                        value={formData.projectId}
                        onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                        required
                      >
                        <option value="">Choose project...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Team</label>
                      <select
                        className="form-select"
                        value={formData.teamId}
                        onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                        required
                      >
                        <option value="">Choose team...</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Time to Complete (Days)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.timeToComplete}
                        onChange={(e) => setFormData({...formData, timeToComplete: Number(e.target.value)})}
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Task'
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <h3 className="mb-4">{task?.name}</h3>
                  
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="text-muted mb-2">Project</h6>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-2">
                          <i className="bi bi-folder text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{task?.project?.name}</div>
                          <small className="text-muted">{task?.project?.description}</small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="text-muted mb-2">Team</h6>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-success bg-opacity-10 rounded-3 p-2 me-2">
                          <i className="bi bi-people text-success"></i>
                        </div>
                        <div>
                          <div className="fw-medium">{task?.team?.name}</div>
                          <small className="text-muted">{task?.team?.description}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6 className="text-muted mb-2">Owners</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {task?.ownerDetails && task.ownerDetails.length > 0 ? (
                          task.ownerDetails.map(owner => (
                            <div key={owner.id} className="d-flex align-items-center bg-light rounded-pill px-3 py-1">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                                   style={{ width: '20px', height: '20px', fontSize: '8px' }}>
                                <i className="bi bi-person text-white"></i>
                              </div>
                              <small>{owner.name}</small>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted">No owners assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="text-muted mb-2">Tags</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {task?.tags && task.tags.length > 0 ? (
                          task.tags.map((tag, index) => (
                            <span key={index} className="badge bg-secondary">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Task Status</h6>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span>Current Status:</span>
                <span className={`badge ${getStatusBadgeClass(task?.status)}`}>
                  {task?.status}
                </span>
              </div>
              
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleStatusChange('To Do')}
                  disabled={task?.status === 'To Do'}
                >
                  Mark as To Do
                </button>
                <button 
                  className="btn btn-outline-warning btn-sm"
                  onClick={() => handleStatusChange('In Progress')}
                  disabled={task?.status === 'In Progress'}
                >
                  Mark as In Progress
                </button>
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleStatusChange('Completed')}
                  disabled={task?.status === 'Completed'}
                >
                  Mark as Completed
                </button>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleStatusChange('Blocked')}
                  disabled={task?.status === 'Blocked'}
                >
                  Mark as Blocked
                </button>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-3">Task Information</h6>
              
              <div className="mb-3">
                <small className="text-muted">Priority</small>
                <div className={`fw-medium ${getPriorityColor(task?.timeToComplete)}`}>
                  <i className="bi bi-flag me-1"></i>
                  {task?.timeToComplete <= 1 ? 'Low Priority' : 
                   task?.timeToComplete <= 3 ? 'Medium Priority' : 'High Priority'}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted">Time to Complete</small>
                <div className="fw-medium">
                  {task?.timeToComplete} day{task?.timeToComplete !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted">Created</small>
                <div className="fw-medium">
                  {task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>

              <div>
                <small className="text-muted">Last Updated</small>
                <div className="fw-medium">
                  {task?.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;