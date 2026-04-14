import React from "react";
import { PortfolioDashboard } from "./portfolio/PortfolioDashboard";

interface DashboardViewProps {
  onClose?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = () => {
  return <PortfolioDashboard />;
};
