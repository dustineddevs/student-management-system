
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/students';

const emptyForm = {
  student_number: '',
  first_name: '',
  last_name: '',
  email: '',
  course: 'BSIT',
  year_level: '1st Year',
  status: 'Active',
};

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [deleteId, setDeleteId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Automatically hide toast after 3 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Display toast notification
  function showToast(message, type = 'success') {
    setToast({
      message,
      type,
      id: Date.now(),
    });
  }

  // Load students from Express API
  async function loadStudents() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Could not load students.');
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message + ' Make sure your backend is running.');
    } finally {
      setLoading(false);
    }
  }

  // Load students when dashboard first opens
  useEffect(() => {
    loadStudents();
  }, []);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCourse, selectedYear]);

  // Dashboard statistics
  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) => student.status === 'Active'
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === 'Inactive'
  ).length;

  // Search and filter students
  const filteredStudents = useMemo(() => {
    const keyword = search.toLowerCase();

    return students.filter((student) => {
      const matchesSearch = [
        student.student_number,
        student.first_name,
        student.last_name,
        student.email,
        student.course,
      ].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      );

      const matchesCourse =
        selectedCourse === 'All Courses' ||
        student.course === selectedCourse;

      const matchesYear =
        selectedYear === 'All Years' ||
        student.year_level === selectedYear;

      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [students, search, selectedCourse, selectedYear]);

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const startStudent =
    filteredStudents.length === 0
      ? 0
      : (currentPage - 1) * studentsPerPage + 1;

  const endStudent = Math.min(
    currentPage * studentsPerPage,
    filteredStudents.length
  );

  // Keep current page valid when records are deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Open Add Student modal
  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  // Open Edit Student modal
  function openEditModal(student) {
    setEditingId(student.id);

    setForm({
      student_number: student.student_number || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      course: student.course || 'BSIT',
      year_level: student.year_level || '1st Year',
      status: student.status || 'Active',
    });

    setShowModal(true);
  }

  // Close modal
  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // Handle form input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Add or update student
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    const wasEditing = Boolean(editingId);

    try {
      const url = wasEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: wasEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      closeModal();
      await loadStudents();

      showToast(
        wasEditing
          ? 'Student updated successfully!'
          : 'Student added successfully!',
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Delete student
async function handleDelete(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete student.');
    }

    await loadStudents();
    setDeleteId(null);

    showToast('Student deleted successfully!', 'success');
  } catch (err) {
    setDeleteId(null);
    showToast(err.message, 'error');
  }
}

  return (
    <div className="app-layout">
     {deleteId !== null && (
  <div className="delete-modal-overlay">
    <div className="delete-modal">
      <div className="delete-modal-icon">
        !
      </div>

      <h2>Delete Student?</h2>

      <p>
        Are you sure you want to delete this student?
        This action cannot be undone.
      </p>

      <div className="delete-modal-actions">
        <button
          className="cancel-delete-btn"
          onClick={() => setDeleteId(null)}
        >
          Cancel
        </button>

        <button
          className="confirm-delete-btn"
          onClick={() => handleDelete(deleteId)}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
      {/* Toast Notification */}
      {toast && (
        <div
          key={toast.id}
          className={`toast-notification ${
            toast.type === 'success'
              ? 'toast-success'
              : 'toast-error'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="toast-icon">
            {toast.type === 'success' ? '✓' : '!'}
          </div>

          <div className="toast-content">
            <strong>
              {toast.type === 'success' ? 'Success!' : 'Error!'}
            </strong>

            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>StudentHub</h2>
            <span>Management System</span>
          </div>
        </div>

        <p className="menu-label">MENU</p>

        <div className="menu-item active">
          <span>▦</span> Dashboard
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">AD</div>
          <div>
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="welcome-text">Welcome back!</p>
            <h1>Dashboard</h1>
          </div>

          <div className="topbar-date">
            <span></span>
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </header>

        {/* Dashboard Statistics */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">♙</div>
            <div>
              <p>Total Students</p>
              <h2>{totalStudents}</h2>
              <span>All registered students</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <p>Active Students</p>
              <h2>{activeStudents}</h2>
              <span>Currently active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">⊘</div>
            <div>
              <p>Inactive Students</p>
              <h2>{inactiveStudents}</h2>
              <span>Currently inactive</span>
            </div>
          </div>
        </section>

        {/* Student Management */}
        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>Student Management</h2>
              <p>Manage and organize your student records.</p>
            </div>

            <button className="add-button" onClick={openAddModal}>
              + Add Student
            </button>
          </div>

          {/* Search and Filters */}
          <div className="table-toolbar">
            <input
              type="search"
              placeholder="Search students by name, number, email or course..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="filter-select"
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(event.target.value)
              }
            >
              <option>All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSBA">BSBA</option>
              <option value="BSED">BSED</option>
              <option value="BSHM">BSHM</option>
            </select>

            <select
              className="filter-select"
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(event.target.value)
              }
            >
              <option>All Years</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>

            <button
              type="button"
              className="refresh-button"
              onClick={loadStudents}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Student Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>STUDENT NUMBER</th>
                  <th>COURSE</th>
                  <th>YEAR LEVEL</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {search ||
                      selectedCourse !== 'All Courses' ||
                      selectedYear !== 'All Years'
                        ? 'No matching students found.'
                        : 'No students yet. Click Add Student to get started.'}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-info">
                          <div className="student-avatar">
                            {student.first_name?.charAt(0)}
                            {student.last_name?.charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {student.first_name} {student.last_name}
                            </strong>
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>{student.student_number}</td>
                      <td>{student.course}</td>
                      <td>{student.year_level}</td>

                      <td>
                        <span
                          className={`status ${
                            student.status === 'Active'
                              ? 'status-active'
                              : 'status-inactive'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => openEditModal(student)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => setDeleteId(student.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <div className="table-footer">
              Showing {startStudent}–{endStudent} of{' '}
              {filteredStudents.length} students
            </div>

            <div className="pagination-controls">
              <button
                className="page-button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span className="page-number">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="page-button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Add and Edit Student Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>
                    {editingId ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <p>Enter the student's information below.</p>
                </div>

                <button
                  className="close-button"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Student Number
                    <input
                      name="student_number"
                      value={form.student_number}
                      onChange={handleChange}
                      placeholder="e.g. 2026-0001"
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="student@email.com"
                      required
                    />
                  </label>

                  <label>
                    First Name
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      required
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      required
                    />
                  </label>

                  <label>
                    Course
                    <select
                      name="course"
                      value={form.course}
                      onChange={handleChange}
                    >
                      <option value="BSIT">BSIT</option>
                      <option value="BSCS">BSCS</option>
                      <option value="BSBA">BSBA</option>
                      <option value="BSED">BSED</option>
                      <option value="BSHM">BSHM</option>
                    </select>
                  </label>

                  <label>
                    Year Level
                    <select
                      name="year_level"
                      value={form.year_level}
                      onChange={handleChange}
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </label>

                  <label className="full-width">
                    Status
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="add-button"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                      ? 'Save Changes'
                      : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
