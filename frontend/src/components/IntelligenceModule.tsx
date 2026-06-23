import React from "react";

interface IntelligenceModuleProps {
  title: string;
  label: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  headerBadge?: React.ReactNode;
  children: React.ReactNode;
}

export default function IntelligenceModule({
  title,
  label,
  icon: Icon,
  accentColor,
  accentBg,
  headerBadge,
  children,
}: IntelligenceModuleProps) {
  return (
    <div
      className="premium-card rounded-xl overflow-hidden flex flex-col w-full"
      style={{
        background: "linear-gradient(135deg, #081120 0%, #0B1220 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: accentBg,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
          <div className="flex-1 min-w-0">
            <p className="section-label mb-0">{label}</p>
            <p className="text-white font-semibold text-sm leading-none mt-0.5">
              {title}
            </p>
          </div>
        </div>
        {headerBadge ? headerBadge : (
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: accentColor, opacity: 0.7 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-5 flex flex-col w-full break-words">{children}</div>
    </div>
  );
}
