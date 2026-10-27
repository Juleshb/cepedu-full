import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

const ActionLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axiosInstance.get("/admin-logs");
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      (log.affected_table &&
        log.affected_table.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Icon
            icon="solar:magnifer-linear"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-mute"
            width="16"
            height="16"
          />
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field py-2.5 pl-9 text-sm"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCurrentPage(1);
            }}
            className="border border-stone-line px-3 text-xs font-semibold text-stone-mute transition hover:border-primary hover:text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Icon
            icon="svg-spinners:ring-resize"
            className="text-primary"
            width="28"
            height="28"
          />
        </div>
      ) : currentLogs.length > 0 ? (
        <ul className="space-y-3">
          {currentLogs.map((log) => (
            <motion.li
              key={log.log_id || log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-stone-line bg-white px-3.5 py-3"
            >
              <p className="text-sm font-medium text-stone-ink line-clamp-2">
                {log.action}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-mute">
                <Icon icon="solar:clock-circle-linear" width="14" height="14" />
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-stone-mute">No logs found.</p>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-stone-line pt-4">
        <button
          type="button"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary disabled:opacity-40"
        >
          <Icon icon="solar:arrow-left-linear" width="16" height="16" />
          Prev
        </button>
        <p className="text-xs text-stone-mute">
          {currentPage} / {pageCount}
        </p>
        <button
          type="button"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary disabled:opacity-40"
        >
          Next
          <Icon icon="solar:arrow-right-linear" width="16" height="16" />
        </button>
      </div>
    </div>
  );
};

export default ActionLogs;
