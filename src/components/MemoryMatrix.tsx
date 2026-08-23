import React, { useState } from "react";
import { MemoryItem } from "../types";
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Tag,
  Clock,
  Filter,
  Bookmark,
} from "lucide-react";
import { jarvisSound } from "../services/soundEffects";

interface MemoryMatrixProps {
  memories: MemoryItem[];
  onAddMemory: (mem: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteMemory: (id: string) => void;
  onUpdateMemory: (mem: MemoryItem) => void;
}

export const MemoryMatrix: React.FC<MemoryMatrixProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onUpdateMemory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New item form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryItem["category"]>("fact");
  const [newTags, setNewTags] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    jarvisSound.playSuccess();
    onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setIsAdding(false);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider font-mono">
              LONG-TERM MEMORY & CONTEXT MATRIX
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured persistent memory store for user preferences, projects, facts, and workflow history.
          </p>
        </div>

        <button
          id="add-memory-btn"
          onClick={() => {
            jarvisSound.playBlip();
            setIsAdding(!isAdding);
          }}
          className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-md shadow-cyan-900/30 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? "CANCEL" : "STORE NEW MEMORY"}
        </button>
      </div>

      {/* Add New Memory Card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 font-mono text-xs"
        >
          <div className="text-cyan-400 font-semibold flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            RECORD PERSISTENT MEMORY ENTRY
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Title / Identifier</label>
              <input
                type="text"
                placeholder="e.g. Master Developer Identity, Coffee Temperature..."
                value={newTitle ?? ""}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={newCategory ?? "preference"}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="preference">User Preference</option>
                <option value="project">Active Project</option>
                <option value="decision">Past Decision</option>
                <option value="fact">Key Fact</option>
                <option value="note">Operational Note</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Memory Content / Detail</label>
            <textarea
              rows={3}
              placeholder="Enter exact context, parameters, or instructions for JARVIS to remember..."
              value={newContent ?? ""}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. creator, auth, priorities, iot"
              value={newTags ?? ""}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
            >
              <Check className="w-3.5 h-3.5" />
              Commit to Matrix
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memory records..."
            value={searchTerm ?? ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-auto text-xs font-mono">
          {["ALL", "preference", "project", "decision", "fact", "note"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                jarvisSound.playBlip();
                setSelectedCategory(cat);
              }}
              className={`px-2.5 py-1 rounded capitalize cursor-pointer ${
                selectedCategory === cat
                  ? "bg-cyan-900/70 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            id={`memory-card-${mem.id}`}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    mem.category === "preference"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                      : mem.category === "project"
                      ? "bg-purple-950 text-purple-300 border-purple-800"
                      : mem.category === "decision"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {mem.category}
                </span>
                <h3 className="text-sm font-semibold text-slate-100">{mem.title}</h3>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    jarvisSound.playAlert();
                    onDeleteMemory(mem.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                  title="Purge Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/60 font-mono">
              {mem.content}
            </p>

            {/* Tags & Timestamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
              <div className="flex flex-wrap items-center gap-1">
                <Tag className="w-3 h-3 text-slate-600" />
                {mem.tags.map((t, idx) => (
                  <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{mem.updatedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
