import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissionUtils';

/**
 * Debug Permissions Page
 * Shows current user permissions for troubleshooting
 * Access at: /debug-permissions
 */
const DebugPermissions = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Not logged in</div>;
  }

  const testPermissions = [
    'contacts.view',
    'contacts.create',
    'companies.view',
    'companies.create',
    'segments.view',
    'deals.view',
    'users.view',
    'permissions.manage',
    'organization.edit'
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Permission Debugging</h1>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Information</h2>
        <div className="space-y-2 font-mono text-sm">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Full Name:</strong> {user.fullName}</div>
          <div><strong>Role (slug):</strong> {user.role}</div>
          <div><strong>Role ID:</strong> {user.roleId}</div>
          <div><strong>Role Name:</strong> {user.roleName}</div>
        </div>
      </div>

      {/* Role Permissions from Database */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Role Permissions (from Database)</h2>
        {user.rolePermissions && user.rolePermissions.length > 0 ? (
          <div className="space-y-1">
            <div className="font-mono text-sm text-gray-600 mb-2">
              Total: {user.rolePermissions.length} permissions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {user.rolePermissions.map((perm, idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded px-3 py-1 text-sm">
                  ✅ {perm}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-red-600 font-semibold">
            ⚠️ NO ROLE PERMISSIONS FOUND!
            <div className="text-sm mt-2 text-gray-600">
              This means the user object doesn't have rolePermissions array.
              You need to LOGOUT and LOGIN again to refresh the JWT token.
            </div>
          </div>
        )}
      </div>

      {/* Custom Permissions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Custom Permissions (Grant/Revoke)</h2>
        {user.permissions ? (
          <div className="font-mono text-sm">
            <div><strong>Grants:</strong> {JSON.stringify(user.permissions.grant || [])}</div>
            <div><strong>Revokes:</strong> {JSON.stringify(user.permissions.revoke || [])}</div>
          </div>
        ) : (
          <div className="text-gray-500">No custom permissions</div>
        )}
      </div>

      {/* Permission Tests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Permission Tests</h2>
        <div className="space-y-2">
          {testPermissions.map(perm => {
            const has = hasPermission(user, perm);
            return (
              <div
                key={perm}
                className={`flex items-center justify-between px-4 py-2 rounded ${
                  has ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <span className="font-mono text-sm">{perm}</span>
                <span className={`font-semibold ${has ? 'text-green-600' : 'text-red-600'}`}>
                  {has ? '✅ HAS' : '❌ NO'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw User Object */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-6 mt-6 overflow-auto">
        <h2 className="text-lg font-semibold mb-4 text-white">Raw User Object (from localStorage)</h2>
        <pre className="text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">⚠️ If permissions look wrong:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Logout</strong> from the app</li>
          <li>Open browser console (F12) and run: <code className="bg-white px-2 py-1 rounded">localStorage.clear(); sessionStorage.clear();</code></li>
          <li><strong>Hard refresh</strong>: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
          <li><strong>Login again</strong></li>
          <li>Come back to this page to verify</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPermissions;
