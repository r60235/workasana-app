import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teamsAPI, tasksAPI, projectsAPI, usersAPI } from '../../services/api';

const TeamView = () => {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    owner: searchParams.get('owner') || '',
    project: searchParams.get('project') || '',
    status: searchParams.get('status') || '',
    tags: searchParams.get('tags') || ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [memberFormData, setMemberFormData] = useState({
    userId: '',
    role: 'Member'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    loadData();
  }, []);

  // Listen for URL changes to handle navigation properly
  useEffect(() => {
    const teamId = searchParams.get('team');
    if (teamId) {
      // Find and set the team if URL has team parameter
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setSelectedTeam(team);
      }
    } else {
      // Clear selected team if URL doesn't have team parameter
      setSelectedTeam(null);
    }
  }, [searchParams, teams]); // Listen to both searchParams and teams changes

  // Separate effect for filters that doesn't automatically update URL
  useEffect(() => {
    // Only update URL if we're already viewing a specific team
    if (selectedTeam) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('team', selectedTeam.id);
      setSearchParams(params);
    }
  }, [filters]);

  const loadData = async () => {
    try {
      const [teamsData, tasksData, projectsData, usersData] = await Promise.all([
        teamsAPI.getAll(),
        tasksAPI.getAll(),
        projectsAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setTeams(teamsData);
      setTasks(tasksData);
      setProjects(projectsData);
      setUsers(usersData);
      
      // Don't set selected team here - let the useEffect handle it based on URL
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
      await teamsAPI.create(formData.name, formData.description);
      setFormData({ name: '', description: '' });
      setShowModal(false);
      loadData();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await teamsAPI.addMember(selectedTeam.id, memberFormData.userId, memberFormData.role);
      setMemberFormData({ userId: '', role: 'Member' });
      setShowMemberModal(false);
      loadData(); // Reload data to show new member
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

  const handleMemberChange = (e) => {
    setMemberFormData({
      ...memberFormData,
      [e.target.name]: e.target.value
    });
  };

  const getTeamTasks = (teamId) => {
    let teamTasks = tasks.filter(task => task.teamId === teamId);
    
    // apply filters
    if (filters.owner) {
      teamTasks = teamTasks.filter(task => 
        task.owners && task.owners.includes(filters.owner)
      );
    }
    if (filters.project) {
      teamTasks = teamTasks.filter(task => task.projectId === filters.project);
    }
    if (filters.status) {
      teamTasks = teamTasks.filter(task => task.status === filters.status);
    }
    if (filters.tags) {
      const filterTags = filters.tags.split(',').map(tag => tag.trim());
      teamTasks = teamTasks.filter(task => 
        task.tags && filterTags.some(tag => task.tags.includes(tag))
      );
    }
    
    // simple sorting
    teamTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      return bValue - aValue; // descending order
    });
    
    return teamTasks;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'bg-success';
    if (status === 'In Progress') return 'bg-warning';
    if (status === 'Blocked') return 'bg-danger';
    return 'bg-secondary';
  };

  const handleTeamClick = (team) => {
    const newSelectedTeam = selectedTeam?.id === team.id ? null : team;
    setSelectedTeam(newSelectedTeam);
    
    // Update URL when team is selected/deselected
    if (newSelectedTeam) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('team', newSelectedTeam.id);
      setSearchParams(params);
    } else {
      // Clear search params when going back to teams list
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setFilters({
      owner: '',
      project: '',
      status: '',
      tags: ''
    });
  };

  const getTeamStatus = (teamId) => {
    const teamTasks = getTeamTasks(teamId);
    
    if (teamTasks.length === 0) {
      return { status: 'No Tasks', class: 'bg-secondary' };
    }
    
    const completedTasks = teamTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = teamTasks.length;
    
    if (completedTasks === totalTasks) {
      return { status: 'Completed', class: 'bg-success' };
    } else if (completedTasks > 0) {
      return { status: 'In Progress', class: 'bg-warning' };
    } else {
      return { status: 'Active', class: 'bg-primary' };
    }
  };

  const getTeamColor = (index) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];
    return colors[index % colors.length];
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
              <h2 className="mb-1">Teams</h2>
              <p className="text-muted">Manage your team structure and tasks</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Team
            </button>
          </div>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-people text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 text-muted">No teams yet</h4>
          <p className="text-muted">Create your first team to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Team
          </button>
        </div>
      ) : selectedTeam ? (
        /* Team Detail View with Members and Tasks */
        <div>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h4 className="mb-2">{selectedTeam.name}</h4>
                  <p className="text-muted mb-3">{selectedTeam.description || 'No description provided'}</p>
                  <div className="d-flex align-items-center text-muted small">
                    <span className="me-3">
                      <i className="bi bi-calendar me-1"></i>
                      Created: {new Date(selectedTeam.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="bi bi-list-task me-1"></i>
                      {getTeamTasks(selectedTeam.id).length} tasks
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSelectedTeam(null)}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Teams
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Members
                </h5>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowMemberModal(true)}
                >
                  <i className="bi bi-plus me-1"></i>
                  Member
                </button>
              </div>
              
              <div className="row">
                {/* Display real team members from API */}
                {selectedTeam.members && selectedTeam.members.length > 0 ? (
                  selectedTeam.members.map((member) => (
                    <div key={member.id} className="col-md-6 col-lg-4 mb-3">
                      <div className="d-flex align-items-center p-3 border rounded">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-person text-white"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{member.name}</h6>
                          <small className="text-muted d-block">{member.email}</small>
                          <small className="badge bg-light text-dark">{member.role}</small>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-people" style={{ fontSize: '2rem' }}></i>
                      <p className="mt-2 mb-0">No members yet. Add your first member!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Tasks */}
          {getTeamTasks(selectedTeam.id).length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-list-task text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">No tasks for this team</h5>
              <p className="text-muted">Create your first task for this team</p>
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
                        <th className="border-0 py-3">Project</th>
                        <th className="border-0 py-3">Owners</th>
                        <th className="border-0 py-3">Priority</th>
                        <th className="border-0 py-3">Status</th>
                        <th className="border-0 py-3">Due Date</th>
                        <th className="border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTeamTasks(selectedTeam.id).map((task) => (
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
                            <span className="small">{task.project?.name || 'No project'}</span>
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
                            <small className="text-muted">
                              {task.timeToComplete} day{task.timeToComplete !== 1 ? 's' : ''}
                            </small>
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
        /* Teams Grid View */
        <div className="row">
          {teams.map((team, index) => {
            const teamTasks = getTeamTasks(team.id);
            const completedTasks = teamTasks.filter(t => t.status === 'Completed').length;
            const totalTasks = teamTasks.length;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const teamStatus = getTeamStatus(team.id);

            return (
              <div key={team.id} className="col-md-6 col-lg-4 mb-4">
                <div 
                  className="card border-0 shadow-sm card-hover h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTeamClick(team)}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className={`bg-${getTeamColor(index)} bg-opacity-10 rounded-3 p-2`}>
                        <i className={`bi bi-people text-${getTeamColor(index)} fs-5`}></i>
                      </div>
                      <span className={`badge ${teamStatus.class}`}>{teamStatus.status}</span>
                    </div>
                    
                    <h5 className="card-title mb-2">{team.name}</h5>
                    <p className="card-text text-muted mb-3">
                      {team.description || 'No description provided'}
                    </p>

                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Task Progress</small>
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
                    
                    {/* Team members avatars */}
                    <div className="d-flex align-items-center mb-3">
                      <div className="d-flex">
                        {team.members && team.members.slice(0, 3).map((member, idx) => (
                          <div 
                            key={member.id}
                            className={`bg-${getTeamColor(idx)} rounded-circle d-flex align-items-center justify-content-center me-1`}
                            style={{ width: '24px', height: '24px', fontSize: '10px' }}
                            title={member.name}
                          >
                            <i className="bi bi-person text-white"></i>
                          </div>
                        ))}
                        {team.members && team.members.length > 3 && (
                          <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center" 
                               style={{ width: '24px', height: '24px', fontSize: '8px' }}>
                            <span className="text-white">+{team.members.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <small className="text-muted ms-2">
                        {team.members ? team.members.length : 0} member{team.members && team.members.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center text-muted small">
                      <span>
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(team.createdAt).toLocaleDateString()}
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

      {/* Create Team Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Team</h5>
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
                    <label htmlFor="teamName" className="form-label">Team Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="teamName"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter team name"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="teamDescription" className="form-label">Team Description</label>
                    <textarea
                      className="form-control"
                      id="teamDescription"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter team description"
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
                      'Create Team'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Member to {selectedTeam?.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowMemberModal(false);
                    setError('');
                    setMemberFormData({ userId: '', role: 'Member' });
                  }}
                ></button>
              </div>
              
              <form onSubmit={handleMemberSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="selectUser" className="form-label">Select User</label>
                    <select
                      className="form-select"
                      id="selectUser"
                      name="userId"
                      value={memberFormData.userId}
                      onChange={handleMemberChange}
                      required
                    >
                      <option value="">Choose user...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="memberRole" className="form-label">Role</label>
                    <select
                      className="form-select"
                      id="memberRole"
                      name="role"
                      value={memberFormData.role}
                      onChange={handleMemberChange}
                    >
                      <option value="Member">Member</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Developer">Developer</option>
                      <option value="Designer">Designer</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="Project Manager">Project Manager</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowMemberModal(false);
                      setError('');
                      setMemberFormData({ userId: '', role: 'Member' });
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
                        Adding...
                      </>
                    ) : (
                      'Add Member'
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

export default TeamView;