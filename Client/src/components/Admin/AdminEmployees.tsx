import React, { useState } from 'react'
import API from '../../services/api'

interface Employee {
    _id: string
    name: string
    email: string
    phone: string
    role: 'Admin' | 'Employee'
    status: 'Active' | 'Inactive'
    department?: string
    manager?: string
    officeLocation?: string
}

interface AdminEmployeesProps {
    employees: Employee[]
    onRefresh: () => void
    currentUser: { _id: string } | null
}

const AdminEmployees: React.FC<AdminEmployeesProps> = ({ employees, onRefresh, currentUser }) => {
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)

    // Add form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState<'Admin' | 'Employee'>('Employee')
    const [department, setDepartment] = useState('')
    const [manager, setManager] = useState('')
    const [officeLocation, setOfficeLocation] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [modalError, setModalError] = useState('')
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')

    const handleToggleStatus = async (emp: Employee) => {
        setActionError('')
        setActionSuccess('')
        const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active'
        try {
            await API.put(`/admin/employees/${emp._id}/status`, { status: nextStatus })
            setActionSuccess(`Successfully changed status of ${emp.name} to ${nextStatus}.`)
            onRefresh()
        } catch (err: any) {
            setActionError(err.response?.data?.message || 'Failed to update employee status.')
        }
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setModalError('')
        setSubmitting(true)
        try {
            await API.post('/admin/employees', {
                name,
                email,
                password,
                phone,
                role,
                department,
                manager,
                officeLocation
            })
            setShowAddModal(false)
            // Clear form
            setName('')
            setEmail('')
            setPassword('')
            setPhone('')
            setRole('Employee')
            setDepartment('')
            setManager('')
            setOfficeLocation('')
            onRefresh()
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to register employee.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Maintain personnel records and access permissions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    + Register Employee
                </button>
            </div>

            {actionSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    {actionSuccess}
                </div>
            )}
            {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {/* Employee Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map((emp) => {
                                const isSelf = emp._id === currentUser?._id
                                return (
                                    <tr key={emp._id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {emp.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-none">{emp.name}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                emp.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'
                                            }`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {emp.department || <span className="text-slate-350 italic">None</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                                                emp.status === 'Active' ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    emp.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => setSelectedEmp(emp)}
                                                className="text-xs px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 font-semibold rounded-lg transition-colors text-slate-600"
                                            >
                                                Details
                                            </button>
                                            {isSelf ? (
                                                <span className="text-xs text-slate-400 italic">Self</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleStatus(emp)}
                                                    className={`text-xs px-2.5 py-1.5 font-bold rounded-lg border transition-colors ${
                                                        emp.status === 'Active'
                                                            ? 'border-red-100 text-red-500 hover:bg-red-50'
                                                            : 'border-green-100 text-green-600 hover:bg-green-50'
                                                    }`}
                                                >
                                                    {emp.status === 'Active' ? 'Revoke Access' : 'Grant Access'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        No registered employees found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Employee Details */}
            {selectedEmp && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-lg">Employee Details</h3>
                            <button onClick={() => setSelectedEmp(null)} className="text-slate-450 hover:text-slate-600 text-xl leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                    {selectedEmp.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{selectedEmp.name}</h4>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        selectedEmp.role === 'Admin' ? 'bg-indigo-50 text-indigo-750' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {selectedEmp.role}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                                    <p className="font-medium text-slate-700 mt-0.5 truncate">{selectedEmp.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Phone</p>
                                    <p className="font-medium text-slate-700 mt-0.5">{selectedEmp.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Department</p>
                                    <p className="font-medium text-slate-700 mt-0.5">{selectedEmp.department || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Manager</p>
                                    <p className="font-medium text-slate-700 mt-0.5">{selectedEmp.manager || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Office Location</p>
                                    <p className="font-medium text-slate-700 mt-0.5">{selectedEmp.officeLocation || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Employee */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-lg">Add New Employee</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-450 hover:text-slate-600 text-xl leading-none">×</button>
                        </div>
                        {modalError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {modalError}
                            </div>
                        )}
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Alice Cooper"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Work Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="alice@company.com"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 chars"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. 9876543210"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">System Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Employee">Employee (Commuter)</option>
                                        <option value="Admin">Company Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="e.g. Engineering"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Manager</label>
                                    <input
                                        type="text"
                                        value={manager}
                                        onChange={(e) => setManager(e.target.value)}
                                        placeholder="e.g. Bob Smith"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Office Location</label>
                                    <input
                                        type="text"
                                        value={officeLocation}
                                        onChange={(e) => setOfficeLocation(e.target.value)}
                                        placeholder="e.g. Floor 3, Gandhinagar Office"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    {submitting ? 'Registering...' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminEmployees
