import React, { useState } from 'react'
import { Folder, FolderOpen, FileCode, Copy, Check, Terminal } from 'lucide-react'
import { TranslationDict } from '../translations'
import { CODE_FILES, CodeFile } from '../codefiles'

interface CodeExporterProps {
  t: TranslationDict
  selectedFile: CodeFile
  setSelectedFile: (file: CodeFile) => void
  copied: boolean
  handleCopyCode: () => void
}

export function CodeExporter({ t, selectedFile, setSelectedFile, copied, handleCopyCode }: CodeExporterProps) {
  // Simple state to toggle explorer directories
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({
    infra: true,
    producer: true,
    consumer: true,
    notification: true,
  })

  const toggleDirectory = (key: string) => {
    setOpenDirs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div id="code-ide" className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-4 bg-[#0D111A] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="font-sans border-b border-slate-850 pb-3 flex items-center justify-between">
            <h4 className="font-semibold text-white text-sm flex items-center gap-1.5 leading-none">
              <Folder className="w-4 h-4 text-sky-400" />
              <span>{t.workspaceTitle}</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500 bg-[#05060A] px-1.5 py-0.5 rounded border border-slate-850">Files: {CODE_FILES.length}</span>
          </div>

          <div className="space-y-2 text-left text-xs font-mono select-none">
            <div className="space-y-1">
              <div onClick={() => toggleDirectory('infra')} className="flex items-center space-x-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer text-slate-300 font-semibold">
                {openDirs['infra'] ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>infra / docker</span>
              </div>

              {openDirs['infra'] && (
                <div className="pl-6 space-y-0.5 border-l border-slate-800/80 ml-3.5">
                  {CODE_FILES.filter((f) => f.path.startsWith('docker') || f.path.includes('config')).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-1.5 rounded transition-colors flex items-center space-x-2 ${
                        selectedFile.path === file.path ? 'bg-indigo-950/40 text-indigo-300 font-bold border-l-2 border-indigo-500 rounded-l-none' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div onClick={() => toggleDirectory('producer')} className="flex items-center space-x-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer text-slate-300 font-semibold">
                {openDirs['producer'] ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>services / nest-producer</span>
              </div>

              {openDirs['producer'] && (
                <div className="pl-6 space-y-0.5 border-l border-slate-800/80 ml-3.5">
                  {CODE_FILES.filter((f) => f.path.includes('producer') && !f.path.includes('config')).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-1.5 rounded transition-colors flex items-center space-x-2 ${
                        selectedFile.path === file.path ? 'bg-indigo-950/40 text-indigo-300 font-bold border-l-2 border-indigo-500 rounded-l-none' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div onClick={() => toggleDirectory('consumer')} className="flex items-center space-x-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer text-slate-300 font-semibold">
                {openDirs['consumer'] ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>services / nest-consumer</span>
              </div>

              {openDirs['consumer'] && (
                <div className="pl-6 space-y-0.5 border-l border-slate-800/80 ml-3.5">
                  {CODE_FILES.filter((f) => f.path.includes('consumer') && !f.path.includes('config')).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-1.5 rounded transition-colors flex items-center space-x-2 ${
                        selectedFile.path === file.path ? 'bg-indigo-950/40 text-indigo-300 font-bold border-l-2 border-indigo-500 rounded-l-none' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div onClick={() => toggleDirectory('notification')} className="flex items-center space-x-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer text-slate-300 font-semibold">
                {openDirs['notification'] ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" /> : <Folder className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>services / nest-notification</span>
              </div>

              {openDirs['notification'] && (
                <div className="pl-6 space-y-0.5 border-l border-slate-800/80 ml-3.5">
                  {CODE_FILES.filter((f) => f.path.includes('notification')).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-1.5 rounded transition-colors flex items-center space-x-2 ${
                        selectedFile.path === file.path ? 'bg-indigo-950/40 text-indigo-300 font-bold border-l-2 border-indigo-500 rounded-l-none' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-sans leading-normal">
          This explorer replicates clean modular enterprise architecture. Check each file path above to view active Nest.js decorators.
        </div>
      </div>

      <div className="lg:col-span-8 bg-[#0D111A] rounded-xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
        <div className="bg-[#05060A]/80 border-b border-slate-800/85 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-350 select-none">
            <Terminal className="w-4.5 h-4.5 text-indigo-400" />
            <span className="font-semibold text-white">{selectedFile.path}</span>
            <span className="px-1 bg-slate-800 text-slate-500 text-[9.5px] rounded uppercase border border-slate-800">{selectedFile.language}</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition hover:text-white flex items-center space-x-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 font-mono text-xs leading-relaxed overflow-auto text-slate-300 max-h-[580px] custom-scrollbar text-left select-all">
          <pre>
            {selectedFile.content.split('\n').map((line, idx) => (
              <div key={idx} className="flex hover:bg-slate-900/40">
                <span className="w-8 sticky left-0 shrink-0 text-slate-600 text-right select-none pr-3 border-r border-slate-850/60 font-medium">{idx + 1}</span>
                <span className="pl-4 whitespace-pre pr-4 leading-normal">{line || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}
