import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tasksAPI, projectsAPI, teamsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: '', description: '' });
  const [taskFormData, setTaskFormData] = useState({
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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, tasksData, teamsData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll({ owner: user?.id }), // get user's tasks only
        teamsAPI.getAll()
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await projectsAPI.create(projectFormData.name, projectFormData.description);
      setProjectFormData({ name: '', description: '' });
      setShowProjectModal(false);
      toast.success('Project created successfully!');
      loadData();
    } catch (error) {
      setError(error.message);
      toast.error('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const taskData = {
        ...taskFormData,
        owners: taskFormData.owners && taskFormData.owners.length > 0 ? taskFormData.owners : [user.id],
        tags: taskFormData.tags || [],
        timeToComplete: Number(taskFormData.timeToComplete)
      };
      
      await tasksAPI.create(taskData);
      setTaskFormData({
        name: '',
        projectId: '',
        teamId: '',
        owners: [],
        timeToComplete: 1,
        tags: [],
        status: 'To Do'
      });
      setShowTaskModal(false);
      toast.success('Task created successfully!');
      loadData();
    } catch (error) {
      setError(error.message);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagToggle = (tag) => {
    setTaskFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addNewTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags(prev => [...prev, newTag.trim()]);
      setTaskFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'bg-success';
    if (status === 'In Progress') return 'bg-warning';
    if (status === 'Blocked') return 'bg-danger';
    return 'bg-secondary';
  };

  const getProjectStatus = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    if (projectTasks.length === 0) {
      return { status: 'No Tasks', class: 'bg-secondary' };
    }
    
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    
    if (completedTasks === totalTasks) {
      return { status: 'Completed', class: 'bg-success' };
    } else if (completedTasks > 0) {
      return { status: 'In Progress', class: 'bg-warning' };
    } else {
      return { status: 'Active', class: 'bg-primary' };
    }
  };

  const filteredProjects = projects.filter(project => {
    if (projectFilter === 'all') return true;
    if (projectFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(project.createdAt) >= oneWeekAgo;
    }
    return project.name.toLowerCase().includes(projectFilter.toLowerCase());
  });

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'todo') return task.status === 'To Do';
    if (taskFilter === 'in-progress') return task.status === 'In Progress';
    if (taskFilter === 'completed') return task.status === 'Completed';
    if (taskFilter === 'blocked') return task.status === 'Blocked';
    return task.name.toLowerCase().includes(taskFilter.toLowerCase());
  });

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
      {/* Projects Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <h3 className="mb-0 me-3">Projects</h3>
            <div className="d-flex align-items-center">
              <label className="form-label me-2 mb-0 small text-muted">Filter</label>
              <select
                className="form-select form-select-sm"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="all">All Projects</option>
                <option value="recent">Recent (7 days)</option>
              </select>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowProjectModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Project
          </button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-4 bg-white rounded shadow-sm">
            <i className="bi bi-folder text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 text-muted">No projects found</h5>
            <p className="text-muted">Create your first project to get started</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowProjectModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Project
            </button>
          </div>
        ) : (
          <div className="row">
            {filteredProjects.map((project) => {
              const projectStatus = getProjectStatus(project.id);
              
              return (
                <div key={project.id} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card border-0 shadow-sm card-hover h-100" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects?project=${project.id}`)}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-3 p-2">
                          <i className="bi bi-folder text-primary fs-5"></i>
                        </div>
                        <span className={`badge ${projectStatus.class}`}>{projectStatus.status}</span>
                      </div>
                      
                      <h6 className="card-title mb-2">{project.name}</h6>
                      <p className="card-text text-muted small mb-3">
                        {project.description || 'No description provided'}
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center text-muted small">
                        <span>
                          <i className="bi bi-calendar me-1"></i>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="bi bi-list-task me-1"></i>
                          {tasks.filter(t => t.projectId === project.id).length} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Tasks Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <h3 className="mb-0 me-3">My Tasks</h3>
            <div className="d-flex align-items-center">
              <label className="form-label me-2 mb-0 small text-muted">Filter</label>
              <select
                className="form-select form-select-sm"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowTaskModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Task
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-4 bg-white rounded shadow-sm">
            <i className="bi bi-list-task text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 text-muted">No tasks found</h5>
            <p className="text-muted">Create your first task to get started</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowTaskModal(true)}
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
                      <th className="border-0 py-3">Project</th>
                      <th className="border-0 py-3">Team</th>
                      <th className="border-0 py-3">Priority</th>
                      <th className="border-0 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr 
                        key={task.id} 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <h6 className="mb-1">{task.name}</h6>
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
                          <span className="small">{task.project?.name || 'No project'}</span>
                        </td>
                        
                        <td className="py-3">
                          <span className="small">{task.team?.name || 'No team'}</span>
                        </td>
                        
                        <td className="py-3">
                          <span className={`small ${task.timeToComplete <= 1 ? 'text-success' : task.timeToComplete <= 3 ? 'text-warning' : 'text-danger'}`}>
                            <i className="bi bi-flag me-1"></i>
                            {task.timeToComplete <= 1 ? 'Low' : 
                             task.timeToComplete <= 3 ? 'Medium' : 'High'}
                          </span>
                        </td>
                        
                        <td className="py-3">
                          <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Project</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowProjectModal(false);
                    setError('');
                    setProjectFormData({ name: '', description: '' });
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleProjectSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="projectName" className="form-label">Project Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="projectName"
                      value={projectFormData.name}
                      onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="projectDescription" className="form-label">Project Description</label>
                    <textarea
                      className="form-control"
                      id="projectDescription"
                      value={projectFormData.description}
                      onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                      placeholder="Enter project description"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowProjectModal(false);
                      setError('');
                      setProjectFormData({ name: '', description: '' });
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
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowTaskModal(false);
                    setError('');
                    setTaskFormData({
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
              
              <form onSubmit={handleTaskSubmit}>
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
                        value={taskFormData.name}
                        onChange={(e) => setTaskFormData({...taskFormData, name: e.target.value})}
                        placeholder="Enter task name"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="selectProject" className="form-label">Select Project</label>
                      <select
                        className="form-select"
                        id="selectProject"
                        value={taskFormData.projectId}
                        onChange={(e) => setTaskFormData({...taskFormData, projectId: e.target.value})}
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
                        value={taskFormData.teamId}
                        onChange={(e) => setTaskFormData({...taskFormData, teamId: e.target.value})}
                        required
                      >
                        <option value="">Choose team...</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
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
                                  checked={taskFormData.tags.includes(tag)}
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
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
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
                        value={taskFormData.timeToComplete}
                        onChange={(e) => setTaskFormData({...taskFormData, timeToComplete: e.target.value})}
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
                        value={taskFormData.status}
                        onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value})}
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
                      setShowTaskModal(false);
                      setError('');
                      setTaskFormData({
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
                      'Create'
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

export default Dashboard;