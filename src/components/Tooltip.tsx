import React from "react";

interface TooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({ text, position = "top" }) => {
  const getPositionClasses = () => {
    switch (position) {
      case "bottom": return "top-10 left-1/2 -translate-x-1/2";
      case "left": return "right-full mr-3 top-1/2 -translate-y-1/2";
      case "right": return "left-full ml-3 top-1/2 -translate-y-1/2";
      default: return "-top-10 left-1/2 -translate-x-1/2"; // top
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "bottom": return "-top-1 left-1/2 -translate-x-1/2 border-b-4 border-b-pplx-border border-l-4 border-l-transparent border-r-4 border-r-transparent";
      case "left": return "-right-1 top-1/2 -translate-y-1/2 border-l-4 border-l-pplx-border border-t-4 border-t-transparent border-b-4 border-b-transparent";
      case "right": return "-left-1 top-1/2 -translate-y-1/2 border-r-4 border-r-pplx-border border-t-4 border-t-transparent border-b-4 border-b-transparent";
      default: return "-bottom-1 left-1/2 -translate-x-1/2 border-t-4 border-t-pplx-border border-l-4 border-l-transparent border-r-4 border-r-transparent";
    }
  };

  return (
    <div
      className={`hidden md:block absolute ${getPositionClasses()} !m-0 z-50 pointer-events-none w-max`}
    >
      <div className="animate-fadeIn bg-pplx-card text-pplx-text text-[11px] font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-pplx-border relative">
        {text}
        <div className={`absolute ${getArrowClasses()}`} />
      </div>
    </div>
  );
};
