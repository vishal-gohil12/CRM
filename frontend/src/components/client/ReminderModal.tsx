import React, { useState } from "react";
import { Client } from "../../types";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSchedule: (clientId: string, datetime: string, message: string) => void;
}

export const ReminderModal = ({
  isOpen,
  onClose,
  client,
  onSchedule,
}: ReminderModalProps) => {
  const [datetime, setDatetime] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(client.id, datetime, message);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Schedule Reminder for {client.name}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="datetime"
              className="block text-sm font-medium mb-1"
            >
              Date &amp; Time
            </label>
            <input
              id="datetime"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
