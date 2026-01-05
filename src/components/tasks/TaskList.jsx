import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tasksAPI, projectsAPI, teamsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    team: searchParams.get('team') || '',
    project: searchParams.get('project') || '',
    status: searchParams.get('status') || '',
    owner: searchParams.get('owner') || '',
    tags: searchParams.get('tags') || ''
  });
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    teamId: '',
    owners: [],
    timeToComplete: 1,
    tags: [],
    status: 'To Do'
  });
  const [availableTags, setAvailableTags] = useState([
    'Urgent', 'Bug', 'Feature', 'Enhancement', 'Documentation', 'Testing'
  ]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    loadTasks();
  }, [filters, setSearchParams]);

  const loadData = async () => {
    try {
      const [tasksData, projectsData, teamsData, usersData] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
        teamsAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setTasks(tasksData);
      setProjects(projectsData);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      let data = await tasksAPI.getAll(cleanFilters);
      
      // simple sorting
      data = data.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const taskData = {
        ...formData,
        owners: formData.owners.length > 0 ? formData.owners : [user.id],
        timeToComplete: Number(formData.timeToComplete)
      };
      
      await tasksAPI.create(taskData);
      setFormData({
        name: '',
        projectId: '',
        teamId: '',
        owners: [],
        timeToComplete: 1,
        tags: [],
        status: 'To Do'
      });
      setShowModal(false);
      toast.success('Task created successfully!');
      loadTasks();
    } catch (error) {
      setError(error.message);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerToggle = (ownerId) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.includes(ownerId)
        ? prev.owners.filter(id => id !== ownerId)
        : [...prev.owners, ownerId]
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags(prev => [...prev, newTag.trim()]);
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const navigateToTask = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        toast.success('Task deleted successfully!');
        loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
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

  const clearFilters = () => {
    setFilters({
      team: '',
      project: '',
      status: '',
      owner: '',
      tags: ''
    });
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

  return (
    <div className="container-fluid p-4">
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Tasks</h2>
              <p className="text-muted">Manage and track your tasks</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters with URL Support */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label small">Team</label>
              <select 
                className="form-select form-select-sm"
                value={filters.team}
                onChange={(e) => setFilters({...filters, team: e.target.value})}
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label small">Project</label>
              <select 
                className="form-select form-select-sm"
                value={filters.project}
                onChange={(e) => setFilters({...filters, project: e.target.value})}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label small">Status</label>
              <select 
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <label className="form-label small">Owner</label>
              <select 
                className="form-select form-select-sm"
                value={filters.owner}
                onChange={(e) => setFilters({...filters, owner: e.target.value})}
              >
                <option value="">All Owners</option>
                <option value={user?.id}>My Tasks</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Sort By</label>
              <select 
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="timeToComplete">Priority</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-list-task text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 text-muted">No tasks found</h4>
          <p className="text-muted">Create your first task or adjust your filters</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Task
          </button>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3">Task</th>
                    <th className="border-0 py-3">Owners</th>
                    <th className="border-0 py-3">Priority</th>
                    <th className="border-0 py-3">Time</th>
                    <th className="border-0 py-3">Status</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigateToTask(task.id)}>
                      <td className="px-4 py-3">
                        <div>
                          <h6 className="mb-1">{task.name}</h6>
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-3">
                              <i className="bi bi-folder me-1"></i>
                              {task.project?.name}
                            </span>
                            <span>
                              <i className="bi bi-people me-1"></i>
                              {task.team?.name}
                            </span>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="mt-1">
                              {task.tags.map((tag, index) => (
                                <span key={index} className="badge bg-light text-dark me-1 small">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          {task.ownerDetails && task.ownerDetails.length > 0 ? (
                            <div className="d-flex align-items-center">
                              {task.ownerDetails.slice(0, 2).map((owner, index) => (
                                <div key={owner.id} className="d-flex align-items-center me-2">
                                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-1" 
                                       style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                    <i className="bi bi-person text-white"></i>
                                  </div>
                                  <small>{owner.name}</small>
                                </div>
                              ))}
                              {task.ownerDetails.length > 2 && (
                                <small className="text-muted">+{task.ownerDetails.length - 2} more</small>
                              )}
                            </div>
                          ) : (
                            <small className="text-muted">Unassigned</small>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3">
                        <span className={`small ${getPriorityColor(task.timeToComplete)}`}>
                          <i className="bi bi-flag me-1"></i>
                          {task.timeToComplete <= 1 ? 'Low' : 
                           task.timeToComplete <= 3 ? 'Medium' : 'High'}
                        </span>
                      </td>
                      
                      <td className="py-3">
                        <small className="text-muted">
                          {task.timeToComplete} day{task.timeToComplete !== 1 ? 's' : ''}
                        </small>
                      </td>
                      
                      <td className="py-3">
                        <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      
                      <td className="py-3">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          title="Delete task"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create Task Modal with Multi-Select */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setFormData({
                      name: '',
                      projectId: '',
                      teamId: '',
                      owners: [],
                      timeToComplete: 1,
                      tags: [],
                      status: 'To Do'
                    });
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label htmlFor="taskName" className="form-label">Task Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="taskName"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter task name"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="selectProject" className="form-label">Select Project</label>
                      <select
                        className="form-select"
                        id="selectProject"
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
                      <label htmlFor="selectTeam" className="form-label">Select Team</label>
                      <select
                        className="form-select"
                        id="selectTeam"
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

                    {/* Multi-Select Owners */}
                    <div className="col-12 mb-3">
                      <label className="form-label">Assign Owners (Team Members)</label>
                      <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {users.map(u => (
                          <div key={u.id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`owner-${u.id}`}
                              checked={formData.owners.includes(u.id)}
                              onChange={() => handleOwnerToggle(u.id)}
                            />
                            <label className="form-check-label" htmlFor={`owner-${u.id}`}>
                              {u.name} ({u.email})
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="form-text">Select one or more team members to assign this task</div>
                    </div>

                    {/* Multi-Select Tags */}
                    <div className="col-12 mb-3">
                      <label className="form-label">Tags</label>
                      <div className="border rounded p-3 mb-2">
                        <div className="row">
                          {availableTags.map(tag => (
                            <div key={tag} className="col-md-4 mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`tag-${tag}`}
                                  checked={formData.tags.includes(tag)}
                                  onChange={() => handleTagToggle(tag)}
                                />
                                <label className="form-check-label" htmlFor={`tag-${tag}`}>
                                  {tag}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Add New Tag */}
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Add new tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={addNewTag}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="timeToComplete" className="form-label">Estimated Time (Days)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="timeToComplete"
                        value={formData.timeToComplete}
                        onChange={(e) => setFormData({...formData, timeToComplete: e.target.value})}
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="status" className="form-label">Status</label>
                      <select
                        className="form-select"
                        id="status"
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
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                      setFormData({
                        name: '',
                        projectId: '',
                        teamId: '',
                        owners: [],
                        timeToComplete: 1,
                        tags: [],
                        status: 'To Do'
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;