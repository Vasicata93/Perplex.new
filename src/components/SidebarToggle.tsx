import React, { useState } from "react";
import { Tooltip } from "./Tooltip";

interface SidebarToggleProps {
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  size?: number;
  showTooltip?: boolean;
  tooltipText?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  onClick,
  className = "",
  size = 20,
  showTooltip = true,
  tooltipText = "Toggle Sidebar",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`p-2 hover:bg-pplx-hover rounded-xl text-pplx-muted transition-all group flex items-center justify-center ${className}`}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform group-hover:scale-110"
        >
          <path
            d="M4 7H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 group-hover:stroke-pplx-accent"
          />
          <path
            d="M4 12H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 group-hover:stroke-pplx-accent"
          />
          <path
            d="M4 17H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-300 group-hover:stroke-pplx-accent"
          />
        </svg>
      </button>
      {isHovered && showTooltip && (
        <Tooltip text={tooltipText} position="right" />
      )}
    </div>
  );
};
