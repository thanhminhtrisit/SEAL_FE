import React, { useEffect, useState, useMemo } from 'react';
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

  // Logic: Nhóm dữ liệu (Group By) theo tên Giám khảo
  const groupedData = useMemo(() => {
    return breakdownData.reduce((acc, curr) => {
      if (!acc[curr.judgeName]) {
        acc[curr.judgeName] = {
          generalComment: curr.generalComment,
          totalScore: 0,
          criteria: [],
        };
      }
      acc[curr.judgeName].criteria.push(curr);
      // Cộng dồn điểm thô
      acc[curr.judgeName].totalScore += curr.scoreValue;
      return acc;
    }, {} as Record<string, { generalComment: string | null; totalScore: number; criteria: ScoreBreakdownResponse[] }>);
  }, [breakdownData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết bảng điểm - <span className="text-blue-600">{teamName}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="text-gray-500 font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4 bg-red-50 rounded border border-red-100">{error}</div>
          ) : breakdownData.length === 0 ? (
            <div className="text-gray-500 text-center py-8 italic">Chưa có dữ liệu chấm điểm cho đội này.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([judgeName, judgeData]) => (
                <div key={judgeName} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  
                  {/* Header của từng giám khảo */}
                  <div className="bg-blue-50/50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-blue-900 text-lg">Giám khảo: {judgeName}</span>
                    <span className="text-sm font-semibold text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                      Tổng điểm thô: {judgeData.totalScore}
                    </span>
                  </div>

                  {/* Nhận xét tổng quát (Chỉ hiển thị nếu có) */}
                  {judgeData.generalComment && (
                    <div className="px-5 py-3 bg-amber-50/50 border-b border-gray-200">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Nhận xét tổng quát</p>
                      <p className="text-sm text-gray-800 italic">{judgeData.generalComment}</p>
                    </div>
                  )}

                  {/* Bảng điểm chi tiết của giám khảo */}
                  <div className="overflow-x-auto p-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Tiêu chí</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Trọng số</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Điểm</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhận xét chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {judgeData.criteria.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.criterionName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.criterionWeight}</td>
                            <td className="px-4 py-3 text-sm font-bold text-blue-600 text-center">{item.scoreValue}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 italic">
                              {item.judgeComment || <span className="text-gray-400 font-normal">Không có</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};