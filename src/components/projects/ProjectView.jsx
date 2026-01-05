import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../../services/api';

const ProjectView = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    owner: searchParams.get('owner') || '',
    tags: searchParams.get('tags') || '',
    status: searchParams.get('status') || ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Listen for URL changes to handle navigation properly
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      // Find and set the project if URL has project parameter
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    } else {
      // Clear selected project if URL doesn't have project parameter
      setSelectedProject(null);
    }
  }, [searchParams, projects]); // Listen to both searchParams and projects changes

  // Separate effect for filters that doesn't automatically update URL
  useEffect(() => {
    // Only update URL if we're already viewing a specific project
    if (selectedProject) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('project', selectedProject.id);
      setSearchParams(params);
    }
  }, [filters]);

  const loadData = async () => {
    try {
      const [projectsData, tasksData, usersData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
      
      // Don't set selected project here - let the useEffect handle it based on URL
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await projectsAPI.create(formData.name, formData.description);
      setFormData({ name: '', description: '' });
      setShowModal(false);
      loadData();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getProjectTasks = (projectId) => {
    let projectTasks = tasks.filter(task => task.projectId === projectId);
    
    // apply filters
    if (filters.owner) {
      projectTasks = projectTasks.filter(task => 
        task.owners && task.owners.includes(filters.owner)
      );
    }
    if (filters.status) {
      projectTasks = projectTasks.filter(task => task.status === filters.status);
    }
    if (filters.tags) {
      const filterTags = filters.tags.split(',').map(tag => tag.trim());
      projectTasks = projectTasks.filter(task => 
        task.tags && filterTags.some(tag => task.tags.includes(tag))
      );
    }
    
    return projectTasks;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'bg-success';
    if (status === 'In Progress') return 'bg-warning';
    if (status === 'Blocked') return 'bg-danger';
    return 'bg-secondary';
  };

  const handleProjectClick = (project) => {
    const newSelectedProject = selectedProject?.id === project.id ? null : project;
    setSelectedProject(newSelectedProject);
    
    // Update URL when project is selected/deselected
    if (newSelectedProject) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('project', newSelectedProject.id);
      setSearchParams(params);
    } else {
      // Clear search params when going back to projects list
      setSearchParams({});
    }
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

  const clearFilters = () => {
    setFilters({
      owner: '',
      tags: '',
      status: ''
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
              <h2 className="mb-1">Projects</h2>
              <p className="text-muted">Manage your project portfolio and tasks</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Filters for Project Tasks */}
      {selectedProject && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Filter tasks in "{selectedProject.name}"</h6>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Owner</label>
                <select 
                  className="form-select form-select-sm"
                  value={filters.owner}
                  onChange={(e) => setFilters({...filters, owner: e.target.value})}
                >
                  <option value="">All Owners</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
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
              
              <div className="col-md-3">
                <label className="form-label small">Tags</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Enter tags (comma separated)"
                  value={filters.tags}
                  onChange={(e) => setFilters({...filters, tags: e.target.value})}
                />
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <button 
                  className="btn btn-outline-primary btn-sm w-100"
                  onClick={() => setSelectedProject(null)}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-folder text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 text-muted">No projects yet</h4>
          <p className="text-muted">Create your first project to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Project
          </button>
        </div>
      ) : selectedProject ? (
        /* Project Detail View with Tasks */
        <div>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h4 className="mb-2">{selectedProject.name}</h4>
                  <p className="text-muted mb-3">{selectedProject.description || 'No description provided'}</p>
                  <div className="d-flex align-items-center text-muted small">
                    <span className="me-3">
                      <i className="bi bi-calendar me-1"></i>
                      Created: {new Date(selectedProject.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="bi bi-list-task me-1"></i>
                      {getProjectTasks(selectedProject.id).length} tasks
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => navigate('/tasks', { state: { projectFilter: selectedProject.id } })}
                  >
                    <i className="bi bi-plus me-1"></i>
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Tasks */}
          {getProjectTasks(selectedProject.id).length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-list-task text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">No tasks in this project</h5>
              <p className="text-muted">Create your first task for this project</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/tasks')}
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
                        <th className="border-0 py-3">Team</th>
                        <th className="border-0 py-3">Owners</th>
                        <th className="border-0 py-3">Priority</th>
                        <th className="border-0 py-3">Status</th>
                        <th className="border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getProjectTasks(selectedProject.id).map((task) => (
                        <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${task.id}`)}>
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
                            <span className="small">{task.team?.name || 'No team'}</span>
                          </td>
                          
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              {task.ownerDetails && task.ownerDetails.length > 0 ? (
                                <div className="d-flex align-items-center">
                                  {task.ownerDetails.slice(0, 2).map((owner) => (
                                    <div key={owner.id} className="d-flex align-items-center me-2">
                                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-1" 
                                           style={{ width: '20px', height: '20px', fontSize: '8px' }}>
                                        <i className="bi bi-person text-white"></i>
                                      </div>
                                      <small>{owner.name}</small>
                                    </div>
                                  ))}
                                  {task.ownerDetails.length > 2 && (
                                    <small className="text-muted">+{task.ownerDetails.length - 2}</small>
                                  )}
                                </div>
                              ) : (
                                <small className="text-muted">Unassigned</small>
                              )}
                            </div>
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
                          
                          <td className="py-3">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tasks/${task.id}`);
                              }}
                              title="View task details"
                            >
                              <i className="bi bi-eye"></i>
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
        </div>
      ) : (
        /* Projects Grid View */
        <div className="row">
          {projects.map((project) => {
            const projectTasks = getProjectTasks(project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
            const totalTasks = projectTasks.length;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const projectStatus = getProjectStatus(project.id);

            return (
              <div key={project.id} className="col-md-6 col-lg-4 mb-4">
                <div 
                  className="card border-0 shadow-sm card-hover h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-2">
                        <i className="bi bi-folder text-primary fs-5"></i>
                      </div>
                      <span className={`badge ${projectStatus.class}`}>{projectStatus.status}</span>
                    </div>
                    
                    <h5 className="card-title mb-2">{project.name}</h5>
                    <p className="card-text text-muted mb-3">
                      {project.description || 'No description provided'}
                    </p>

                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Progress</small>
                          <small className="text-muted">{completionPercentage}%</small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center text-muted small">
                      <span>
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        <i className="bi bi-list-task me-1"></i>
                        {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Project</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setFormData({ name: '', description: '' });
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
                  
                  <div className="mb-3">
                    <label htmlFor="projectName" className="form-label">Project Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="projectName"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="projectDescription" className="form-label">Project Description</label>
                    <textarea
                      className="form-control"
                      id="projectDescription"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
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
                      setShowModal(false);
                      setError('');
                      setFormData({ name: '', description: '' });
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

export default ProjectView;