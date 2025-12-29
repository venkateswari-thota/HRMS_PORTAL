'use client';
import { useEffect, useState } from 'react';

export default function EmployeeHome() {
    const [empName, setEmpName] = useState('Employee');

    useEffect(() => {
        const storedName = localStorage.getItem('emp_name');
        if (storedName) {
            setEmpName(storedName);
        } else {
            const token = localStorage.getItem('emp_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.name) setEmpName(payload.name);
                } catch (e) { }
            }
        }
    }, []);

    return (
        <div className="space-y-6">
            {/* Top Banner similar to reference */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Your Gateway to Possibilities</h3>
                        <p className="text-sm text-gray-500">Loans, Taxes, Salary Advances, All within Pragyatmika!</p>
                    </div>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                    Explore
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Review Widget */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Review</h3>
                    </div>
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="mb-4 text-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <p className="text-gray-500 text-sm">Hurrah! You've nothing to review.</p>
                    </div>
                </div>

                {/* Date / Shift Widget */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">28 December 2025</h3>
                                <p className="text-sm text-gray-500">Sunday | General Shift</p>
                            </div>
                            <div className="h-3 w-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="mt-6 text-3xl font-mono text-gray-800">
                            14:21:14
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
                            Sign In
                        </button>
                    </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Quick Access</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between">
                            <span>Reimbursement Payslip</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between">
                            <span>IT Statement</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between">
                            <span>YTD Reports</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between">
                            <span>Loan Statement</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
                </div>

                {/* Payslip Mockup */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-gray-700">Payslip</h3>
                        <a href="#" className="text-blue-600 text-sm hover:underline">View Details -&gt;</a>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative h-32 w-32 border-8 border-blue-500 rounded-full flex items-center justify-center">
                            <div className="absolute inset-0 border-8 border-green-300 rounded-full clip-half"></div>
                            <span className="font-bold text-gray-800">Nov 2025</span>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 text-sm">Paid Days</span>
                                <span className="font-medium">28</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 text-sm border-l-4 border-blue-500 pl-2">Gross Pay</span>
                                <span className="font-medium">*****</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500 text-sm border-l-4 border-green-300 pl-2">Deduction</span>
                                <span className="font-medium">*****</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm border-l-4 border-gray-800 pl-2">Net Pay</span>
                                <span className="font-medium">*****</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <button className="text-blue-600 text-sm hover:underline">Download</button>
                        <button className="text-blue-600 text-sm hover:underline">Show Salary</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
