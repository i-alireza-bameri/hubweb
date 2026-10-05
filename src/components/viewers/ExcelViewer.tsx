import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table, Search, Download, FileSpreadsheet, Eye } from 'lucide-react';

interface ExcelViewerProps {
  value?: string;
  fileUrl?: string;
  fileName?: string;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  value = '',
  fileUrl,
  fileName = 'Spreadsheet.xlsx',
}) => {
  const [sheets, setSheets] = useState<{ [name: string]: any[][] }>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number; val: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseWorkbook = async () => {
      setLoading(true);
      setError(null);
      try {
        let wb: XLSX.WorkBook;

        if (fileUrl) {
          const res = await fetch(fileUrl);
          const arrayBuffer = await res.arrayBuffer();
          wb = XLSX.read(arrayBuffer, { type: 'array' });
        } else if (value) {
          // If value is CSV or text
          wb = XLSX.read(value, { type: 'string' });
        } else {
          // Default fallback mock
          const defaultCSV = `Category,Q1,Q2,Q3,Q4,Annual Total
Infrastructure & Compute,12000,14500,16200,18000,60700
Database Replication,4500,4800,5200,5600,20100
Edge Bandwidth & CDN,2800,3100,3400,3800,13100
R&D Engineering,45000,48000,52000,55000,200000
Gross Revenue,98000,115000,132000,154000,499000
Operating Margin (%),35.4%,37.8%,41.2%,46.5%,40.2%`;
          wb = XLSX.read(defaultCSV, { type: 'string' });
        }

        const parsedSheets: { [name: string]: any[][] } = {};
        wb.SheetNames.forEach((name) => {
          const ws = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
          parsedSheets[name] = data;
        });

        setSheets(parsedSheets);
        setSheetNames(wb.SheetNames);
        setActiveSheet(wb.SheetNames[0] || '');
      } catch (err: any) {
        setError(`Could not parse spreadsheet data: ${err.message || 'Corrupt format'}`);
      } finally {
        setLoading(false);
      }
    };

    parseWorkbook();
  }, [value, fileUrl]);

  const activeData = sheets[activeSheet] || [];

  // Filter rows based on search
  const filteredRows = searchQuery
    ? activeData.filter((row, idx) => {
        if (idx === 0) return true; // keep header
        return row.some((cell) => String(cell).toLowerCase().includes(searchQuery.toLowerCase()));
      })
    : activeData;

  const maxCols = Math.max(...activeData.map((r) => r.length), 1);
  const colLetters = Array.from({ length: maxCols }, (_, i) => {
    let letter = '';
    let temp = i;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  });

  const getCellCoord = (r: number, c: number) => {
    const colName = colLetters[c] || `C${c + 1}`;
    return `${colName}${r + 1}`;
  };

  const handleExportCSV = () => {
    if (!activeData.length) return;
    const ws = XLSX.utils.aoa_to_sheet(activeData);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span>Parsing Excel spreadsheet data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Top Bar with file name, search and export */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-2 text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          <span className="font-mono font-medium text-neutral-200">{fileName}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">{activeData.length} rows</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 font-mono tabular-nums">{maxCols} columns</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search inside sheet */}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search cells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-neutral-800 bg-neutral-900 py-1 pl-7 pr-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Formula & Active Cell Bar */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-900/30 px-3 py-1.5 text-xs font-mono">
        <div className="w-16 font-semibold text-indigo-400 border-r border-neutral-800/80 pr-2">
          {selectedCell ? getCellCoord(selectedCell.r, selectedCell.c) : 'A1'}
        </div>
        <div className="px-3 text-neutral-400 font-normal">fx</div>
        <div className="flex-1 truncate text-neutral-200 pl-2">
          {selectedCell ? String(selectedCell.val ?? '') : activeData[0]?.[0] ?? ''}
        </div>
      </div>

      {/* Spreadsheet Grid View */}
      <div className="flex-1 overflow-auto bg-neutral-950">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 select-none">
              <th className="w-12 border-r border-neutral-800 p-2 text-center font-normal text-neutral-500 bg-neutral-900">
                #
              </th>
              {colLetters.map((col, cIdx) => (
                <th
                  key={cIdx}
                  className="min-w-[120px] border-r border-neutral-800 p-2 text-center font-semibold text-neutral-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-900/50 transition-colors">
                <td className="sticky left-0 border-r border-neutral-800 bg-neutral-950 p-2 text-center text-neutral-500 select-none tabular-nums font-mono">
                  {rIdx + 1}
                </td>
                {colLetters.map((_, cIdx) => {
                  const val = row[cIdx];
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  const isNumeric = typeof val === 'number' || (!isNaN(Number(val)) && val !== '');

                  return (
                    <td
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx, val })}
                      className={`border-r border-neutral-800/60 p-2 truncate max-w-[200px] cursor-cell ${
                        isSelected ? 'bg-indigo-950/60 ring-1 ring-indigo-500 text-indigo-100 font-semibold' : 'text-neutral-300'
                      } ${isNumeric ? 'text-right tabular-nums' : 'text-left'}`}
                      title={String(val ?? '')}
                    >
                      {String(val ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs Footer */}
      <div className="flex items-center border-t border-neutral-800 bg-neutral-900 px-2 py-1 text-xs select-none">
        <div className="flex items-center gap-1 overflow-x-auto">
          {sheetNames.map((name) => (
            <button
              key={name}
              onClick={() => {
                setActiveSheet(name);
                setSelectedCell(null);
              }}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeSheet === name
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
