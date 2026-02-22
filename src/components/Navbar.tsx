"use client";
import React from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-[100] w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-none bg-cyan-500 font-bold text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:bg-cyan-400 transition-all duration-300">
                        A
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white group-hover:text-cyan-400 transition-colors uppercase">
                        Ace<span className="text-cyan-500">It</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-8 md:flex">
                    <NavLink href="#features">Features</NavLink>
                    <NavLink href="#how-it-works">How it works</NavLink>
                    <NavLink href="#team">Team</NavLink>
                    <NavLink href="#faq">FAQ</NavLink>
                </div>

                {/* Auth Actions */}
                <div className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                                [ LOG_IN ]
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="rounded-none bg-cyan-500 px-6 py-2 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 hover:shadow-cyan-400/60 transition-all active:scale-95 uppercase tracking-tighter">
                                Start_Interview
                            </button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Link
                            href="/interviewer-selection"
                            className="rounded-none bg-pink-500 px-6 py-2 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:bg-pink-400 hover:shadow-pink-400/60 transition-all active:scale-95 uppercase tracking-tighter"
                        >
                            Dashboard_Entry
                        </Link>
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "h-8 w-8 border border-white/10"
                                }
                            }}
                            afterSignOutUrl="/"
                        />
                    </SignedIn>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest"
        >
            {children}
        </Link>
    );
}
