"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/server/actions/auth";
import {
  IconLayoutDashboard,
  IconPackage,
  IconTag,
  IconFileText,
  IconSettings,
  IconKey,
  IconLogout,
  IconMenu2,
  IconX,
  IconFolder,
  IconHeart,
  IconReceipt,
  IconUsers,
  IconCashBanknote,
  IconCoin,
  IconReportMoney,
  IconChartBar,
} from "@/components/ui/icons";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: IconReceipt },
  { href: "/admin/clientes", label: "Clientes", icon: IconUsers },
  { href: "/admin/analises", label: "Análises", icon: IconChartBar },
  { href: "/admin/recebimentos", label: "Recebimentos", icon: IconCashBanknote },
  { href: "/admin/despesas", label: "Despesas", icon: IconCoin },
  { href: "/admin/dre", label: "DRE", icon: IconReportMoney },
  { href: "/admin/products", label: "Produtos", icon: IconPackage },
  { href: "/admin/categories", label: "Categorias", icon: IconTag },
  { href: "/admin/services", label: "Serviços", icon: IconFileText },
  { href: "/admin/curadoria", label: "Curadoria", icon: IconFileText },
  { href: "/admin/site", label: "Site", icon: IconSettings },
  { href: "/admin/wishlists", label: "Listas de desejos", icon: IconHeart },
  { href: "/admin/storage", label: "Arquivos", icon: IconFolder },
  { href: "/admin/configuracoes", label: "Configurações", icon: IconSettings },
  { href: "/admin/account", label: "Conta", icon: IconKey },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
    </>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Barra superior mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-ink text-cream flex items-center px-4 gap-3 border-b border-cream/10">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-cream/10 transition-colors"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </button>
        <div className="leading-none">
          <p className="font-display text-xl leading-none">BK</p>
          <p className="font-body text-[9px] tracking-widest uppercase text-gold/80">Admin</p>
        </div>
      </div>

      {/* Overlay + Drawer mobile */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/60 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed top-14 left-0 bottom-0 z-50 w-56 bg-ink text-cream flex flex-col md:hidden"
            role="dialog"
            aria-label="Menu de navegação"
          >
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 bg-ink text-cream flex-col min-h-screen shrink-0">
        <div className="px-5 py-6 border-b border-cream/10">
          <p className="font-display text-2xl">BK</p>
          <p className="font-body text-[9px] tracking-widest uppercase text-gold/80 mt-0.5">Admin</p>
        </div>
        <NavLinks />
      </aside>
    </>
  );
}
