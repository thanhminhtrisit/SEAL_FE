import React, { useEffect, useState } from 'react';
import { ranking, ScoreBreakdownResponse } from '../../../api/ranking';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  roundId: number;
  teamName: string;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  teamId,
  roundId,
  teamName,
}) => {
  const [breakdownData, setBreakdownData] = useState<ScoreBreakdownResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teamId && roundId) {
      fetchScoreBreakdown();
    }
  }, [isOpen, teamId, roundId]);

  const fetchScoreBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ranking.getScoreBreakdown(teamId, roundId);
      setBreakdownData(data);
    } catch (err) {
      setError('Không thể tải chi tiết điểm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết bảng điểm - <span className="text-blue-600">{teamName}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="text-gray-500">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : breakdownData.length === 0 ? (
            <div className="text-gray-500 text-center py-4">Chưa có dữ liệu chấm điểm cho đội này.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giám khảo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu chí</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trọng số</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhận xét</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdownData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">{row.judgeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.criterionName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center">{row.criterionWeight}%</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-center">{row.scoreValue}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 italic max-w-xs truncate" title={row.judgeComment ?? ''}>
                      {row.judgeComment || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};