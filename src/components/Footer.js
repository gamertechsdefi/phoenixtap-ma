'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, DollarSign, Users, User, Zap } from "lucide-react";

export default function Footer() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/boost", icon: Zap, label: "Boost" },
        { href: "/tasks", icon: DollarSign, label: "Earn" },
        { href: "/friends", icon: Users, label: "Friends" },
        { href: "/claim", icon: User, label: "Leaderboard" },
    ];

    return (
        <footer className="bg-gradient-to-b from-neutral-700 to-neutral-900 text-white sticky bottom-0 flex flex-row gap-8 justify-center items-center px-8 py-4">
            {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href;
                return (
                    <Link 
                        key={href} 
                        href={href} 
                        className={`flex flex-col items-center gap-1 transition-colors ${
                            isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-200'
                        }`}
                    >
                        <Icon size={20} />
                        <span className="text-xs">{label}</span>
                    </Link>
                );
            })}
        </footer>
    );
}