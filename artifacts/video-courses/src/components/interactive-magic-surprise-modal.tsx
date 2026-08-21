import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  Wand2, 
  Gift, 
  ArrowRight, 
  Check, 
  Copy, 
  RotateCcw, 
  X, 
  Star, 
  ShieldCheck, 
  Gamepad2,
  Lock,
  User,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface InteractiveMagicSurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CardItem {
  id: string;
  name: string;
  suit: string;
  symbol: string;
  color: "red" | "black" | "gold";
  isWinner: boolean;
}

const INITIAL_CARDS: CardItem[] = [
  {
    id: "king",
    name: "Король Червей",
    suit: "♥",
    symbol: "♥️",
    color: "red",
    isWinner: false,
  },
  {
    id: "ace",
    name: "Золотой Туз",
    suit: "♠",
    symbol: "♠️",
    color: "gold",
    isWinner: true,
  },
  {
    id: "queen",
    name: "Дама Бубен",
    suit: "♦",
    symbol: "♦️",
    color: "red",
    isWinner: false,
  },
];

const MAX_ATTEMPTS = 2;

export function InteractiveMagicSurpriseModal({
  isOpen,
  onClose,
}: InteractiveMagicSurpriseModalProps) {
  const { user, isAuthenticated } = useAuth();

  // Game states: "intro" | "shuffling" | "guessing" | "won" | "lost" | "no_attempts"
  const [gameState, setGameState] = useState<"intro" | "shuffling" | "guessing" | "won" | "lost" | "no_attempts">("intro");
  const [cardPositions, setCardPositions] = useState<number[]>([0, 1, 2]); // indices in INITIAL_CARDS
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [shuffleStepText, setShuffleStepText] = useState("Следи за картами...");
  const [attemptsUsed, setAttemptsUsed] = useState<number>(0);

  // User storage key for attempts
  const userStorageKey = user ? `magic_game_attempts_${user.id}` : "magic_game_attempts_guest";

  // Fetch active promo code settings configured by Admin
  const { data: promoSettings, isLoading: promoLoading } = useQuery({
    queryKey: ["site-settings", "game_promocode"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings/game_promocode");
      if (!res.ok) return null;
      const data = await res.json();
      return data.value;
    },
    enabled: isOpen,
    staleTime: 60000,
  });

  // Game is considered enabled only when admin explicitly saved it with isActive=true and a real code
  const isGameEnabled = !promoLoading && promoSettings?.isActive === true && !!promoSettings?.code;

  const promoCode = promoSettings?.code || "";
  const discountLabel = promoSettings?.discountType === "fixed"
    ? `-${promoSettings?.discountAmount || 500} ₽`
    : `-${promoSettings?.discountPercent || 20}%`;

  // Load user attempts on modal open
  useEffect(() => {
    if (isOpen) {
      setGameState("intro");
      setCardPositions([0, 1, 2]);
      setSelectedCardIdx(null);
      setCopied(false);

      if (user?.id) {
        try {
          const stored = localStorage.getItem(`magic_game_attempts_${user.id}`);
          const count = stored ? parseInt(stored, 10) : 0;
          setAttemptsUsed(isNaN(count) ? 0 : count);
          if (count >= MAX_ATTEMPTS) {
            setGameState("no_attempts");
          }
        } catch {
          setAttemptsUsed(0);
        }
      }
    }
  }, [isOpen, user?.id]);

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attemptsUsed);

  // Start real shuffle animation
  const handleStartGame = () => {
    if (attemptsLeft <= 0) {
      setGameState("no_attempts");
      return;
    }

    setGameState("shuffling");
    setShuffleStepText("Карты переворачиваются... Запоминай положение!");

    let currentPos = [0, 1, 2];
    const totalSwaps = promoSettings?.gameDifficulty === "hard" ? 7 : promoSettings?.gameDifficulty === "easy" ? 3 : 5;
    let count = 0;

    const interval = setInterval(() => {
      count++;
      const i1 = Math.floor(Math.random() * 3);
      let i2 = (i1 + 1 + Math.floor(Math.random() * 2)) % 3;
      const newPos = [...currentPos];
      const temp = newPos[i1];
      newPos[i1] = newPos[i2];
      newPos[i2] = temp;
      currentPos = newPos;
      setCardPositions([...newPos]);

      if (count === 1) setShuffleStepText("Идет перемешивание... Следи за Золотым Тузом ♠️!");
      if (count === 3) setShuffleStepText("Ловкость рук иллюзиониста...");

      if (count >= totalSwaps) {
        clearInterval(interval);
        setTimeout(() => {
          setGameState("guessing");
          setShuffleStepText("Где спрятался Золотой Туз? Нажми на карту!");
        }, 400);
      }
    }, 420);
  };

  // User guesses a card
  const handlePickCard = (slotIndex: number) => {
    if (gameState !== "guessing") return;
    setSelectedCardIdx(slotIndex);
    const chosenCard = INITIAL_CARDS[cardPositions[slotIndex]];

    // Increment attempts count
    const nextAttempts = attemptsUsed + 1;
    setAttemptsUsed(nextAttempts);
    if (user?.id) {
      try {
        localStorage.setItem(`magic_game_attempts_${user.id}`, String(nextAttempts));
      } catch {}
    }

    if (chosenCard.isWinner) {
      setGameState("won");
      try {
        localStorage.setItem("applied_promocode", JSON.stringify({
          code: promoCode,
          discountPercent: promoSettings?.discountPercent || 20,
          discountAmount: promoSettings?.discountAmount || 0,
          discountType: promoSettings?.discountType || "percent",
        }));
      } catch {}
    } else {
      if (nextAttempts >= MAX_ATTEMPTS) {
        setGameState("no_attempts");
      } else {
        setGameState("lost");
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    try {
      localStorage.setItem("applied_promocode", JSON.stringify({
        code: promoCode,
        discountPercent: promoSettings?.discountPercent || 20,
        discountAmount: promoSettings?.discountAmount || 0,
        discountType: promoSettings?.discountType || "percent",
      }));
    } catch {}
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetGame = () => {
    if (attemptsLeft <= 0) {
      setGameState("no_attempts");
      return;
    }
    setGameState("intro");
    setCardPositions([0, 1, 2]);
    setSelectedCardIdx(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 xs:p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg sm:max-w-2xl bg-[#0f0d15] text-white rounded-3xl border border-amber-500/30 shadow-[0_0_60px_rgba(251,191,36,0.2)] overflow-hidden z-10 animate-in zoom-in-95 duration-300 my-auto max-h-[92vh] flex flex-col">
        {/* Glow ambient spots */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/25 rounded-full blur-[100px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all z-20"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Scrollable Content Area */}
        <div className="p-5 xs:p-6 sm:p-8 md:p-10 relative z-10 space-y-5 overflow-y-auto">

          {/* ──────── GUEST NOT LOGGED IN STATE ──────── */}
          {!isAuthenticated ? (
            <div className="text-center py-4 sm:py-6 space-y-6 animate-in fade-in">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-black uppercase tracking-wider">
                  <Gamepad2 className="h-3.5 w-3.5" /> Вход для участия в игре
                </div>
                <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-white">
                  Авторизуйтесь, чтобы сыграть!
                </h3>
                <p className="text-xs xs:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Игра «Найди Золотого Туза» с призовым промокодом доступна только зарегистрированным пользователям (каждому даётся ровно <span className="text-amber-400 font-bold">2 попытки</span>).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
                <Button size="lg" className="w-full h-12 rounded-2xl font-bold btn-glow" asChild onClick={onClose}>
                  <Link href="/auth/login">
                    Войти в аккаунт <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full h-12 rounded-2xl font-semibold border-white/20 hover:bg-white/10" asChild onClick={onClose}>
                  <Link href="/auth/register">
                    Регистрация
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* ──────── LOGGED IN USER GAME AREA ──────── */
            <>
              {/* ── Loading state while fetching promo settings ── */}
              {promoLoading ? (
                <div className="text-center py-12 space-y-4 animate-in fade-in">
                  <div className="h-14 w-14 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin mx-auto" />
                  <p className="text-slate-300 text-sm font-semibold">Загружаем настройки игры...</p>
                </div>
              ) : !isGameEnabled ? (
                /* ── Game NOT enabled by admin ── */
                <div className="text-center py-6 space-y-6 animate-in fade-in">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-3xl sm:text-4xl">🎩</span>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" /> Скоро
                    </div>
                    <h3 className="text-xl xs:text-2xl sm:text-3xl font-black text-white leading-tight">
                      Игра скоро появится!
                    </h3>
                    <p className="text-xs xs:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Администратор ещё не активировал промокод для интерактивной игры. Загляните позже — скоро вас ждёт приятный сюрприз! 🎁
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold text-white transition-all"
                  >
                    Понятно, вернуться позже
                  </button>
                </div>
              ) : (
              /* ──────── ACTUAL GAME (admin enabled it) ──────── */
              <>
              {/* Header Title & Attempts Indicator */}
              <div className="text-center space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] xs:text-xs font-black uppercase tracking-wider">
                    <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
                    Найди Золотого Туза
                  </div>

                  {/* Attempts badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] xs:text-xs font-black border ${
                    attemptsLeft > 0 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}>
                    <span>Попыток: {attemptsLeft} из {MAX_ATTEMPTS}</span>
                    <span className="flex gap-0.5">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`inline-block h-2 w-2 rounded-full ${
                            i < attemptsLeft ? "bg-emerald-400 shadow-sm" : "bg-slate-600"
                          }`} 
                        />
                      ))}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {gameState === "won" ? "🎉 Победа! Трюк раскрыт!" : 
                   gameState === "lost" ? "🪄 Карта переместилась!" :
                   gameState === "no_attempts" ? "Попытки исчерпаны 🪄" :
                   "Хочешь удивить друзей и забрать скидку?"}
                </h3>

                <p className="text-[11px] xs:text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {gameState === "intro" && "Запомни, где Золотой Туз ♠️. Нажми 'Начать игру', следи за перемешиванием и угадай карту!"}
                  {gameState === "shuffling" && shuffleStepText}
                  {gameState === "guessing" && "Перемешивание завершено! Нажми на карту, где находится Золотой Туз ♠️:"}
                  {gameState === "won" && "Великолепно! Ты раскрыл трюк мастера и выиграл персональный промокод!"}
                  {gameState === "lost" && `Ловкость рук иллюзиониста обманула зрение! У тебя осталась ещё ${attemptsLeft} попытка!`}
                  {gameState === "no_attempts" && "Вы использовали все 2 попытки! Ловкость рук иллюзиониста оказалась быстрее. Выберите курс в каталоге!"}
                </p>
              </div>

              {/* ──────── 3 CARDS TABLE (MOBILE RESPONSIVE) ──────── */}
              <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4 py-1">
                {cardPositions.map((cardIndex, slotIdx) => {
                  const card = INITIAL_CARDS[cardIndex];
                  const isFaceUp = gameState === "intro" || gameState === "won" || gameState === "lost" || gameState === "no_attempts";
                  const isSelected = selectedCardIdx === slotIdx;

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => handlePickCard(slotIdx)}
                      className={`relative aspect-[3/4] rounded-xl xs:rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col items-center justify-between p-2 xs:p-3 sm:p-4 select-none ${
                        gameState === "guessing"
                          ? "cursor-pointer hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] bg-gradient-to-b from-indigo-950 to-slate-950 border-amber-500/40"
                          : isFaceUp
                          ? card.isWinner
                            ? "bg-gradient-to-b from-amber-400/25 via-amber-500/10 to-slate-950 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)]"
                            : "bg-slate-900/90 border-white/10"
                          : "bg-gradient-to-b from-indigo-950 to-slate-950 border-amber-500/20"
                      } ${isSelected ? "ring-2 ring-amber-400" : ""}`}
                    >
                      {isFaceUp ? (
                        /* ── FACE UP CARD ── */
                        <>
                          <div className="w-full flex justify-between items-center text-[10px] xs:text-xs font-black">
                            <span className={card.color === "gold" ? "text-amber-400" : card.color === "red" ? "text-rose-400" : "text-slate-200"}>
                              {card.suit}
                            </span>
                            {card.isWinner && (
                              <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] xs:text-[9px] font-black uppercase">
                                ПРИЗ
                              </span>
                            )}
                          </div>

                          <div className="my-auto flex flex-col items-center text-center">
                            <span className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl drop-shadow ${card.isWinner ? "animate-bounce" : ""}`}>
                              {card.symbol}
                            </span>
                            <span className={`text-[9px] xs:text-[10px] sm:text-xs font-extrabold mt-1 sm:mt-2 line-clamp-1 ${card.isWinner ? "text-amber-400" : "text-slate-200"}`}>
                              {card.name}
                            </span>
                          </div>

                          <div className="w-full text-center">
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-slate-400 font-semibold line-clamp-1">
                              {card.isWinner ? "★ Главная ★" : "Обычная"}
                            </span>
                          </div>
                        </>
                      ) : (
                        /* ── FACE DOWN CARD (MAGIC CARD BACK) ── */
                        <div className="w-full h-full flex flex-col items-center justify-center relative rounded-lg xs:rounded-xl border border-amber-400/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-indigo-950/60 to-slate-950 p-1">
                          <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full border border-dashed border-amber-400/40 flex items-center justify-center text-sm xs:text-base sm:text-xl shadow-inner">
                            🪄
                          </div>
                          <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-amber-400/80 mt-1 sm:mt-2 tracking-wider uppercase text-center">
                            {gameState === "guessing" ? "Нажми" : "Секрет"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ──────── ACTION CONTROLS / RESULT BOX ──────── */}

              {/* Intro State: Start Game Button */}
              {gameState === "intro" && attemptsLeft > 0 && (
                <div className="text-center pt-1">
                  <Button
                    size="lg"
                    onClick={handleStartGame}
                    className="btn-glow font-black rounded-2xl h-12 xs:h-13 sm:h-14 px-6 sm:px-8 text-sm sm:text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-primary w-full sm:w-auto shadow-xl shadow-amber-500/25"
                  >
                    <Wand2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Начать игру ({attemptsLeft} поп.)
                  </Button>
                </div>
              )}

              {/* Shuffling State: Loading Indicator */}
              {gameState === "shuffling" && (
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm animate-pulse">
                    <Sparkles className="h-4 w-4 animate-spin" /> {shuffleStepText}
                  </div>
                </div>
              )}

              {/* Guessing State: Instruction Banner */}
              {gameState === "guessing" && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center text-xs sm:text-sm font-bold text-amber-400 animate-pulse">
                  👆 Нажми на карту выше, где спрятан Золотой Туз ♠️
                </div>
              )}

              {/* ──────── WON STATE: PROMOCODE BOX & CTA ──────── */}
              {gameState === "won" && (
                <div className="space-y-3 sm:space-y-4 animate-in zoom-in-95 duration-300">
                  
                  {/* Prize Card */}
                  <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
                          <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-wider">Приз за победу в игре</div>
                          <div className="font-black text-sm xs:text-base sm:text-lg text-white">
                            Скидка {discountLabel} на любой курс
                          </div>
                        </div>
                      </div>
                      <span className="hidden xs:inline-flex px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-black border border-emerald-500/20 shrink-0">
                        АКТИВИРОВАН
                      </span>
                    </div>

                    {/* Promo Code Box */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/50 border border-amber-500/40 gap-2">
                      <div className="flex items-center gap-2 pl-1.5">
                        <span className="text-[10px] xs:text-xs text-slate-400 font-bold">КОД:</span>
                        <span className="font-mono font-black text-base xs:text-lg sm:text-xl text-amber-400 tracking-wider truncate">{promoCode}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCopyCode}
                        className={`rounded-xl font-bold text-xs h-9 px-3 sm:px-4 transition-all shrink-0 ${
                          copied 
                            ? "bg-emerald-500 text-white" 
                            : "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md"
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" /> Применено!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Скопировать
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <Button
                      size="lg"
                      className="w-full sm:flex-1 h-12 xs:h-13 rounded-2xl font-black bg-gradient-to-r from-amber-400 via-amber-500 to-primary text-slate-950 hover:opacity-90 shadow-xl shadow-amber-500/25 transition-all text-xs xs:text-sm sm:text-base border-none"
                      asChild
                      onClick={onClose}
                    >
                      <Link href="/catalog" className="inline-flex items-center justify-center gap-2">
                        <span>Выбрать курс со скидкой {discountLabel}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                </div>
              )}

              {/* ──────── LOST STATE (1 ATTEMPT REMAINING) ──────── */}
              {gameState === "lost" && attemptsLeft > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 animate-in fade-in">
                  <p className="text-xs sm:text-sm text-slate-300">
                    Не угадал! Но у тебя осталась ещё <span className="text-amber-400 font-bold">1 попытка</span>! Соберись и попробуй снова!
                  </p>

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleResetGame}
                      className="btn-glow font-bold rounded-2xl h-11 sm:h-12 px-6 bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs sm:text-sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Использовать 2-ю попытку
                    </Button>
                  </div>
                </div>
              )}

              {/* ──────── NO ATTEMPTS REMAINING STATE ──────── */}
              {gameState === "no_attempts" && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 text-center space-y-3.5 animate-in fade-in">
                  <div className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <AlertCircle className="h-4 w-4 text-amber-400" /> Вы использовали все 2 попытки
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    Ловкость рук иллюзиониста оказалась быстрее! Но вы можете выбрать понравившийся видеокурс в каталоге со скидками до 40%!
                  </p>
                  <Button
                    size="lg"
                    className="rounded-2xl font-bold btn-glow h-11 sm:h-12 px-6 text-xs sm:text-sm"
                    asChild
                    onClick={onClose}
                  >
                    <Link href="/catalog">
                      Перейти в каталог курсов <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
              </>
              )}
            </>
          )}


        </div>
      </div>
    </div>
  );
}
