import React, { useState } from 'react';
import { GradeLevel, GameModule } from './types';
import FractionGame from './components/FractionGame';
import EquationGame from './components/EquationGame';
import ShapeGame from './components/ShapeGame';
import VolumeGame from './components/VolumeGame';
import TriangleGame from './components/TriangleGame';
import AngleGame from './components/AngleGame';
import CoinGame from './components/CoinGame';
import DiceGame from './components/DiceGame';
import PieChartGame from './components/PieChartGame';
import LineChartGame from './components/LineChartGame';
import BarChartGame from './components/BarChartGame';
import IdentityGame from './components/IdentityGame';
import TriangleCongruenceGame from './components/TriangleCongruenceGame';
import LCMGCDGame from './components/LCMGCDGame';
import PolynomialGame from './components/PolynomialGame';
import DataClassificationGame from './components/DataClassificationGame';
import FarmGame from './components/FarmGame';
import RationalNumberGame from './components/RationalNumberGame';
import RealNumberGame from './components/RealNumberGame';
import { BookOpen, Calculator, GraduationCap, Trophy, Users, Star, ArrowRight, Sprout, Medal, Crown } from 'lucide-react';

// Constants
const GRADES: GradeLevel[] = [6, 7, 8, 9];
const GAME_MODULES: Record<GradeLevel, GameModule[]> = {
  6: [
    { id: 'mathfarm', title: 'Nông trại Toán học', description: 'Giải toán trắc nghiệm (ƯCLN, BCNN, Số nguyên) để xây dựng nông trại.', grade: 6, icon: 'sprout' },
    { id: 'fractions', title: 'Thế giới Phân số', description: 'Khám phá, so sánh và cộng trừ phân số trực quan.', grade: 6, icon: 'pie-chart' },
    { id: 'lcmgcd', title: 'ƯCLN & BCNN', description: 'Tìm ước chung và bội chung bằng cách phân tích thừa số nguyên tố.', grade: 6, icon: 'calculator' },
    { id: 'shapes', title: 'Xưởng Hình Học', description: 'Nhận diện và tạo dựng các hình tứ giác cơ bản.', grade: 6, icon: 'shapes' },
    { id: 'angles', title: 'Thử tài Đo góc', description: 'Học cách sử dụng thước đo góc để đo độ lớn góc xOy.', grade: 6, icon: 'compass' },
    { id: 'probability', title: 'Tung Đồng Xu', description: 'Thực nghiệm xác suất: Ghi nhận kết quả Sấp/Ngửa.', grade: 6, icon: 'coins' },
    { id: 'barchart', title: 'Biểu đồ Cột & Cột Kép', description: 'Vẽ và phân tích số liệu thống kê từ biểu đồ cột.', grade: 6, icon: 'bar-chart' }
  ],
  7: [
    { id: 'mathfarm', title: 'Nông trại Lớp 7', description: 'Ôn tập toàn diện: Số hữu tỉ, Đa thức, Hình học và Thống kê qua game nông trại.', grade: 7, icon: 'sprout' },
    { id: 'rational', title: 'Số Hữu Tỉ', description: 'Cộng, trừ, nhân, chia số hữu tỉ. Rèn luyện kỹ năng tính toán.', grade: 7, icon: 'calculator' },
    { id: 'realnumbers', title: 'Số Thực & Căn Bậc Hai', description: 'Làm quen với số vô tỉ, căn bậc hai số học và làm tròn số.', grade: 7, icon: 'calculator' },
    { id: 'angles_7', title: 'Góc & Đường thẳng', description: 'Góc đối đỉnh, kề bù, so le trong, đồng vị và hai đường thẳng song song.', grade: 7, icon: 'compass' },
    { id: 'dataclass', title: 'Phân loại Dữ liệu', description: 'Phân biệt dữ liệu định tính/định lượng và tính tỉ lệ phần trăm.', grade: 7, icon: 'table' },
    { id: 'polynomials', title: 'Đại số: Đa thức', description: 'Nhận diện đơn thức, đồng dạng và cộng trừ đa thức cột dọc.', grade: 7, icon: 'calculator' },
    { id: 'volume', title: 'Thể tích Hình hộp', description: 'Khám phá thể tích hình hộp chữ nhật qua các khối lập phương.', grade: 7, icon: 'box' },
    { id: 'triangles', title: 'Các đường trong Tam giác', description: 'Trung tuyến, Phân giác, Trung trực, Đường cao & Các đường tròn.', grade: 7, icon: 'triangle' },
    { id: 'congruence', title: '2 Tam giác bằng nhau', description: 'Lý thuyết và bài tập chứng minh các trường hợp bằng nhau của tam giác.', grade: 7, icon: 'triangle-box' },
    { id: 'dice', title: 'Gieo Xúc Xắc', description: 'Xác suất thực nghiệm với 1 hoặc 2 viên xúc xắc.', grade: 7, icon: 'dices' },
    { id: 'piechart', title: 'Biểu đồ Hình quạt', description: 'Đọc hiểu biểu đồ và tính toán số liệu thống kê.', grade: 7, icon: 'pie-chart' },
    { id: 'linechart', title: 'Biểu đồ Đoạn thẳng', description: 'Phân tích sự thay đổi của đại lượng theo thời gian.', grade: 7, icon: 'trending-up' }
  ],
  8: [
    { id: 'equations', title: 'Cân bằng Phương trình', description: 'Giải phương trình bậc nhất một ẩn bằng mô hình cái cân.', grade: 8, icon: 'scale' },
    { id: 'identities', title: '7 Hằng đẳng thức', description: 'Game ghi nhớ và luyện tập 7 hằng đẳng thức đáng nhớ.', grade: 8, icon: 'book' }
  ],
  9: []
};

function App() {
  const [currentGrade, setCurrentGrade] = useState<GradeLevel | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [showStarAnim, setShowStarAnim] = useState(false);

  // --- Rank Logic ---
  const getRank = (score: number) => {
    if (score < 50) return { title: 'Tập sự', color: 'text-slate-500', icon: <Users className="w-5 h-5"/> };
    if (score < 100) return { title: 'Hạng Đồng', color: 'text-orange-600', icon: <Medal className="w-5 h-5 text-orange-500"/> };
    if (score < 200) return { title: 'Hạng Bạc', color: 'text-slate-400', icon: <Medal className="w-5 h-5 text-slate-400"/> };
    if (score < 500) return { title: 'Hạng Vàng', color: 'text-yellow-500', icon: <Medal className="w-5 h-5 text-yellow-400"/> };
    return { title: 'Chiến thần hạng A', color: 'text-red-600', icon: <Crown className="w-5 h-5 text-red-500 animate-bounce"/> };
  };

  const handleGameSelect = (gameId: string) => {
    setActiveGameId(gameId);
  };

  const handleBackToHome = () => {
    setCurrentGrade(null);
    setActiveGameId(null);
  };

  const handleBackToGrade = () => {
    setActiveGameId(null);
  };

  const handleScoreUpdate = (points: number) => {
      setTotalScore(prev => prev + points);
      // Trigger animation
      setShowStarAnim(true);
      setTimeout(() => setShowStarAnim(false), 1000);
  };

  // --- Render Active Game ---
  const renderGame = () => {
      switch (activeGameId) {
          // Grade 6
          case 'mathfarm': return <FarmGame onBack={handleBackToGrade} grade={currentGrade || 6} />;
          case 'fractions': return <FractionGame onBack={handleBackToGrade} />;
          case 'lcmgcd': return <LCMGCDGame onBack={handleBackToGrade} />;
          case 'shapes': return <ShapeGame onBack={handleBackToGrade} />;
          case 'angles': return <AngleGame onBack={handleBackToGrade} />;
          case 'probability': return <CoinGame onBack={handleBackToGrade} />;
          case 'barchart': return <BarChartGame onBack={handleBackToGrade} />;
          
          // Grade 7
          case 'rational': return <RationalNumberGame onBack={handleBackToGrade} onScoreUpdate={handleScoreUpdate} />;
          case 'realnumbers': return <RealNumberGame onBack={handleBackToGrade} onScoreUpdate={handleScoreUpdate} />;
          case 'angles_7': return <AngleGame onBack={handleBackToGrade} />; // Reused updated AngleGame
          case 'dataclass': return <DataClassificationGame onBack={handleBackToGrade} />;
          case 'polynomials': return <PolynomialGame onBack={handleBackToGrade} />;
          case 'volume': return <VolumeGame onBack={handleBackToGrade} />;
          case 'triangles': return <TriangleGame onBack={handleBackToGrade} />;
          case 'congruence': return <TriangleCongruenceGame onBack={handleBackToGrade} />;
          case 'dice': return <DiceGame onBack={handleBackToGrade} />;
          case 'piechart': return <PieChartGame onBack={handleBackToGrade} />;
          case 'linechart': return <LineChartGame onBack={handleBackToGrade} />;

          // Grade 8
          case 'equations': return <EquationGame onBack={handleBackToGrade} />;
          case 'identities': return <IdentityGame onBack={handleBackToGrade} />;
          
          default: return null;
      }
  };

  const rank = getRank(totalScore);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-gradient-to-br from-teal-50 to-slate-100 overflow-hidden relative">
      
      {/* Floating Star Animation */}
      {showStarAnim && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce-small">
              <Star className="w-32 h-32 fill-yellow-400 text-yellow-600 drop-shadow-2xl opacity-90" />
          </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToHome}>
            <div className="bg-teal-600 p-2 rounded-lg">
               <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-teal-800 leading-tight">TOÁN THCS</h1>
              <p className="text-xs text-slate-500 font-semibold">Giáo viên: Hoàng Trí Toàn</p>
            </div>
          </div>
          
          {/* User Rank & Score */}
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                 <span className={`text-sm font-bold uppercase ${rank.color}`}>{rank.title}</span>
                 <div className="w-24 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-yellow-400" style={{ width: `${(totalScore % 100)}%` }}></div>
                 </div>
             </div>
             <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200 shadow-sm">
                 {rank.icon}
                 <span className="font-bold text-yellow-800">{totalScore}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        
        {activeGameId ? (
            renderGame()
        ) : !currentGrade ? (
          // Dashboard View
          <div className="space-y-12 animate-fade-in-up">
            <div className="text-center space-y-4 mt-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-teal-900">
                Học Toán thật vui <br/> cùng <span className="text-teal-600">Thầy Toàn</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Chọn khối lớp của em để bắt đầu hành trình khám phá các con số, hình học và đại số thú vị!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {GRADES.map((grade) => (
                <div 
                  key={grade}
                  onClick={() => setCurrentGrade(grade)}
                  className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border-2 border-transparent hover:border-teal-400 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <span className="inline-block bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded mb-3">
                      LỚP {grade}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-teal-700">Khối {grade}</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {grade === 6 ? 'Số học, Hình học & Thống kê' : 
                       grade === 7 ? 'Số hữu tỉ, Thực & Hình học' :
                       grade === 8 ? 'Đa thức & Tứ giác' : 'Căn bậc hai & Hệ phương trình'}
                    </p>
                    <div className="flex justify-end">
                       <div className="bg-slate-100 p-2 rounded-full group-hover:bg-teal-600 group-hover:text-white transition-colors">
                         <ArrowRight className="w-5 h-5" />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Grade View
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-8 text-slate-500 text-sm font-bold uppercase tracking-wider">
               <span onClick={handleBackToHome} className="cursor-pointer hover:underline">Trang chủ</span>
               <span>/</span>
               <span className="text-teal-600">Lớp {currentGrade}</span>
            </div>

            <div className="flex items-end justify-between mb-8">
               <div>
                 <h2 className="text-3xl font-bold text-slate-800">Bài học Lớp {currentGrade}</h2>
                 <p className="text-slate-500">Chọn một chủ đề để bắt đầu luyện tập</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAME_MODULES[currentGrade].length > 0 ? (
                GAME_MODULES[currentGrade].map(game => (
                  <div 
                    key={game.id}
                    onClick={() => handleGameSelect(game.id)}
                    className="bg-white rounded-xl shadow-md border border-slate-100 hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer p-6 flex flex-col group"
                  >
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      {game.icon === 'sprout' ? <Sprout className="w-6 h-6" /> : 
                       game.icon === 'table' ? <Users className="w-6 h-6"/> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{game.title}</h3>
                    <p className="text-slate-500 text-sm flex-1 mb-4">{game.description}</p>
                    <button className="w-full py-2 bg-slate-50 text-teal-700 font-bold rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      Bắt đầu ngay
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600">Nội dung đang được cập nhật</h3>
                  <p className="text-slate-400">Thầy Toàn đang soạn bài, các em quay lại sau nhé!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-bold text-white mb-1">Ứng dụng Toán học THCS</p>
            <p className="text-sm">Phát triển bởi thầy Hoàng Trí Toàn © {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-4">
             <Users className="w-5 h-5 hover:text-teal-400 cursor-pointer" />
             <Star className="w-5 h-5 hover:text-yellow-400 cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
