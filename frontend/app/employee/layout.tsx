'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
    Home,
    CalendarCheck,
    LogIn,
    LogOut,
    FileInput,
    FileOutput,
    Info,
    ChevronDown,
    ChevronRight,
    User,
    LogOut as LogoutIcon,
    Menu
} from 'lucide-react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(true);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [empName, setEmpName] = useState('Employee');

    useEffect(() => {
        if (pathname.includes('/employee/attendance')) {
            setIsAttendanceOpen(true);
        }

        const storedName = localStorage.getItem('emp_name');
        if (storedName) {
            setEmpName(storedName);
        } else {
            const token = localStorage.getItem('emp_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.name) {
                        setEmpName(payload.name);
                        localStorage.setItem('emp_name', payload.name);
                    }
                } catch (e) {
                    console.error("Failed to decode token", e);
                }
            }
        }
    }, [pathname]);

    useEffect(() => {
        const preloadFaceImages = async () => {
            const token = localStorage.getItem('emp_token');
            if (!token) return;

            if (sessionStorage.getItem('face_images')) return;
            if (sessionStorage.getItem('face_images_fetching')) return;

            sessionStorage.setItem('face_images_fetching', 'true');
            try {
                console.log('🔄 [Global] Fetching face images from server...');
                const imagesData = await apiRequest('/attendance/me/images', 'GET', null, token);
                if (imagesData?.images?.length) {
                    sessionStorage.setItem('face_images', JSON.stringify(imagesData.images));
                    sessionStorage.setItem('face_images_count', imagesData.images.length.toString());
                    console.log('✅ [Global] Face images pre-loaded successfully');
                }
            } catch (err) {
                console.error('❌ [Global] Failed to pre-load images:', err);
            } finally {
                sessionStorage.removeItem('face_images_fetching');
            }
        };

        preloadFaceImages();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('emp_token');
        localStorage.removeItem('emp_name');
        router.push('/auth/employee/signin');
    };

    const navItems = [
        {
            label: 'Home',
            href: '/employee/home',
            icon: Home
        }
    ];

    const attendanceItems = [
        { label: 'Sign In', href: '/employee/attendance/signin', icon: LogIn },
        { label: 'Sign Out', href: '/employee/attendance/signout', icon: LogOut },
        { label: 'Sign In Request', href: '/employee/attendance/request-signin', icon: FileInput },
        { label: 'Sign Out Request', href: '/employee/attendance/request-signout', icon: FileOutput },
        { label: 'Attendance Log', href: '/employee/attendance/log', icon: CalendarCheck },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo/Brand */}
                <div className="h-16 flex items-center px-6">
                    <img src="/logo.jpg" alt="Pragyatmika" className="h-10 w-auto object-contain" />
                </div>

                {/* User Info */}
                <div className="px-6 py-6 mb-2">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            <User className="w-full h-full p-2 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Hi</p>
                            <p className="font-semibold text-gray-900 leading-tight">{empName}</p>
                            <Link href="/employee/profile" className="text-xs text-blue-500 hover:underline mt-0.5 block">View My Info</Link>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-4 space-y-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                   flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                 `}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Attendance Group */}
                    <div>
                        <button
                            onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <CalendarCheck size={18} />
                                Attendance
                            </div>
                            {isAttendanceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {isAttendanceOpen && (
                            <div className="mt-1 ml-9 space-y-1">
                                {attendanceItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                                                block px-3 py-2 rounded-lg text-sm transition-colors
                                                ${isActive
                                                    ? 'text-blue-600 font-medium'
                                                    : 'text-gray-500 hover:text-gray-900'}
                                            `}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Leave Group */}
                    <div>
                        <button
                            onClick={() => setIsLeaveOpen(!isLeaveOpen)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="rotate-90" /> {/* Using LogOut rotated as a placeholder icon for Leave */}
                                Leave
                            </div>
                            {isLeaveOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {isLeaveOpen && (
                            <div className="mt-1 ml-9 space-y-1">
                                {[
                                    { label: 'Leave Apply', href: '/employee/leave/apply' },
                                    { label: 'Leave Balances', href: '/employee/leave/balances' },
                                    { label: 'Holiday Calendar', href: '/employee/leave/holidays' },
                                ].map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                                                block px-3 py-2 rounded-lg text-sm transition-colors
                                                ${isActive
                                                    ? 'text-blue-600 font-medium'
                                                    : 'text-gray-500 hover:text-gray-900'}
                                            `}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogoutIcon size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-gray-200 lg:hidden flex items-center px-4 justify-between sticky top-0 z-30">
                    <div className="font-bold text-lg text-gray-900">Pragyatmika</div>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
