import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glow?: boolean;
}

export default function Card({ children, className = "", glow = false, ...props }: CardProps) {
    return (
        <div
            className={`
        relative overflow-hidden rounded-none border border-white/5 bg-slate-950/40 p-6 transition-all duration-500 hover:border-cyan-500/50 hover:bg-slate-900/60
        ${glow ? "hover:shadow-[0_0_50px_-10px_rgba(0,242,255,0.3)] shadow-[0_0_30px_-15px_rgba(255,0,234,0.1)]" : "hover:shadow-[0_0_30px_-10px_rgba(0,242,255,0.15)]"}
        ${className}
      `}
            {...props}
        >
            {/* Subtle top light effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {children}
        </div>
    );
}
