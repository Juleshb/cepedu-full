import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import BatchRegister from "./userbatchfile";
import Logo from "../../assets/logo.png";
import { motion } from "framer-motion";
import { AdminShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";

const UsersTable = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response =await axiosInstance.get("/users");
  
        if (response.data && Array.isArray(response.data)) {
          setUsers(response.data); 
          setFilteredUsers(response.data); 
        } else {
          throw new Error("Invalid data format received");
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
        setError("Failed to fetch users. Please try again.");
      } finally {
        setLoading(false); 
      }
    };
  
    fetchUsers();
  }, []);
  

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.identification_number?.toLowerCase().includes(query)
    );
  
    setFilteredUsers(filtered);
  };
  
  

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalType("edit");
    setShowModal(true);
  };

  const handleView = (user) => {
    navigate(`/users/${user.user_id}`);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${userId}`);
        setUsers(users.filter((user) => user.user_id !== userId));
        alert("User deleted successfully.");
      } catch (error) {
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}`, { role: newRole });
  
      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.user_id === userId ? { ...user, role: newRole } : user
          )
        );
        toast.success("User role updated successfully.");
      }
    } catch (error) {
      console.error("Error updating user role:", error.message);
      toast.error("Failed to update user role. Please try again.");
    }

    fetchUsers();
  };
  

  const handleUpdate = async () => {
    try {
      const response = await axiosInstance.put(
        `/users/${selectedUser.user_id}`,
        selectedUser
      );
      setUsers(
        users.map((user) =>
          user.user_id === selectedUser.user_id ? response.data : user
        )
      );
      setShowModal(false);
      alert("User updated successfully.");
    } catch (error) {
      alert("Failed to update user. Please try again.");
    }

    fetchUsers();
  };

  if (loading) {
    return (
      <AdminShell title="Members">
        <div className="flex h-[50vh] items-center justify-center">
          <motion.img
            src={Logo}
            alt="Loading..."
            className="h-24"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Members">
        <p className="alert-error">{error}</p>
      </AdminShell>
    );
  }

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstLog, indexOfLastLog);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <AdminShell title="Members">
      <SectionHeading
        title="Member directory"
        subtitle="Search, review, and manage cooperative members."
      />

      <div className="mb-5">
        <BatchRegister />
      </div>

      <Panel
        title="All members"
        action={
          <input
            type="text"
            placeholder="Search name, email, or NID…"
            value={searchQuery}
            onChange={handleSearch}
            className="input-field w-full max-w-xs py-2 text-sm"
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>NID</th>
                <th>Names</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.identification_number}</td>
                    <td className="font-medium">
                      <button
                        type="button"
                        onClick={() => handleView(user)}
                        className="text-left text-primary transition hover:underline"
                      >
                        {user.name}
                      </button>
                    </td>
                    <td>{user.email}</td>
                    <td>0{user.telephone}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.user_id, e.target.value)
                        }
                        className="border border-stone-line bg-white px-2 py-1 text-xs text-primary"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(user)}
                          className="btn-table"
                          title="View profile"
                        >
                          <Icon icon="solar:user-rounded-linear" width="16" height="16" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="btn-table"
                          title="Edit"
                        >
                          <Icon icon="la:edit" width="16" height="16" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.user_id)}
                          className="btn-table text-red-700 hover:border-red-700"
                          title="Delete"
                        >
                          <Icon
                            icon="hugeicons:delete-02"
                            width="16"
                            height="16"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-8 text-center text-stone-mute"
                  >
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 flex items-center justify-between border-t border-stone-line pt-4">
            <button
              type="button"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-sm font-medium text-primary disabled:opacity-40"
            >
              Previous
            </button>
            <p className="text-xs text-stone-mute">
              {currentPage} /{" "}
              {Math.max(1, Math.ceil(filteredUsers.length / logsPerPage))}
            </p>
            <button
              type="button"
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage ===
                Math.ceil(filteredUsers.length / logsPerPage)
              }
              className="text-sm font-medium text-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Panel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-ink/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-stone-line bg-stone-panel p-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-stone-mute hover:text-primary"
            >
              <Icon icon="bx:x-circle" fontSize={24} />
            </button>
            <h2 className="mb-6 text-2xl font-normal tracking-tight text-stone-ink">
              Edit member
            </h2>

      {modalType === "edit" && selectedUser && (
        <form className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              value={selectedUser.name}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              value={selectedUser.email}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, email: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Phone</label>
            <input
              type="text"
              value={selectedUser.telephone}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, telephone: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">NID</label>
            <input
              type="text"
              value={selectedUser.identification_number}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  identification_number: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={selectedUser.date_of_birth}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  date_of_birth: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Place of Birth
            </label>
            <input
              type="text"
              value={selectedUser.place_of_birth}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  place_of_birth: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Residence Place
            </label>
            <input
              type="text"
              value={selectedUser.residence_place}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  residence_place: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Address</label>
            <input
              type="text"
              value={selectedUser.address}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, address: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Shares</label>
            <input
              type="number"
              value={selectedUser.shares}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, shares: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Monthly Saving
            </label>
            <input
              type="number"
              value={selectedUser.monthly_saving}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  monthly_saving: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </form>
      )}
      {modalType === "edit" && (
        <button
          type="button"
          onClick={() => handleUpdate()}
          className="btn-toolbar mt-4"
        >
          <Icon icon="prime:save" width="18" height="18" />
          Save changes
        </button>
      )}
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default UsersTable;
