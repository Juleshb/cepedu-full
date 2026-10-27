import React, { useState, useEffect } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { UserShell } from "../../layout/AppShell";
import { Panel, SectionHeading } from "../../layout/DashboardUI";

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users");
  
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
    setSelectedUser(user);
    setModalType("view");
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/users/${userId}`);
        setUsers(users.filter((user) => user.user_id !== userId));
        alert("User deleted successfully.");
      } catch (error) {
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `/api/users/${selectedUser.user_id}`,
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
  };

  if (loading) {
    return (
      <UserShell title="Members">
        <p className="py-16 text-center text-stone-mute">Loading…</p>
      </UserShell>
    );
  }

  if (error) {
    return (
      <UserShell title="Members">
        <p className="alert-error">{error}</p>
      </UserShell>
    );
  }

  return (
    <UserShell title="Members">
      <SectionHeading title="Member directory" subtitle="Browse cooperative members." />
      <Panel
        title="Members"
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.identification_number}</td>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.telephone}</td>
                    <td className="capitalize">{user.role}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(user)}
                          className="btn-table"
                        >
                          <Icon icon="mdi:eye" width="16" height="16" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="btn-table"
                        >
                          <Icon icon="la:edit" width="16" height="16" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.user_id)}
                          className="btn-table text-red-700"
                        >
                          <Icon icon="hugeicons:delete-02" width="16" height="16" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-stone-mute">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6">
            <button
               onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <Icon icon="bx:x-circle" fontSize={24} />
            </button>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {modalType === "edit" ? "Edit User Details" : "User Details"}
      </h2>

      {modalType === "view" && selectedUser && (
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>Name:</strong> {selectedUser.name}
          </p>
          <p>
            <strong>Email:</strong> {selectedUser.email}
          </p>
          <p>
            <strong>Phone:</strong> {selectedUser.telephone}
          </p>
          <p>
            <strong>Role:</strong> {selectedUser.role}
          </p>
          <p>
            <strong>NID:</strong> {selectedUser.identification_number}
          </p>
          <p>
            <strong>Date of Birth:</strong> {new Date(selectedUser.date_of_birth).toLocaleDateString()}
          </p>
          <p>
            <strong>Place of Birth:</strong> {selectedUser.place_of_birth}
          </p>
          <p>
            <strong>Residence:</strong> {selectedUser.residence_place}
          </p>
          <p>
            <strong>Address:</strong> {selectedUser.address}
          </p>
          <p>
            <strong>Position:</strong> {selectedUser.position}
          </p>
          <p>
            <strong>Place of Working:</strong> {selectedUser.place_of_working}
          </p>
          <p>
            <strong>Marital Status:</strong> {selectedUser.marital_status}
          </p>
          <p>
            <strong>Spouse Name:</strong> {selectedUser.spouse_name}
          </p>
          <p>
            <strong>Spouse NID:</strong> {selectedUser.spouse_id_number}
          </p>
          <p>
            <strong>Spouse Phone:</strong> {selectedUser.spouse_telephone}
          </p>
          <p>
            <strong>Shares:</strong> {selectedUser.shares}
          </p>
          <p>
            <strong>Monthly Saving:</strong> {selectedUser.monthly_saving}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(selectedUser.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

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
          onClick={() => handleUpdate()}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
         <Icon icon="prime:save" width="24" height="24" />
        </button>
      )}
    </div>
  </div>
)}

      
    </UserShell>
  );
};

export default UsersTable;
