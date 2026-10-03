import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function MembershipCard({ membership }) {
  if (!membership) return null;

  const isActive = membership.status === "ACTIVE";
  const isLapsed = membership.status === "LAPSED";

  return (
    <div className={`relative max-w-sm mx-auto overflow-hidden rounded-[18px] shadow-xl ${isActive ? 'bg-[var(--color-ink)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)]'}`}>
      
      {/* Tier band (Lamp color) */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[var(--color-lamp)]"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-display font-bold tracking-tight">Skyline</h3>
            <p className={`text-xs ${isActive ? 'text-[var(--color-line)]' : 'text-[var(--color-muted)]'}`}>Student Association</p>
          </div>
          
          <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
            isActive ? 'bg-[var(--color-ok)] text-white' : 
            isLapsed ? 'bg-[var(--color-stop)] text-white' : 
            'bg-[var(--color-wait)] text-white'
          }`}>
            {membership.status}
          </div>
        </div>

        <div className="mb-6">
          <p className={`text-xs uppercase tracking-wider mb-1 ${isActive ? 'text-gray-400' : 'text-[var(--color-muted)]'}`}>Member</p>
          <p className="text-2xl font-display font-semibold">{membership.user?.name || "Student"}</p>
          <p className={`text-sm mt-1 ${isActive ? 'text-gray-300' : 'text-[var(--color-muted)]'}`}>{membership.tier?.name || "Standard Tier"}</p>
        </div>

        <div className="flex items-center justify-center bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
          {/* We use membership ID or code for scanning at door */}
          <QRCodeSVG 
            value={membership.code || membership.id || "MOCK_CODE"} 
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className={`text-xs uppercase tracking-wider mb-1 ${isActive ? 'text-gray-400' : 'text-[var(--color-muted)]'}`}>Valid Thru</p>
            <p className="text-sm font-medium">
              {membership.validUntil 
                ? new Date(membership.validUntil).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                : "N/A"
              }
            </p>
          </div>
          
          <div className="text-right">
            <p className={`text-xs uppercase tracking-wider mb-1 ${isActive ? 'text-gray-400' : 'text-[var(--color-muted)]'}`}>Member No.</p>
            <p className="text-sm font-medium font-mono">{membership.memberNumber || "PENDING"}</p>
          </div>
        </div>
        
        {isLapsed && (
          <div className="mt-6">
            <button className="w-full py-2 bg-[var(--color-dusk)] text-white rounded-[6px] text-sm font-medium hover:bg-opacity-90 transition-opacity">
              Renew Membership
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
