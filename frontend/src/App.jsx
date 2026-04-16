import { useMemo, useState, useEffect } from "react";

const initialRegister = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

const initialLogin = {
  email: "",
  password: "",
};

const initialTask = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
};

function App() {
  const [status, setStatus] = useState({ message: "Ready.", isError: false });
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [taskForm, setTaskForm] = useState(initialTask);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [auth, setAuth] = useState(() => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }));
  const [authStep, setAuthStep] = useState("register");
  const isAuthenticated = Boolean(auth.user);
  const isAdmin = auth.user?.role === "admin";

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  function updateStatus(message, isError = false) {
    setStatus({ message, isError });
  }

  function persistAuth(nextAuth) {
    localStorage.setItem("user", JSON.stringify(nextAuth.user || null));
    setAuth(nextAuth);
  }

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function handleRegister(event) {
    event.preventDefault();

    try {
      await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });

      setLoginForm((prev) => ({
        ...prev,
        email: registerForm.email,
      }));
      setRegisterForm(initialRegister);
      setAuthStep("login");
      updateStatus("Registration successful. Please login to continue.");
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const result = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      persistAuth(result.data);
      setLoginForm(initialLogin);
      setAuthStep("login");
      updateStatus("Login successful.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function loadProfile() {
    try {
      const result = await apiFetch("/api/v1/auth/me");
      persistAuth({ ...auth, user: result.data });
      updateStatus("Profile loaded.");
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function createTask(event) {
    event.preventDefault();

    try {
      await apiFetch("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm),
      });

      setTaskForm(initialTask);
      updateStatus("Task created.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function loadTasks() {
    try {
      const result = await apiFetch("/api/v1/tasks");
      setTasks(result.data);
      updateStatus(`Loaded ${result.count} task(s).`);

      const userStr = localStorage.getItem("user");
      const safeUser = userStr && userStr !== "undefined" ? JSON.parse(userStr) : auth.user;
      if (safeUser?.role === "admin") {
        const usersRes = await apiFetch("/api/v1/auth/users");
        setUsers(usersRes.data || []);
        const summaryRes = await apiFetch("/api/v1/tasks/admin/summary").catch(() => ({ data: null }));
        if (summaryRes.data) setSummary(summaryRes.data);
      }
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function loadAdminSummary() {
    try {
      const result = await apiFetch("/api/v1/tasks/admin/summary");
      setSummary(result.data);
      updateStatus("Admin summary loaded.");
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function updateTaskStatus(taskId, newStatus) {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      updateStatus("Status updated.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function assignTaskToUser(taskId, userId) {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ userId: userId || null }),
      });
      updateStatus("Task assigned.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function updateTask(taskId) {
    const title = window.prompt("Enter updated title");
    if (!title) return;

    try {
      if (isAdmin) {
        await apiFetch(`/api/v1/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ title }),
        });
        updateStatus("Task updated directly.");
      } else {
        await apiFetch(`/api/v1/tasks/${taskId}/request-update`, {
          method: "POST",
          body: JSON.stringify({ requestedTitle: title }),
        });
        updateStatus("Update requested.");
      }
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function approveUpdate(taskId) {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}/approve-update`, { method: "POST" });
      updateStatus("Update approved.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function rejectUpdate(taskId) {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}/reject-update`, { method: "POST" });
      updateStatus("Update rejected.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function deleteTask(taskId) {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });

      updateStatus("Task deleted.");
      await loadTasks();
    } catch (error) {
      updateStatus(error.message, true);
    }
  }

  async function logout() {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      // Ignore if it fails due to network, we still clear local state
    }
    persistAuth({ user: null });
    setTasks([]);
    setSummary(null);
    setAuthStep("login");
    updateStatus("Logged out.");
  }

  function renderInput(label, name, value, setter, type = "text") {
    return (
      <label className="field">
        <span>{label}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => setter((prev) => ({ ...prev, [name]: event.target.value }))}
          required={type !== "textarea"}
        />
      </label>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <h1>Task Manager React Demo</h1>
          <p>
            React frontend for the backend assignment. Use it to register, log in, access protected
            routes, and manage tasks.
          </p>
        </header>

        <div className={`status ${status.isError ? "status-error" : ""}`}>{status.message}</div>

        {!isAuthenticated ? (
          <div className="auth-shell">
            <section className="card auth-card">
              <div className="auth-header">
                <h2>{authStep === "register" ? "Create Account" : "Login"}</h2>
                <p className="muted">
                  {authStep === "register"
                    ? "Step 1: Register your account."
                    : "Step 2: Login to access your dashboard."}
                </p>
              </div>

              {authStep === "register" ? (
                <form onSubmit={handleRegister}>
                  {renderInput("Name", "name", registerForm.name, setRegisterForm)}
                  {renderInput("Email", "email", registerForm.email, setRegisterForm, "email")}
                  {renderInput("Password", "password", registerForm.password, setRegisterForm, "password")}
                  <label className="field">
                    <span>Role</span>
                    <select
                      value={registerForm.role}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({ ...prev, role: event.target.value }))
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <button type="submit">Register</button>
                </form>
              ) : (
                <form onSubmit={handleLogin}>
                  {renderInput("Email", "email", loginForm.email, setLoginForm, "email")}
                  {renderInput("Password", "password", loginForm.password, setLoginForm, "password")}
                  <button type="submit">Login</button>
                </form>
              )}

              <div className="auth-switch">
                {authStep === "register" ? (
                  <button className="button-secondary" type="button" onClick={() => setAuthStep("login")}>
                    Already registered? Go to Login
                  </button>
                ) : (
                  <button className="button-secondary" type="button" onClick={() => setAuthStep("register")}>
                    Need an account? Go to Register
                  </button>
                )}
              </div>
            </section>
          </div>
        ) : (
          <>
            <div className="grid">
              <section className="card">
                <h2>Session</h2>
                <p>
                  <strong>User:</strong> {auth.user.name} ({auth.user.role})
                </p>
                <div className="session-actions">
                  <button className="button-secondary" type="button" onClick={loadProfile}>
                    Refresh Profile
                  </button>
                  <button className="button-secondary" type="button" onClick={logout}>
                    Logout
                  </button>
                </div>
              </section>
            </div>

            <div className="grid section-gap">
              <section className="card">
                <h2>Create Task</h2>
                <form onSubmit={createTask}>
                  {renderInput("Title", "title", taskForm.title, setTaskForm)}
                  <label className="field">
                    <span>Description</span>
                    <textarea
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </label>
                  {!isAdmin && (
                    <label className="field">
                      <span>Status</span>
                      <select
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>
                  )}
                  <label className="field">
                    <span>Priority</span>
                    <select
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm((prev) => ({ ...prev, priority: event.target.value }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  {isAdmin && (
                    <label className="field">
                      <span>Assign To</span>
                      <select
                        value={taskForm.assignedTo || ""}
                        onChange={(event) =>
                          setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button type="submit">Create Task</button>
                </form>
              </section>

              <section className="card">
                <div className="actions">
                  <h2>{isAdmin ? "Admin Dashboard" : "User Dashboard"}</h2>
                  <div className="action-buttons">
                    <button type="button" onClick={loadTasks}>
                      Refresh Dashboard
                    </button>
                  </div>
                </div>

                {isAdmin && summary ? (
                  <div className="summary">
                    <span>Total: {summary.totalTasks}</span>
                    <span>Completed: {summary.completedTasks}</span>
                    <span>Pending: {summary.pendingTasks}</span>
                  </div>
                ) : null}

                <div className="task-list">
                  {tasks.length === 0 ? (
                    <p className="muted">No tasks loaded yet.</p>
                  ) : (
                    tasks.map((task) => (
                      <article key={task._id} className="task-card">
                        <div className="task-row">
                          <h3>{task.title}</h3>
                          <span className={`pill pill-${task.status}`}>{task.status}</span>
                        </div>
                        <p>{task.description || "No description"}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <p className="muted">Priority: {task.priority}</p>
                          <p className="muted">Assignee: {task.assignedTo?.name || "Unassigned"}</p>
                        </div>
                        {task.updateRequest?.pending && (
                          <div style={{ padding: "0.5rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", marginBottom: "1rem" }}>
                            <p className="muted" style={{ marginBottom: "0.5rem", color: "#f59e0b" }}>
                              <strong>Pending Update Request: </strong>
                              Change title to "{task.updateRequest.requestedTitle}"
                            </p>
                            {isAdmin && (
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="button" onClick={() => approveUpdate(task._id)} style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#10b981" }}>Approve</button>
                                <button type="button" onClick={() => rejectUpdate(task._id)} style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#ef4444" }}>Reject</button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="task-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button type="button" onClick={() => updateTask(task._id)}>
                            Update
                          </button>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => deleteTask(task._id)}
                          >
                            Delete
                          </button>

                          {!isAdmin && (
                            <select
                              className="field"
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                              style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.08)", marginLeft: "auto" }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In-Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
