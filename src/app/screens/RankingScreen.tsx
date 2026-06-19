// src/app/screens/RankingScreen.tsx
import React, { useState, useEffect } from 'react';
import { ranking } from '../../api/ranking'; 
import { RankingResponse } from '../../app/types';

interface RankingScreenProps {
  roundId: number; // Truyền ID của vòng thi vào đây (VD: 1)
  isCoordinator?: boolean; // Nếu là Coordinator thì mới hiện nút "Tính toán"
}

export const RankingScreen: React.FC<RankingScreenProps> = ({ roundId = 1, isCoordinator = true }) => {
  const [rankings, setRankings] = useState<RankingResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load data lần đầu
  useEffect(() => {
    fetchRankings();
  }, [roundId]);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      const data = await ranking.getRankings(roundId);
      setRankings(data);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải dữ liệu xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComputeRanking = async () => {
    setIsLoading(true);
    try {
      const data = await ranking.computeRanking(roundId);
      setRankings(data);
      setError(null);
      alert('Đã tính toán và cập nhật xếp hạng thành công!');
    } catch (err: any) {
      setError('Lỗi khi tính toán xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Bảng Xếp Hạng Vòng {roundId}</h2>
        
        {isCoordinator && (
          <button 
            onClick={handleComputeRanking}
            disabled={isLoading}
            className={`px-4 py-2 font-semibold text-white rounded-md transition-all 
              ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Đang xử lý...' : 'Tính toán Xếp hạng'}
          </button>
        )}
      </div>

      {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Hạng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Đội thi</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Tổng Điểm</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rankings.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu xếp hạng. Hãy ấn tính toán!</td>
              </tr>
            ) : (
              rankings.map((team, index) => (
                <tr key={team.teamId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    #{team.rankPosition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {team.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-center">
                    {team.totalScore.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {team.isPromoted ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Thăng hạng
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                        Dừng bước
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};