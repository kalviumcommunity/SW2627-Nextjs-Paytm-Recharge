"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Recharge",
    href: "/recharge",
  },
  {
    label: "Transaction History",
    href: "/transactions",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link
          href="/recharge"
          className="text-xl font-bold text-blue-600"
        >
          Paytm Recharge
        </Link>

        <nav className="flex w-full gap-2 md:w-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition md:flex-none md:px-4 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}