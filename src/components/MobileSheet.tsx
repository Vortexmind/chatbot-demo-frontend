"use client";

import * as DrawerModule from "@cloudflare/kumo/primitives/drawer";
import type { ReactNode } from "react";

/**
 * Kumo ships the Base UI drawer as a single namespace export. The published
 * type declarations expose it as `Drawer` while the runtime bundle exposes the
 * same object as `DrawerPreview`, so resolve both shapes at runtime.
 */
const Drawer = (
  DrawerModule as unknown as {
    DrawerPreview?: typeof DrawerModule.Drawer;
    Drawer?: typeof DrawerModule.Drawer;
  }
).DrawerPreview ?? (DrawerModule as unknown as { Drawer: typeof DrawerModule.Drawer }).Drawer;

type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

/**
 * Bottom sheet used for panel content on viewports narrower than `lg`.
 * Base UI handles the backdrop, focus trap, Escape key, and scroll lock.
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  children,
}: MobileSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup className="flex h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-kumo-line bg-kumo-base shadow-2xl outline-none">
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-kumo-line" />
            <Drawer.Content className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
