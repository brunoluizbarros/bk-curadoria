import Link from "next/link";
import { signOutAction } from "@/server/actions/auth";
import {
  IconLayoutDashboard,
  IconPackage,
  IconTag,
  IconFileText,
  IconSettings,
  IconKey,
  IconLogout,
} from "@/components/ui/icons";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/products", label: "Produtos", icon: IconPackage },
  { href: "/admin/categories", label: "Categorias", icon: IconTag },
  { href: "/admin/services", label: "Serviços", icon: IconFileText },
  { href: "/admin/curadoria", label: "Curadoria", icon: IconFileText },
  { href: "/admin/site", label: "Site", icon: IconSettings },
  { href: "/admin/account", label: "Conta", icon: IconKey },
];

export function AdminSidebar() {
  return (
    <aside className="w-56 bg-ink text-cream flex flex-col min-h-screen shrink-0">
      <div className="px-5 py-6 border-b border-cream/10">
        <p className="font-display text-2xl">BK</p>
        <p className="font-body text-[9px] tracking-widest uppercase text-gold/80 mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded text-cream/70 hover:text-cream hover:bg-cream/10 transition-colors text-sm font-body"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-cream/10">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2 rounded text-cream/50 hover:text-cream hover:bg-cream/10 transition-colors text-sm font-body"
          >
            <IconLogout size={16} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
