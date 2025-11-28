"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { mockConnections } from "@/lib/data";
import { Plus, FolderOpen, Trash2, Edit, ChevronDown } from "lucide-react";

export default function ProjectsPage() {
  const { projects, activeProjectId, setActiveProject, createProject, updateProject, deleteProject } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConnMenu, setShowConnMenu] = useState(false);

  const toggleConn = (id: string) => {
    setSelectedConnections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!projectName.trim() || selectedConnections.length === 0) return;
    const id = createProject(projectName.trim(), selectedConnections);
    setActiveProject(id);
    setShowModal(false);
    setProjectName("");
    setSelectedConnections([]);
  };

  const startEdit = (id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    setEditingId(id);
    setProjectName(p.name);
    setSelectedConnections(p.connectionIds);
    setShowModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateProject(editingId, { name: projectName.trim(), connectionIds: selectedConnections });
    setShowModal(false);
    setEditingId(null);
    setProjectName("");
    setSelectedConnections([]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FolderOpen className="w-5 h-5"/>Projects</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-lg border ${activeProjectId===p.id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} p-4`}> 
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-md font-medium text-gray-900 dark:text-white">{p.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{p.connectionIds.length} connections</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveProject(p.id)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Activate</button>
                <button onClick={() => startEdit(p.id)} className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit className="w-4 h-4"/></button>
                <button onClick={() => deleteProject(p.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.connectionIds.map((id) => {
                const conn = mockConnections.find(c=>c.id===id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                    <FolderOpen className="w-3 h-3" />{conn?.name || id}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-md font-semibold text-gray-900 dark:text-white">{editingId ? 'Edit Project' : 'Create Project'}</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Project name</label>
                <input
                  value={projectName}
                  onChange={(e)=>setProjectName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Connections</label>
                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => setShowConnMenu(!showConnMenu)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <span className="text-sm">Selected {selectedConnections.length} of {mockConnections.length}</span>
                    <ChevronDown className={`w-4 h-4 ${showConnMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showConnMenu && (
                    <div className="absolute z-10 mt-1 w-full max-h-44 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
                      <div className="p-2 space-y-1">
                        {mockConnections.map(conn => (
                          <label key={conn.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input
                              type="checkbox"
                              checked={selectedConnections.includes(conn.id)}
                              onChange={()=>toggleConn(conn.id)}
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{conn.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700">
              <button onClick={()=>{setShowModal(false); setEditingId(null);}} className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              {editingId ? (
                <button onClick={handleSaveEdit} disabled={!projectName.trim() || selectedConnections.length===0} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save</button>
              ) : (
                <button onClick={handleCreate} disabled={!projectName.trim() || selectedConnections.length===0} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Create</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}