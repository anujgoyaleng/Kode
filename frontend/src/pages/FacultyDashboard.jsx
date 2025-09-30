import { useEffect, useState } from "react";
import { Link } from 'react-router-dom'
import api from "@/api/client";

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/faculty/dashboard");
        setData(res.data.data.dashboard);
        const v = await api.get("/faculty/verifications?limit=10");
        setVerifications(v.data.data.verifications);
      } catch (e) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshAfterAction = async () => {
    try {
      const [dashRes, verRes] = await Promise.all([
        api.get("/faculty/dashboard"),
        api.get("/faculty/verifications?limit=10"),
      ]);
      setData(dashRes.data.data.dashboard);
      setVerifications(verRes.data.data.verifications);
    } catch {}
  };

  const verify = async (item, isVerified) => {
    try {
      await api.put(`/faculty/verify/${item.type}/${item.id}`, { isVerified: !!isVerified });
      await refreshAfterAction();
    } catch (e) {
      const msg = e.response?.data?.message || 'Action failed';
      alert(msg);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-black-400">Loading dashboard...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-pureblack flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-pureblack w-full px-4 md:px-8">
      <div className="py-6 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faculty Dashboard</h1>
            <p className="text-gray-600 dark:text-black-400 mt-1">Manage your students and verifications</p>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-black-400">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data?.totalStudents ?? "-"}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-black-400">Pending Achievements</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data?.pendingVerifications?.achievements ?? "-"}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-black-400">Pending Certificates</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data?.pendingVerifications?.certificates ?? "-"}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📜</span>
              </div>
            </div>
          </div>
        </div>
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-xl text-gray-900 dark:text-white">Pending Verifications</h2>
              <Link to="/verifications" className="btn-secondary text-xs">Go to Approvals →</Link>
            </div>
            <div className="space-y-3">
              {verifications.length > 0 ? (
                verifications.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="border border-gray-200 dark:border-black-700 rounded-lg p-4 bg-gray-50 dark:bg-black-800"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-accent-900/30 text-primary-700 dark:text-accent-300 mr-2">
                        {item.type}
                      </span>
                      {item.title || item.filename}
                    </div>
                    {/* Certificate preview intentionally omitted on dashboard */}
                    {item.student && (
                      <div className="text-xs text-gray-600 dark:text-black-400 mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Student:</span>
                        {' '}{item.student.firstName} {item.student.lastName} • Roll: {item.student.rollNumber}{item.student.section ? ` • Section: ${item.student.section}` : ''}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => verify(item, true)}
                        className="btn-primary text-xs bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => verify(item, false)}
                        className="btn-danger text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-black-400">
                  <span className="text-4xl mb-2 block">✅</span>
                  No pending approvals
                </div>
              )}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">Recent Students</h2>
            <div className="space-y-3">
              {data?.recentStudents?.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center text-sm font-medium text-primary-700 dark:text-accent-300">
                      {(s.firstName?.[0]||'').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</div>
                      <div className="text-sm text-gray-600 dark:text-black-400">Roll: {s.rollNumber}</div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500 dark:text-black-400">
                  <span className="text-4xl mb-2 block">👥</span>
                  No recent students
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
