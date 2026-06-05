import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CalendarIcon, CheckCircle2, MessageSquare, AlertCircle, X, Trash2 } from "lucide-react";
import { useNotificationsStore } from "../store/useNotificationsStore";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile, invisible on desktop but captures clicks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-auto"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-12 right-2 w-80 max-w-[calc(100vw-1rem)] z-[60] bg-pplx-primary border border-pplx-border shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col cursor-default"
            style={{ maxHeight: "calc(100vh - 5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="font-display font-medium text-pplx-text flex items-center gap-2 text-sm">
                <Bell size={16} className="text-pplx-muted" />
                Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                   <span className="bg-pplx-accent text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                     {notifications.filter(n => !n.isRead).length}
                   </span>
                )}
              </h3>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              <div className="flex flex-col">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-pplx-muted opacity-50">
                    <Bell size={32} className="mb-2" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    let Icon = Bell;
                    switch(notif.type) {
                      case "calendar": Icon = CalendarIcon; break;
                      case "task": Icon = CheckCircle2; break;
                      case "message": Icon = MessageSquare; break;
                      case "system": Icon = AlertCircle; break;
                    }

                    return (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`relative flex items-start gap-3 p-3 mx-2 my-1 rounded-xl hover:bg-pplx-hover transition-colors cursor-pointer group ${!notif.isRead ? "bg-pplx-accent/5" : ""}`}
                      >
                        {!notif.isRead && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pplx-accent" />
                        )}
                        
                        <div className={`mt-0.5 p-2 rounded-xl bg-pplx-secondary shrink-0 text-pplx-muted group-hover:text-pplx-accent transition-colors`}>
                          <Icon size={16} className={!notif.isRead ? "text-pplx-accent" : ""} />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex justify-between items-start gap-2 mb-0.5">
                            <h4 className={`text-sm tracking-tight truncate ${!notif.isRead ? "font-semibold text-pplx-text" : "font-medium text-pplx-text/90"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-pplx-muted whitespace-nowrap shrink-0 mt-0.5" title={new Date(notif.time).toLocaleString()}>
                              {formatTimeAgo(notif.time)}
                            </span>
                          </div>
                          <p className="text-xs text-pplx-muted line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-pplx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-400/10"
                          title="Delete notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && notifications.some(n => !n.isRead) ? (
               <div className="p-3">
                   <button 
                     onClick={markAllAsRead}
                     className="w-full text-xs font-medium text-pplx-accent py-2 rounded-xl hover:bg-pplx-accent/10 transition-colors"
                   >
                       Mark all as read
                   </button>
               </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
