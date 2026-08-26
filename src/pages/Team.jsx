import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import PageWrapper from "../components/layout/PageWrapper";
import { Copy, Check, Users, UserCheck, UserMinus, ShieldAlert } from "lucide-react";

export default function Team() {
  const { userProfile, isOwner } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOwner || !userProfile?.shopId) return;
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), where("shopId", "==", userProfile.shopId));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        setUsers(data.sort((a, b) => a.role === 'owner' ? -1 : 1)); // Owner first
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [isOwner, userProfile?.shopId]);

  const updateRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update role", err);
      alert(err.message);
    }
  };

  const copyShopCode = () => {
    navigator.clipboard.writeText(userProfile?.shopId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOwner) return <div className="p-4 text-center mt-10 text-gray-500">Access Denied. Only Shop Owners can manage the team.</div>;

  const pendingUsers = users.filter(u => u.role === "pending");
  const activeUsers = users.filter(u => u.role !== "pending");

  return (
    <PageWrapper title="Team Management">
      <div className="py-4">
        
        {/* Shop Code Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Invite Staff</h2>
          <p className="text-sm text-gray-500 mb-4">Share this code with your employees so they can join your shop.</p>
          
          <div className="flex items-center justify-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200">
            <span className="text-2xl font-black tracking-widest text-blue-700">{userProfile?.shopId}</span>
            <button 
              onClick={copyShopCode}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-orange-500" /> Pending Approvals
            </h3>
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateRole(u.id, 'staff')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 shadow-sm">
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Team */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <UserCheck size={16} className="text-blue-500" /> Active Team
          </h3>
          
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading team...</p>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
                      {u.name} {u.id === userProfile?.uid && <span className="text-xs font-normal text-gray-400">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      u.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  {u.id !== userProfile?.uid && (
                    <button onClick={() => updateRole(u.id, 'pending')} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors" title="Revoke Access">
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
