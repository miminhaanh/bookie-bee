import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  display_name: string;
  banned_at: string | null;
}

export const AdminUsers = () => {
  const { isAdmin, getAllUsers, banUser, unbanUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const { error } = await banUser(userId);
    if (!error) {
      await fetchUsers();
    } else {
      alert("Error banning user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const { error } = await unbanUser(userId);
    if (!error) {
      await fetchUsers();
    } else {
      alert("Error unbanning user");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 p-2 text-left">Email</th>
            <th className="border border-gray-300 p-2 text-left">Display Name</th>
            <th className="border border-gray-300 p-2 text-left">Status</th>
            <th className="border border-gray-300 p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2">{user.email}</td>
              <td className="border border-gray-300 p-2">{user.display_name}</td>
              <td className="border border-gray-300 p-2">
                {user.banned_at ? (
                  <span className="text-red-600 font-semibold">Banned</span>
                ) : (
                  <span className="text-green-600 font-semibold">Active</span>
                )}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {user.banned_at ? (
                  <button
                    onClick={() => handleUnbanUser(user.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanUser(user.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
