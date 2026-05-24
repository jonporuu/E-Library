import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const UserManagement = () => {
  const { speak } = useAccessibility();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await db.getAllProfiles();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      speak('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await db.updateProfile(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      speak(`User role updated to ${newRole}`);
    } catch (err) {
      speak('Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
<<<<<<< HEAD
=======
      // In real app, call Supabase auth admin delete
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
      setUsers(users.filter(u => u.id !== userId));
      speak('User deleted');
    } catch (err) {
      speak('Failed to delete user');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage user accounts and permissions</p>
      </div>

      <div className="admin-actions-bar">
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Add User
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table" role="table" aria-label="Users list">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
<<<<<<< HEAD
              
=======
              <th scope="col">Disability</th>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
              <th scope="col">Joined</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`role-select role-${user.role}`}
                    aria-label={`Change role for ${user.full_name}`}
                  >
                    <option value="user">User</option>
<<<<<<< HEAD
                    <option value="admin">Admin</option>
                  </select>
                </td>

=======
                    <option value="librarian">Librarian</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{user.disability_type || '-'}</td>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="btn btn-danger btn-sm"
                    aria-label={`Delete ${user.full_name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>Add New User</h2>
            <p className="modal-note">Note: In production, this would integrate with Supabase Auth Admin API</p>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;