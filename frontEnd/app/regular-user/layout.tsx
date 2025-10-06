"use client"

import type React from "react"

import { RegularUserSidebar } from "@/components/regular-user-sidebar"

export default function RegularUserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      <RegularUserSidebar />

      <main className="relative z-10 lg:ml-64">{children}</main>

      <style jsx>{`
        .stars-small,
        .stars-medium,
        .stars-large {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .stars-small {
          background-image: radial-gradient(2px 2px at 20px 30px, #eee, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 60px 70px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 50px 50px, #ddd, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 130px 80px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 90px 10px, #eee, rgba(0, 0, 0, 0));
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: twinkle 3s ease-in-out infinite;
        }

        .stars-medium {
          background-image: radial-gradient(3px 3px at 100px 50px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 150px 150px, #ddd, rgba(0, 0, 0, 0)),
            radial-gradient(3px 3px at 50px 100px, #eee, rgba(0, 0, 0, 0));
          background-repeat: repeat;
          background-size: 300px 300px;
          animation: twinkle 5s ease-in-out infinite;
        }

        .stars-large {
          background-image: radial-gradient(4px 4px at 200px 100px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(3px 3px at 300px 200px, #eee, rgba(0, 0, 0, 0));
          background-repeat: repeat;
          background-size: 400px 400px;
          animation: twinkle 7s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
